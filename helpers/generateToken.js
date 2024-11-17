const jsonwebtoken = require('jsonwebtoken');

const generateToken = (email, name) => {
  return new Promise((resolve, reject) => {
    const payload = { name, email };

    jsonwebtoken.sign(payload, process.env.SECRET_JWT_SEED, {
      expiresIn: '2h'
    }, (err, token) => {
      if (err) {
        console.log(err);
        reject('Error generating token');
      }

      resolve(token);
    })
  })
}

module.exports = {
  generateToken
}