const { response } = require('express');
const jsonwebtoken = require('jsonwebtoken');

const validatejwt = (req, res = response, next) => {
  const token = req.header('x-token');

  if (!token) {
    return res.status(401).json({
      ok: false,
      message: 'Token is required'
    });
  }

  try {
    const { uid, name, email } = jsonwebtoken.verify(token, process.env.SECRET_JWT_SEED);
    req.uid = uid;
    req.name = name;
    req.email = email;
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: 'Invalid token'
    });
  }

  next();
}

module.exports = {
  validatejwt
}