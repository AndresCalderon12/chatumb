const User = require('../models/usermodels');

module.exports = {
  firstUpper: username => {
    const name = username.toLowerCase();
    return name.charAt(0).toUpperCase() + name.slice(1);
  },
  lowerCase: str => {
    return str.toLowerCase();
  },

  updateChatList: async (req, message) => {
    await User.update(
      {
        _id: req.user._id
      },
      {
        $pull: {
          chatlist: {
            receiverId: req.params.receiver_Id
          }
        }
      }
    );
    await User.update(
      {
        _id: req.params.receiver_Id
      },
      {
        $pull: {
          chatlist: {
            receiverId: req.user._id
          }
        }
      }
    );
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
                msgId: message._id
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
                msgId: message._id
              }
            ],
            $position: 0
          }
        }
      }
    );
  }
};
