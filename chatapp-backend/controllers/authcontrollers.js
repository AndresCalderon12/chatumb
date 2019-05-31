const joi = require('joi');
const HttpStatus = require('http-status-codes');
const User = require('../models/usermodels');
const Helpers = require('../Helpers/helpers');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbConfig = require('../config/secrets');
module.exports = {
  async CreateUser(request, response) {
    const schema = joi.object().keys({
      username: joi
        .string()
        .min(5)
        .max(10)
        .required(),
      email: joi
        .string()
        .email()
        .required(),
      password: joi
        .string()
        .min(5)
        .required()
    });
    const { error, value } = joi.validate(request.body, schema);

    if (error && error.details) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json({ msg: error.details });
    }
    const userEmail = await User.findOne({
      email: Helpers.lowerCase(request.body.email)
    });
    if (userEmail) {
      return response
        .status(HttpStatus.CONFLICT)
        .json({ message: 'El email ya se encuentra registrado' });
    }
    const userName = await User.findOne({
      username: Helpers.firstUpper(request.body.username)
    });
    if (userName) {
      return response
        .status(HttpStatus.CONFLICT)
        .json({ message: 'El nombre de usuario ya existe' });
    }
    return bcrypt.hash(value.password, 10, (error, hash) => {
      if (error) {
        return response
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'error hashing password' });
      }
      const body = {
        username: Helpers.firstUpper(value.username),
        email: Helpers.lowerCase(value.email),
        password: hash
      };
      User.create(body)
        .then(user => {
          const token = jwt.sign({ data: user }, dbConfig.secret, {
            expiresIn: '5h'
          });
          response.cookie('auth', token);
          response
            .status(HttpStatus.CREATED)
            .json({ message: 'Usuario creado con existo', user, token });
        })
        .catch(error => {
          response
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: 'Error' });
        });
    });
  },
  async LoginUser(request, response) {
    if (!request.body.username || !request.body.password) {
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'No se permiten espacios vacios' });
    }
    await User.findOne({
      username: Helpers.firstUpper(request.body.username)
    })
      .then(user => {
        if (!user) {
          return response
            .status(HttpStatus.NOT_FOUND)
            .json({ message: 'nombre de usuario no existe' });
        }
        return bcrypt
          .compare(request.body.password, user.password)
          .then(result => {
            if (!result) {
              return response
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json({ message: 'Contraseña incorrecta ' });
            }
            const token = jwt.sign({ data: user }, dbConfig.secret, {
              expiresIn: '5h'
            });
            response.cookie('auth', token);
            return response
              .status(HttpStatus.OK)
              .json({ message: 'Login Completado', user, token });
          });
      })
      .catch(err => {
        return response
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: 'Ha ocurrido un error' });
      });
  }
};
