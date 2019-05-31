const joi = require('joi');
const Post = require('../models/postModels');
const HttpStatus = require('http-status-codes');
const User = require('../models/usermodels');
const cloudinary = require('cloudinary');
const moment = require('moment');
const Request = require('request');

cloudinary.config({
  cloud_name: 'dvguuv13q',
  api_key: '783927364725724',
  api_secret: 'BvAJ-v4q61crVGLlXDigOEIWnPw'
});

module.exports = {
  AddPost(request, response) {
    const schema = joi.object().keys({
      post: joi.string().required(),
      image: joi.string().optional()
    });
    const body = {
      post: request.body.post
    };

    const { error } = joi.validate(body, schema);
    if (error && error.details) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ msg: error.details });
    }
    const bodyObj = {
      user: request.user._id,
      username: request.user.username,
      post: request.body.post,
      created: new Date()
    };
    if (request.body.post && !request.body.image) {
      Post.create(bodyObj)
        .then(async post => {
          await User.update(
            {
              _id: request.user._id
            },
            {
              $push: {
                posts: {
                  postId: post._id,
                  post: request.body.post,
                  created: new Date()
                }
              }
            }
          );
          response.status(HttpStatus.OK).json({ message: 'Post Creado', post });
        })
        .catch(err => {
          response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: 'Ha ocurrido un error' });
        });
    }
    if (request.body.post && request.body.image) {
      cloudinary.uploader.upload(request.body.image, async result => {
        const requestBody = {
          user: request.user._id,
          username: request.user.username,
          post: request.body.post,
          imgId: result.public_id,
          imgVersion: result.version,
          created: new Date()
        };
        Post.create(requestBody)
          .then(async post => {
            await User.update(
              {
                _id: request.user._id
              },
              {
                $push: {
                  posts: {
                    postId: post._id,
                    post: request.body.post,
                    created: new Date()
                  }
                }
              }
            );
            response
              .status(HttpStatus.OK)
              .json({ message: 'Post Creado', post });
          })
          .catch(err => {
            response
              .status(HttpStatus.INTERNAL_SERVER_ERROR)
              .json({ message: 'Ha ocurrido un error' });
          });
      });
    }
  },
  async GetAllPost(req, respose) {
    try {
      const today = moment().startOf('day');
      const tomorrow = moment(today).add(1, 'days');

      const posts = await Post.find({
        created: { $gte: today.toDate(), $lt: tomorrow.toDate() }
      })
        .populate('user')
        .sort({ created: -1 });
      const top = await Post.find({
        totalLikes: { $gte: 2 },
        created: { $gte: today.toDate(), $lt: tomorrow.toDate() }
      })
        .populate('user')
        .sort({ created: -1 });
      const user = await User.findOne({ _id: req.user._id });
      if (user.city === '' && user.country === '') {
        Request(
          'https://geoip-db.com/json/',
          { json: true },
          async (err, res, body) => {
            await User.update(
              {
                _id: req.user._id
              },
              {
                city: body.city,
                country: body.country_name
              }
            );
          }
        );
      }

      return respose
        .status(HttpStatus.OK)
        .json({ message: 'All Posts', posts, top });
    } catch (err) {
      return respose
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Ha ocurrido un error' });
    }
  },
  async AddLike(request, response) {
    const postId = request.body._id;
    await Post.update(
      {
        _id: postId,
        'likes.username': { $ne: request.user.username }
      },
      {
        $push: {
          likes: {
            username: request.user.username
          }
        },
        $inc: { totalLikes: 1 }
      }
    )
      .then(() => {
        response.status(HttpStatus.OK).json({ message: 'You Liked the post' });
      })
      .catch(err => {
        response
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Ha ocurrido un error' });
      });
  },
  async AddComment(request, response) {
    const postId = request.body.postId;
    await Post.update(
      {
        _id: postId
      },
      {
        $push: {
          comments: {
            userId: request.user._id,
            username: request.user.username,
            comment: request.body.comment,
            createdAt: new Date()
          }
        }
      }
    )
      .then(() => {
        response
          .status(HttpStatus.OK)
          .json({ message: 'Comment Added to post' });
      })
      .catch(err => {
        response
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Ha ocurrido un error' });
      });
  },
  async GetPost(request, response) {
    await Post.findOne({ _id: request.params.id })
      .populate('user')
      .populate('comments.userId')
      .then(post => {
        response.status(HttpStatus.OK).json({ message: 'Post Found', post });
      })
      .catch(err =>
        response
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Post  not Found', post })
      );
  }
};
