const cloudinary = require('cloudinary');
const HttpStatus = require('http-status-codes');

const User = require('../models/usermodels');

cloudinary.config({
  cloud_name: 'dvguuv13q',
  api_key: '783927364725724',
  api_secret: 'BvAJ-v4q61crVGLlXDigOEIWnPw'
});

module.exports = {
  UploadImage(req, res) {
    cloudinary.uploader.upload(req.body.image, async result => {
      await User.update(
        {
          _id: req.user._id
        },
        {
          $push: {
            images: {
              imgId: result.public_id,
              imgVersion: result.version
            }
          }
        }
      )
        .then(() =>
          res
            .status(HttpStatus.OK)
            .json({ message: 'Image Uploaded Succsesfully' })
        )
        .catch(err =>
          res
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: 'error occured' })
        );
    });
  },
  async SetDefaultImage(req, res) {
    const { imgId, imgVersion } = req.params;
    await User.update(
      {
        _id: req.user._id
      },
      {
        picId: imgId,
        picVersion: imgVersion
      }
    )
      .then(() =>
        res.status(HttpStatus.OK).json({ message: 'Default image Set' })
      )
      .catch(err =>
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'error occured' })
      );
  }
};
