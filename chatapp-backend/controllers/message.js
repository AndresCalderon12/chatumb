const HttpStatus = require('http-status-codes');
const Message = require('../models/messageModels');
const Conversation = require('../models/conversationModels');
const User = require('../models/usermodels');
const Helper = require('../Helpers/helpers');

module.exports = {
  async GetAllMessages(request, response) {
    const { sender_Id, receiver_Id } = request.params;
    const conversation = await Conversation.findOne({
      $or: [
        {
          $and: [
            { 'participants.senderId': sender_Id },
            { 'participants.receiverId': receiver_Id }
          ]
        },
        {
          $and: [
            { 'participants.senderId': receiver_Id },
            { 'participants.receiverId': sender_Id }
          ]
        }
      ]
    }).select('_id');
    if (conversation) {
      const messages = await Message.findOne({
        conversationId: conversation._id
      });
      response
        .status(HttpStatus.OK)
        .json({ message: 'Messages Returned', messages });
    }
  },

  SendMessage(request, response) {
    const { sender_Id, receiver_Id } = request.params;
    Conversation.find(
      {
        $or: [
          {
            participants: {
              $elemMatch: { senderId: sender_Id, receiverId: receiver_Id }
            }
          },
          {
            participants: {
              $elemMatch: { senderId: receiver_Id, receiverId: sender_Id }
            }
          }
        ]
      },
      async (err, result) => {
        if (result.length > 0) {
          const msg = await Message.findOne({ conversationId: result[0]._id });
          Helper.updateChatList(request, msg);
          await Message.update(
            {
              conversationId: result[0]._id
            },
            {
              $push: {
                message: {
                  senderId: request.user._id,
                  receiverId: request.params.receiver_Id,
                  sendername: request.user.username,
                  receivername: request.body.receiverName,
                  body: request.body.message
                }
              }
            }
          )
            .then(() =>
              response.status(HttpStatus.OK).json({ message: 'message added' })
            )
            .catch(err =>
              response
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Ha ocurrido un error' })
            );
        } else {
          const newConversation = new Conversation();
          newConversation.participants.push({
            senderId: request.user._id,
            receiverId: request.params.receiver_Id
          });
          const saveConversation = await newConversation.save();
          const newMessage = new Message();
          newMessage.conversationId = saveConversation._id;
          newMessage.sender = request.user.username;
          newMessage.receiver = request.body.receiverName;
          newMessage.message.push({
            senderId: request.user._id,
            receiverId: request.params.receiver_Id,
            sendername: request.user.username,
            receivername: request.body.receiverName,
            body: request.body.message
          });
          await User.update(
            {
              _id: request.user._id
            },
            {
              $push: {
                chatList: {
                  $each: [
                    {
                      receiverId: request.params.receiver_Id,
                      msgId: newMessage._id
                    }
                  ],
                  $position: 0
                }
              }
            }
          );

          await User.update(
            {
              _id: request.params.receiver_Id
            },
            {
              $push: {
                chatList: {
                  $each: [
                    {
                      receiverId: request.user._id,
                      msgId: newMessage._id
                    }
                  ],
                  $position: 0
                }
              }
            }
          );
          await newMessage
            .save()
            .then(() =>
              response.status(HttpStatus.OK).json({ message: 'message Sent' })
            )
            .catch(err =>
              response
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Ha ocurrido un error' })
            );
        }
      }
    );
  },
  async MarkReceiverMessages(req, res) {
    const { sender, receiver } = req.params;
    const msg = await Message.aggregate([
      { $unwind: '$message' },
      {
        $match: {
          $and: [
            { 'message.sendername': receiver, 'message.receivername': sender }
          ]
        }
      }
    ]);
    if (msg.length > 0) {
      try {
        msg.forEach(async value => {
          await Message.update(
            {
              'message._id': value.message._id
            },
            { $set: { 'message.$.isRead': true } }
          );
        });
        res.status(HttpStatus.OK).json({ message: 'Messages Marked as read ' });
      } catch (err) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Error Occured ' });
      }
    }
  },
  async MarkAllMessages(req, res) {
    const msg = await Message.aggregate([
      { $match: { 'message.receivername': req.user.username } },
      { $unwind: '$message' },
      { $match: { 'message.receivername': req.user.username } }
    ]);
    if (msg.length > 0) {
      try {
        msg.forEach(async value => {
          await Message.update(
            {
              'message._id': value.message._id
            },
            { $set: { 'message.$.isRead': false } }
          );
        });
        res
          .status(HttpStatus.OK)
          .json({ message: 'All Messages Marked as read ' });
      } catch (err) {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Error Occured ' });
      }
    }
  }
};
