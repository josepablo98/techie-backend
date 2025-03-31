const { response } = require('express');
const jsonwebtoken = require('jsonwebtoken');
const pool = require('../db');

const validatejwt = (req, res = response, next) => {
  const { token } = req.cookies;

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

  pool.getConnection()
    .then(conn => {
      conn.query("SELECT * FROM user WHERE email = ?", [req.email])
        .then(rows => {
          if (rows.length === 0) {
            conn.release();
            return res.status(401).json({
              ok: false,
              message: 'La cuenta ya no existe'
            });
          }
          conn.release();
          next(); // Mueve next() aquí para asegurarte de que solo se llame una vez
        })
        .catch(err => {
          conn.release();
          return res.status(500).json({
            ok: false,
            message: 'Error en la base de datos'
          });
        });
    })
    .catch(err => {
      return res.status(500).json({
        ok: false,
        message: 'Error en la base de datos'
      });
    });
}

module.exports = {
  validatejwt
}