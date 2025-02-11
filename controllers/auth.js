const { response } = require("express");
const bcrypt = require("bcrypt");
const { generateToken } = require("../helpers/generateToken");
const jsonwebtoken = require("jsonwebtoken");
const mariadb = require("mariadb");
const nodemailer = require("nodemailer");

const createUser = async (req, res = response) => {
  const { name, email, password } = req.body;
  if (Object.keys(req.body).length !== 3) {
    return res.status(400).json({
      ok: false,
      message: "El cuerpo debe contener tres campos exactamente: name, email y password",
    });
  }

  if (!name || !email || !password) {
    return res.status(400).json({
      ok: false,
      message: "Nombre, email o contraseña no proporcionados",
    });
  }

  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
    return res.status(400).json({
      ok: false,
      message: "Email no válido",
    });
  }

  if (!email.endsWith("@gmail.com")) {
    return res.status(400).json({
      ok: false,
      message: "Solo se permiten correos de Gmail",
    });
  }

  if (name.length < 2) {
    return res.status(400).json({
      ok: false,
      message: "El nombre debe tener al menos dos caracteres",
    });
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
    return res.status(400).json({
      ok: false,
      message: "La contraseña debe tener al menos 8 caracteres y contener al menos un número",
    });
  }

  const salt = bcrypt.genSaltSync();
  const hashedPassword = bcrypt.hashSync(password, salt);

  try {
    const pool = mariadb.createPool({
      host: "localhost",
      user: "root",
      password: "root",
      database: "techie",
      port: 3306,
      connectionLimit: 20,
      acquireTimeout: 10000
    });

    const connection = await pool.getConnection();

    const rows = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

    if (rows.length > 0) {
      if (!rows[0].isVerified) {
        connection.release();
        return res.status(400).json({
          ok: false,
          message: "El email ya está registrado pero la cuenta no ha sido verificada",
          verified: false,
        });
      }
      connection.release();
      return res.status(400).json({
        ok: false,
        message: "El email ya está registrado",
      });
    }


    const token = await generateToken(email, name);

    // enviar correo de verificacion
    const currentTime = new Date();
    const tokenExpires = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // 24 horas

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verificación de cuenta',
        text: `Por favor, verifica tu cuenta haciendo clic en el siguiente enlace: http://localhost:3000/verify-email?token=${token}`,
      };
  
      await transporter.sendMail(mailOptions);
    } catch (error) {
      return res.status(500).json({
        ok: false,
        message: "No es posible enviar el correo de verificación, es posible que el correo no exista",
      });
    }
    await connection.query(
      "INSERT INTO user (name, email, password, lastVerifiedRequest, verifiedToken, verifiedExpires) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, hashedPassword, currentTime, token, tokenExpires]
    );
    connection.release();


    res.status(201).json({
      ok: true,
      email,
      name,
      message: "Usuario creado correctamente y correo de verificación enviado",
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "No es posible registrarse, contacte con el administrador",
    });
  }
};

const loginUser = async (req, res = response) => {
  const { email, password } = req.body;
  if (Object.keys(req.body).length !== 2) {
    return res.status(400).json({
      ok: false,
      message: "El cuerpo debe contener dos campos exactamente: email y password",
    });
  }
  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      message: "Email o contraseña no proporcionados",
    });
  }

  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
    return res.status(400).json({
      ok: false,
      message: "Email no válido",
    });
  }



  try {
    const pool = mariadb.createPool({
      host: "localhost",
      user: "root",
      password: "root",
      database: "techie",
      port: 3306,
      connectionLimit: 20,
      acquireTimeout: 10000
    });

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM user WHERE email = ?",
      [email]
    );
    connection.release();
    if (!rows) {
      return res.status(400).json({
        ok: false,
        message: "Usuario o contraseña incorrectos",
      });
    }

    const user = { ...rows }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({
        ok: false,
        message: "Usuario o contraseña incorrectos",
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        ok: false,
        message: "La cuenta no ha sido verificada",
        verified: false,
      });
    }

    const token = await generateToken(user.email, user.name);

    res.status(200).json({
      ok: true,
      email: user.email,
      name: user.name,
      message: "Acceso correcto",
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "No es posible acceder, contacte con el administrador",
    });
  }
};

const requestPasswordReset = async (req, res = response) => {
  const { email } = req.body;

  if (Object.keys(req.body).length !== 1) {
    return res.status(400).json({
      ok: false,
      message: "El cuerpo debe contener un campo exactamente: email",
    });
  }

  if (!email) {
    return res.status(400).json({
      ok: false,
      message: "Email es requerido",
    });
  }

  try {
    const pool = mariadb.createPool({
      host: "localhost",
      user: "root",
      password: "root",
      database: "techie",
      port: 3306,
      connectionLimit: 20,
      acquireTimeout: 10000
    });

    const connection = await pool.getConnection();
    const [user] = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

    if (!user) {
      connection.release();
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado",
      });
    }

    const lastRequestTime = user.lastPasswordResetRequest;
    const currentTime = new Date();

    if (lastRequestTime && (currentTime - new Date(lastRequestTime)) < 60000) { // 1 minuto
      connection.release();
      return res.status(429).json({
        ok: false,
        message: "Debe esperar 1 minuto antes de solicitar otro cambio de contraseña",
      });
    }

    const token = await generateToken(email, user.name);
    const tokenExpires = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000); // 2 horas

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Restablecimiento de contraseña',
      text: `Por favor, restablece tu contraseña haciendo clic en el siguiente enlace: http://localhost:3000/reset-password?token=${token}`,
    };

    await transporter.sendMail(mailOptions);
    await connection.query("UPDATE user SET lastPasswordResetRequest = ?, passwordResetToken = ?, passwordResetTokenExpires = ?, passwordResetTokenUsed = false WHERE email = ?", [currentTime, token, tokenExpires, email]);
    connection.release();

    res.status(200).json({
      ok: true,
      message: "Correo de restablecimiento de contraseña enviado",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "No es posible enviar el correo de restablecimiento, contacte con el administrador",
    });
  }
};

const resetPassword = async (req, res = response) => {
  const { token, newPassword } = req.body;

  if (Object.keys(req.body).length !== 2) {
    return res.status(400).json({
      ok: false,
      message: "El cuerpo debe contener dos campos exactamente: token y newPassword",
    });
  }

  if (!token || !newPassword) {
    return res.status(400).json({
      ok: false,
      message: "Token o nueva contraseña son requeridos",
    });
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) {
    return res.status(400).json({
      ok: false,
      message: "La nueva contraseña debe tener al menos 8 caracteres y contener al menos un número",
    });
  }

  try {
    const { email } = jsonwebtoken.verify(token, process.env.SECRET_JWT_SEED);

    const pool = mariadb.createPool({
      host: "localhost",
      user: "root",
      password: "root",
      database: "techie",
      port: 3306,
      connectionLimit: 20,
      acquireTimeout: 10000
    });

    const connection = await pool.getConnection();
    const [user] = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

    if (!user || user.passwordResetToken !== token || new Date() > new Date(user.passwordResetTokenExpires)) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: "Usuario no encontrado o enlace inválido",
      });
    }

    if (user.passwordResetTokenUsed) {
      connection.release();
      return res.status(403).json({
        ok: false,
        message: "No es posible restablecer la contraseña ya que el enlace ha sido utilizado. Por favor, solicite un nuevo enlace",
      });
    }

    
    const salt = bcrypt.genSaltSync();
    const hashedNewPassword = bcrypt.hashSync(newPassword, salt);
    
    if (bcrypt.compareSync(newPassword, user.password)) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: "La nueva contraseña no puede ser igual a la actual",
      });
    }
    let passwordHistory = user.passwordHistory ? JSON.parse(user.passwordHistory) : [];
    // Verificar si la nueva contraseña ya fue usada en las últimas 5
    for (const oldPassword of passwordHistory) {
      if (bcrypt.compareSync(newPassword, oldPassword)) {
        connection.release();
        return res.status(400).json({
          ok: false,
          message: "No puedes reutilizar una de tus últimas cinco contraseñas",
        });
      }
    }

    if (passwordHistory.length >= 5) {
      passwordHistory.shift();
    }

    passwordHistory.push(hashedNewPassword);


    await connection.query("UPDATE user SET password = ?, passwordResetTokenUsed = true, passwordHistory = ? WHERE email = ?", [hashedNewPassword, JSON.stringify(passwordHistory), email]);
    connection.release();

    res.status(200).json({
      ok: true,
      message: "Contraseña restablecida correctamente",
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        ok: false,
        message: "Usuario no encontrado o enlace inválido",
      });
    }
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "No es posible restablecer la contraseña, contacte con el administrador",
    });
  }
};

const requestVerifiedEmail = async (req, res = response) => {
  const { email } = req.body;

  if (Object.keys(req.body).length !== 1) {
    return res.status(400).json({
      ok: false,
      message: "El cuerpo debe contener un campo exactamente: email",
    });
  }

  if (!email) {
    return res.status(400).json({
      ok: false,
      message: "Email es requerido",
    });
  }

  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
    return res.status(400).json({
      ok: false,
      message: "Email no válido",
    });
  }

  if (!email.endsWith("@gmail.com")) {
    return res.status(400).json({
      ok: false,
      message: "Solo se permiten correos de Gmail",
    });
  }

  // ahora se envia un correo con un token para verificar la cuenta y se mete en la base de datos
  // el token en el campo "verifiedToken" y la fecha de expiracion en "verifiedExpires" que es de 24 horas
  // el usuario no podra hacer login hasta que verifique su cuenta

  try {
    const pool = mariadb.createPool({
      host: "localhost",
      user: "root",
      password: "root",
      database: "techie",
      port: 3306,
      connectionLimit: 20,
      acquireTimeout: 10000
    });

    const connection = await pool.getConnection();
    const [user] = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

    if (!user) {
      connection.release();
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado",
      });
    }

    if (user.isVerified) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: "La cuenta ya ha sido verificada",
      });
    }

    const lastRequestTime = user.lastVerifiedRequest;
    const currentTime = new Date();

    if (lastRequestTime && (currentTime - new Date(lastRequestTime)) < 60000) {
      connection.release();
      return res.status(429).json({
        ok: false,
        message: "Debe esperar un minuto antes de solicitar otro enlace de verificación",
      });
    }

    const token = await generateToken(email, user.name);
    const tokenExpires = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verificación de cuenta',
      text: `Por favor, verifica tu cuenta haciendo clic en el siguiente enlace: http://localhost:3000/verify-email?token=${token}`,
    };

    await transporter.sendMail(mailOptions);
    await connection.query("UPDATE user SET lastVerifiedRequest = ?, verifiedToken = ?, verifiedExpires = ? WHERE email = ?", [currentTime, token, tokenExpires, email]);
    connection.release();

    res.status(200).json({
      ok: true,
      message: "Correo de verificación de cuenta enviado",
    });

  }
  catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "No es posible enviar el correo de verificación, contacte con el administrador",
    });
  }
}

const verifyEmail = async (req, res = response) => {
  const { token } = req.body;

  if (Object.keys(req.body).length !== 1) {
    return res.status(400).json({
      ok: false,
      message: "El cuerpo debe contener un campo exactamente: token",
    });
  }

  if (!token) {
    return res.status(400).json({
      ok: false,
      message: "Token es requerido",
    });
  }

  try {
    const { email } = jsonwebtoken.verify(token, process.env.SECRET_JWT_SEED);

    const pool = mariadb.createPool({
      host: "localhost",
      user: "root",
      password: "root",
      database: "techie",
      port: 3306,
      connectionLimit: 20,
      acquireTimeout: 10000
    });

    const connection = await pool.getConnection();
    const [user] = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

    if (!user) {
      connection.release();
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado",
      });
    }

    if(user.isVerified) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: "La cuenta ya ha sido verificada",
      });
    }

    if (user.verifiedToken !== token || new Date() > new Date(user.verifiedExpires)) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: "Enlace inválido",
      });
    }

    await connection.query("UPDATE user SET isVerified = true WHERE email = ?", [email]);
    connection.release();

    res.status(200).json({
      ok: true,
      message: "Cuenta verificada correctamente",
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        ok: false,
        message: "Usuario no encontrado o enlace inválido",
      });
    }
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "No es posible verificar la cuenta, contacte con el administrador",
    });
  }
}

const revalidateToken = async (req, res = response) => {
    const { name, email } = req;
    const token = await generateToken(email, name);

    res.json({
      ok: true,
      token,
      name,
      email
    });
  };

  module.exports = {
    createUser,
    loginUser,
    revalidateToken,
    requestPasswordReset,
    resetPassword,
    requestVerifiedEmail,
    verifyEmail
  };