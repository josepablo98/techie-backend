const { response } = require('express');
const jsonwebtoken = require('jsonwebtoken');
const pool = require('../db');

const validatejwt = (req, res = response, next) => {
  const { token } = req.cookies;
  const acceptedLanguage = req.headers['accept-language'] || 'es';

  if (!token) {
    return res.status(401).json({
      ok: false,
      message: acceptedLanguage === 'es' ? 'Token es requerido' : 'Token is required'
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
      message: acceptedLanguage === 'es' ? 'Token no válido' : 'Token is not valid'
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
              message: acceptedLanguage === 'es' ? 'La cuenta ya no existe' : 'The account no longer exists'
            });
          }
          conn.release();
          next(); // Mueve next() aquí para asegurarte de que solo se llame una vez
        })
        .catch(err => {
          conn.release();
          return res.status(500).json({
            ok: false,
            message: acceptedLanguage === 'es' ? 'Error en la base de datos' : 'Database error'
          });
        });
    })
    .catch(err => {
      return res.status(500).json({
        ok: false,
        message: acceptedLanguage === 'es' ? 'Error al conectar a la base de datos' : 'Error connecting to the database'
      });
    });
}

module.exports = {
  validatejwt
}