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

  if (name.length < 3) {
    return res.status(400).json({
      ok: false,
      message: "El nombre debe tener al menos tres caracteres",
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
    });

    const connection = await pool.getConnection();

    const rows = await connection.query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length > 0) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: "El email ya está registrado",
      });
    }


    await connection.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );
    connection.release();

    const token = await generateToken(name, email);

    res.status(201).json({
      ok: true,
      email,
      name,
      message: "Usuario creado correctamente",
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
    });

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    connection.release();
    if (!rows) {
      return res.status(400).json({
        ok: false,
        message: "Usuario o contraseña incorrectos",
      });
    }

    const user = {...rows}
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({
        ok: false,
        message: "Usuario o contraseña incorrectos",
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
    });

    const connection = await pool.getConnection();
    const [user] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);

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
    await connection.query("UPDATE users SET lastPasswordResetRequest = ?, passwordResetToken = ?, passwordResetTokenExpires = ?, passwordResetTokenUsed = false WHERE email = ?", [currentTime, token, tokenExpires, email]);
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

  if (!token || !newPassword) {
    return res.status(400).json({
      ok: false,
      message: "Token y nueva contraseña son requeridos",
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
    });

    const connection = await pool.getConnection();
    const [user] = await connection.query("SELECT * FROM users WHERE email = ?", [email]);

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

    await connection.query("UPDATE users SET password = ?, passwordResetTokenUsed = true WHERE email = ?", [hashedNewPassword, email]);
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
};