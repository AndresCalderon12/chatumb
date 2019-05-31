const httpStatus = require('http-status-codes');
const User = require('../models/usermodels');
const moment = require('moment');
const Joi = require('joi');
const bcrypt = require('bcryptjs');

module.exports = {
  async GetAllUsers(request, response) {
    await User.find({})
      .populate('posts.postId')
      .populate('following.userFollowed')
      .populate('followers.follower')
      .populate('chatList.receiverId')
      .populate('chatList.msgId')
      .populate('notifications.senderId')
      .then(result => {
        response.status(httpStatus.OK).json({ message: 'All Users', result });
      })
      .catch(err =>
        response
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Ha ocurrido un error' })
      );
  },
  async GetUser(request, response) {
    await User.findOne({ _id: request.params.id })
      .populate('posts.postId')
      .populate('following.userFollowed')
      .populate('followers.follower')
      .populate('chatList.receiverId')
      .populate('chatList.msgId')
      .populate('notifications.senderId')
      .then(result => {
        response.status(httpStatus.OK).json({ message: 'User By id', result });
      })
      .catch(err =>
        response
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Ha ocurrido un error' })
      );
  },
  async GetUserByName(request, response) {
    await User.findOne({ username: request.params.username })
      .populate('posts.postId')
      .populate('following.userFollowed')
      .populate('followers.follower')
      .populate('chatList.receiverId')
      .populate('chatList.msgId')
      .populate('notifications.senderId')
      .then(result => {
        response
          .status(httpStatus.OK)
          .json({ message: 'User By username', result });
      })
      .catch(err =>
        response
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Ha ocurrido un error' })
      );
  },
  async ProfileView(req, res) {
    const dateValue = moment().format('YYYY-MM-DD');
    await User.update(
      {
        _id: req.body.id,
        'notifications.date': { $ne: [dateValue, ''] },
        'notifications.senderId': { $ne: req.user._id }
      },
      {
        $push: {
          notifications: {
            senderId: req.user._id,
            message: `${req.user.username} Visito Tu perfil`,
            created: new Date(),
            data: dateValue,
            viewProfile: true
          }
        }
      }
    )
      .then(result => {
        response.status(httpStatus.OK).json({ message: 'Notification Sent' });
      })
      .catch(err =>
        response
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Ha ocurrido un error' })
      );
  },
  async ChangePassword(req, res) {
    const schema = Joi.object().keys({
      cpassword: Joi.string().required(),
      newPassword: Joi.string()
        .min(5)
        .required(),
      confirmPassword: Joi.string()
        .min(5)
        .required()
    });
    const { error, value } = Joi.validate(req.body, schema);
    if (error && error.details) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: error.details });
    }
    const user = await User.findOne({ _id: req.user._id });
    return bcrypt
      .compare(value.cpassword, user.password)
      .then(async result => {
        if (!result) {
          return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: 'Current Password is Incorrect' });
        }
        const newpassword = await User.EncryptPassword(req.body.newPassword);
        await User.update(
          {
            _id: req.user._id
          },
          {
            password: newpassword
          }
        );
      })
      .then(result => {
        res
          .status(httpStatus.OK)
          .json({ message: 'Password Change Succsecfully' });
      })
      .catch(err =>
        res
          .status(httpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Ha ocurrido un error' })
      );
  }
};
