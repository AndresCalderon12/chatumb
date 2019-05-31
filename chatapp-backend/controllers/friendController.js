const HttpStatus = require('http-status-codes');
const User = require('../models/usermodels');

module.exports = {
  FollowUser(request, response) {
    const followUser = async () => {
      await User.update(
        {
          _id: request.user._id,
          'following.userFollowed': { $ne: request.body.userFollowed }
        },
        {
          $push: {
            following: {
              userFollowed: request.body.userFollowed
            }
          }
        }
      );
      await User.update(
        {
          _id: request.body.userFollowed,
          'following.follower': { $ne: request.user._id }
        },
        {
          $push: {
            followers: {
              follower: request.user._id
            },
            notifications: {
              senderId: request.user._id,
              message: `${request.user.username} Ha empezado a seguirte `,
              created: new Date(),
              viewProfile: false
            }
          }
        }
      );
    };
    followUser()
      .then(() => {
        response.status(HttpStatus.OK).json({ message: 'Following User' });
      })
      .catch(err => {
        response
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Ha ocurrido un error' });
      });
  },
  UnFollowUser(request, response) {
    const unFollowUser = async () => {
      await User.update(
        {
          _id: request.user._id
        },
        {
          $pull: {
            following: {
              userFollowed: request.body.userFollowed
            }
          }
        }
      );
      await User.update(
        {
          _id: request.body.userFollowed
        },
        {
          $pull: {
            followers: {
              follower: request.user._id
            }
          }
        }
      );
    };
    unFollowUser()
      .then(() => {
        response.status(HttpStatus.OK).json({ message: 'UnFollowing User' });
      })
      .catch(err => {
        response
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Ha ocurrido un error' });
      });
  },
  async MarkNotification(request, response) {
    if (!request.body.deleteValue) {
      await User.updateOne(
        {
          _id: request.user._id,
          'notifications._id': request.params.id
        },
        {
          $set: { 'notifications.$.read': true }
        }
      )
        .then(() => {
          response.status(HttpStatus.OK).json({ message: 'Marked as read' });
        })
        .catch(err => {
          response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: 'Ha ocurrido un error' });
        });
    } else {
      await User.update(
        {
          _id: request.user._id,
          'notifications._id': request.params.id
        },
        {
          $pull: {
            notifications: { _id: request.params.id }
          }
        }
      )
        .then(() => {
          response
            .status(HttpStatus.OK)
            .json({ message: 'Deleted Succesfully' });
        })
        .catch(err => {
          response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: 'Ha ocurrido un error' });
        });
    }
  },
  async MarkAllNotifications(request, response) {
    await User.update(
      {
        _id: request.user._id
      },
      { $set: { 'notifications.$[elem].read': true } },
      { arrayFilters: [{ 'elem.read': false }], multi: true }
    )
      .then(() => {
        response
          .status(HttpStatus.OK)
          .json({ message: 'Mark All Succesfully' });
      })
      .catch(err => {
        response
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Ha ocurrido un error' });
      });
  }
};
