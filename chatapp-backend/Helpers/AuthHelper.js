const jwt = require('jsonwebtoken');
const dbConfig = require('../config/secrets');
const HttpStatus = require('http-status-codes');
module.exports = {
  VerifyToken: (req, res, next) => {
    if (!req.headers.authorization) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'Sin autorizacion' });
    }
    const token = req.cookies.auth || req.headers.authorization.split(' ')[1];

    if (!token) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ message: 'No se tiene un token' });
    }
    return jwt.verify(token, dbConfig.secret, (err, decoded) => {
      if (err) {
        if (err.expiredAt < new Date()) {
          return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: 'El token ha expirado. Porfavor vuelve a ingresar',
            token: null
          });
        }
        next();
      }
      req.user = decoded.data;
      next();
    });
  }
};
