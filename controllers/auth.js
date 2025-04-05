const { response } = require("express");
const bcrypt = require("bcrypt");
const { generateToken } = require("../helpers/generateToken");
const jsonwebtoken = require("jsonwebtoken");
const pool = require("../db");
const nodemailer = require("nodemailer");

const createUser = async (req, res = response) => {
  const { name, email, password } = req.body;
  const acceptedLanguage = req.headers["accept-language"] || "es";

  if (Object.keys(req.body).length !== 3) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "El cuerpo debe contener tres campos exactamente: name, email y password" : "The body must contain exactly three fields: name, email and password",
    });
  }

  if (!name || !email || !password) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "Nombre, email o contraseña no proporcionados" : "Name, email or password not provided",
    });
  }

  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "Email no válido" : "Invalid email",
    });
  }

  if (!email.endsWith("@gmail.com")) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "Solo se permiten correos de Gmail" : "Only Gmail accounts are allowed",
    });
  }

  if (name.length < 2) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "El nombre debe tener al menos dos caracteres" : "Name must be at least two characters long",
    });
  }

  if (!/^(?=.*[A-Z])(?=.*\d)[^\sñ]{8,}$/.test(password)) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "La contraseña debe tener al menos 8 caracteres, al menos una letra mayúscula y un número" : "Password must be at least 8 characters long, contain at least one uppercase letter and one number",
    });
  }

  const salt = bcrypt.genSaltSync();
  const hashedPassword = bcrypt.hashSync(password, salt);

  try {

    const connection = await pool.getConnection();
    const rows = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

    if (rows.length > 0) {
      connection.release();
      if (!rows[0].isVerified) {
        return res.status(400).json({
          ok: false,
          message: acceptedLanguage === "es" ? "El email ya está registrado pero la cuenta no ha sido verificada" : "The email is already registered but the account has not been verified",
          verified: false,
        });
      }
      return res.status(400).json({
        ok: false,
        message: acceptedLanguage === "es" ? "El email ya está registrado" : "The email is already registered",
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
        subject: acceptedLanguage === "es" ? 'Verificación de cuenta' : 'Account Verification',
        text: acceptedLanguage === "es" ? `Por favor, verifica tu cuenta haciendo clic en el siguiente enlace: https://localhost:3000/verify-email?token=${token}` : `Please verify your account by clicking the following link: https://localhost:3000/verify-email?token=${token}`,
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      connection.release();
      return res.status(500).json({
        ok: false,
        message: acceptedLanguage === "es" ? "No es posible enviar el correo de verificación, es posible que el correo no exista" : "Unable to send verification email, the email may not exist",
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
      message: acceptedLanguage === "es" ? "Usuario creado correctamente y correo de verificación enviado" : "User created successfully and verification email sent",
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: acceptedLanguage === "es" ? "No es posible registrarse, contacte con el administrador" : "Unable to register, please contact the administrator",
    });
  }
};

const loginUser = async (req, res = response) => {
  const { email, password } = req.body;
  const acceptedLanguage = req.headers["accept-language"] || "es";

  if (Object.keys(req.body).length !== 2) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "El cuerpo debe contener dos campos exactamente: email y password" : "The body must contain exactly two fields: email and password",
    });
  }
  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "Email o contraseña no proporcionados" : "Email or password not provided",
    });
  }

  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "Email no válido" : "Invalid email",
    });
  }



  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM user WHERE email = ?",
      [email]
    );
    connection.release();
    if (!rows) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: acceptedLanguage === "es" ? "Usuario o contraseña incorrectos" : "User or password incorrect",
      });
    }

    const user = { ...rows }
    if (!bcrypt.compareSync(password, user.password)) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: acceptedLanguage === "es" ? "Usuario o contraseña incorrectos" : "User or password incorrect",
      });
    }

    if (!user.isVerified) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: acceptedLanguage === "es" ? "La cuenta no ha sido verificada" : "The account has not been verified",
        verified: false,
      });
    }

    const token = await generateToken(user.email, user.name);

    connection.release();

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",   // Para permitir cookies cross-site
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });



    res.status(200).json({
      ok: true,
      email: user.email,
      name: user.name,
      message: acceptedLanguage === "es" ? "Acceso correcto" : "Access granted",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: acceptedLanguage === "es" ? "No es posible acceder, contacte con el administrador" : "Unable to access, please contact the administrator",
    });
  }
};

const requestPasswordReset = async (req, res = response) => {
  const { email } = req.body;
  const acceptedLanguage = req.headers["accept-language"] || "es";

  if (Object.keys(req.body).length !== 1) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "El cuerpo debe contener un campo exactamente: email" : "The body must contain exactly one field: email",
    });
  }

  if (!email) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "Email es requerido" : "Email is required",
    });
  }

  try {
    const connection = await pool.getConnection();
    const [user] = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

    if (!user) {
      connection.release();
      return res.status(404).json({
        ok: false,
        message: acceptedLanguage === "es" ? "Usuario no encontrado" : "User not found",
      });
    }

    const lastRequestTime = user.lastPasswordResetRequest;
    const currentTime = new Date();

    if (lastRequestTime && (currentTime - new Date(lastRequestTime)) < 60000) { // 1 minuto
      connection.release();
      return res.status(429).json({
        ok: false,
        message: acceptedLanguage === "es" ? "Debe esperar un minuto antes de solicitar otro enlace de restablecimiento" : "You must wait one minute before requesting another reset link",
      });
    }

    const token = await generateToken(email, user.name);
    const tokenExpires = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000); // 2 horas


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
        subject: acceptedLanguage === "es" ? 'Restablecimiento de contraseña' : 'Password Reset',
        text: acceptedLanguage === "es" ? `Por favor, restablece tu contraseña haciendo clic en el siguiente enlace: https://localhost:3000/reset-password?token=${token}` : `Please reset your password by clicking the following link: https://localhost:3000/reset-password?token=${token}`,
      };

      await transporter.sendMail(mailOptions);

    } catch {
      connection.release();
      return res.status(500).json({
        ok: false,
        message: acceptedLanguage === "es" ? "No es posible enviar el correo de restablecimiento, es posible que el correo no exista" : "Unable to send reset email, the email may not exist",
      });
    }

    await connection.query("UPDATE user SET lastPasswordResetRequest = ?, passwordResetToken = ?, passwordResetTokenExpires = ?, passwordResetTokenUsed = false WHERE email = ?", [currentTime, token, tokenExpires, email]);
    connection.release();

    res.status(200).json({
      ok: true,
      message: acceptedLanguage === "es" ? "Correo de restablecimiento de contraseña enviado" : "Password reset email sent",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: acceptedLanguage === "es" ? "No es posible enviar el correo de restablecimiento, contacte con el administrador" : "Unable to send reset email, please contact the administrator",
    });
  }
};

const resetPassword = async (req, res = response) => {
  const { token, newPassword } = req.body;
  const acceptedLanguage = req.headers["accept-language"] || "es";

  if (Object.keys(req.body).length !== 2) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "El cuerpo debe contener dos campos exactamente: token y newPassword" : "The body must contain exactly two fields: token and newPassword",
    });
  }

  if (!token || !newPassword) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "Token o nueva contraseña son requeridos" : "Token or new password are required",
    });
  }

  if (!/^(?=.*[A-Z])(?=.*\d)[^\sñ]{8,}$/.test(newPassword)) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "La nueva contraseña debe tener al menos 8 caracteres, al menos una letra mayúscula y un número" : "New password must be at least 8 characters long, contain at least one uppercase letter and one number",
    });
  }

  try {
    const { email } = jsonwebtoken.verify(token, process.env.SECRET_JWT_SEED);
    const connection = await pool.getConnection();
    const [user] = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

    console.log(user);

    if (!user || user.passwordResetToken !== token || new Date() > new Date(user.passwordResetTokenExpires)) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: acceptedLanguage === "es" ? "Usuario no encontrado o enlace inválido" : "User not found or invalid link",
      });
    }

    if (user.passwordResetTokenUsed) {
      connection.release();
      return res.status(403).json({
        ok: false,
        message: acceptedLanguage === "es" ? "No es posible restablecer la contraseña ya que el enlace ha sido utilizado. Por favor, solicite un nuevo enlace" : "Unable to reset password as the link has been used. Please request a new link",
      });
    }


    const salt = bcrypt.genSaltSync();
    const hashedNewPassword = bcrypt.hashSync(newPassword, salt);

    if (bcrypt.compareSync(newPassword, user.password)) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: acceptedLanguage === "es" ? "La nueva contraseña no puede ser igual a la actual" : "New password cannot be the same as the current one",
      });
    }
    let passwordHistory = user.passwordHistory ? user.passwordHistory : [];
    // Verificar si la nueva contraseña ya fue usada en las últimas 5
    for (const oldPassword of passwordHistory) {
      if (bcrypt.compareSync(newPassword, oldPassword)) {
        connection.release();
        return res.status(400).json({
          ok: false,
          message: acceptedLanguage === "es" ? "La nueva contraseña no puede ser igual a las últimas 5 usadas" : "New password cannot be the same as the last 5 used",
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
      message: acceptedLanguage === "es" ? "Contraseña restablecida correctamente" : "Password reset successfully",
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        ok: false,
        message: acceptedLanguage === "es" ? "Usuario no encontrado o enlace inválido" : "User not found or invalid link",
      });
    }
    console.log(error);
    res.status(500).json({
      ok: false,
      message: acceptedLanguage === "es" ? "No es posible restablecer la contraseña, contacte con el administrador" : "Unable to reset password, please contact the administrator",
    });
  }
};

const requestVerifiedEmail = async (req, res = response) => {
  const { email } = req.body;
  const acceptedLanguage = req.headers["accept-language"] || "es";

  if (Object.keys(req.body).length !== 1) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "El cuerpo debe contener un campo exactamente: email" : "The body must contain exactly one field: email",
    });
  }

  if (!email) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "Email es requerido" : "Email is required",
    });
  }

  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "Email no válido" : "Invalid email",
    });
  }

  if (!email.endsWith("@gmail.com")) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "Solo se permiten correos de Gmail" : "Only Gmail accounts are allowed",
    });
  }

  // ahora se envia un correo con un token para verificar la cuenta y se mete en la base de datos
  // el token en el campo "verifiedToken" y la fecha de expiracion en "verifiedExpires" que es de 24 horas
  // el usuario no podra hacer login hasta que verifique su cuenta

  try {
    const connection = await pool.getConnection();
    const [user] = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

    if (!user) {
      connection.release();
      return res.status(404).json({
        ok: false,
        message: acceptedLanguage === "es" ? "Usuario no encontrado" : "User not found",
      });
    }

    if (user.isVerified) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: acceptedLanguage === "es" ? "La cuenta ya ha sido verificada" : "The account has already been verified",
      });
    }

    const lastRequestTime = user.lastVerifiedRequest;
    const currentTime = new Date();

    if (lastRequestTime && (currentTime - new Date(lastRequestTime)) < 60000) {
      connection.release();
      return res.status(429).json({
        ok: false,
        message: acceptedLanguage === "es" ? "Debe esperar un minuto antes de solicitar otro enlace de verificación" : "You must wait one minute before requesting another verification link",
      });
    }

    const token = await generateToken(email, user.name);
    const tokenExpires = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000);

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
        subject: acceptedLanguage === "es" ? 'Verificación de cuenta' : 'Account Verification',
        text: acceptedLanguage === "es" ? `Por favor, verifica tu cuenta haciendo clic en el siguiente enlace: https://localhost:3000/verify-email?token=${token}` : `Please verify your account by clicking the following link: https://localhost:3000/verify-email?token=${token}`,
      };

      await transporter.sendMail(mailOptions);
    } catch {
      connection.release();
      return res.status(500).json({
        ok: false,
        message: acceptedLanguage === "es" ? "No es posible enviar el correo de verificación, es posible que el correo no exista" : "Unable to send verification email, the email may not exist",
      });
    }


    await connection.query("UPDATE user SET lastVerifiedRequest = ?, verifiedToken = ?, verifiedExpires = ? WHERE email = ?", [currentTime, token, tokenExpires, email]);
    connection.release();

    res.status(200).json({
      ok: true,
      message: acceptedLanguage === "es" ? "Correo de verificación de cuenta enviado" : "Account verification email sent",
    });

  }
  catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: acceptedLanguage === "es" ? "No es posible enviar el correo de verificación, contacte con el administrador" : "Unable to send verification email, please contact the administrator",
    });
  }
}

const verifyEmail = async (req, res = response) => {
  const { token } = req.body;
  const acceptedLanguage = req.headers["accept-language"] || "es";

  if (Object.keys(req.body).length !== 1) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "El cuerpo debe contener un campo exactamente: token" : "The body must contain exactly one field: token",
    });
  }

  if (!token) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "Token es requerido" : "Token is required",
    });
  }

  try {
    const { email } = jsonwebtoken.verify(token, process.env.SECRET_JWT_SEED);
    const connection = await pool.getConnection();
    const [user] = await connection.query("SELECT * FROM user WHERE email = ?", [email]);

    if (!user) {
      connection.release();
      return res.status(404).json({
        ok: false,
        message: acceptedLanguage === "es" ? "Usuario no encontrado" : "User not found",
      });
    }

    if (user.isVerified) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: acceptedLanguage === "es" ? "La cuenta ya ha sido verificada" : "The account has already been verified",
      });
    }

    if (user.verifiedToken !== token || new Date() > new Date(user.verifiedExpires)) {
      connection.release();
      return res.status(400).json({
        ok: false,
        message: acceptedLanguage === "es" ? "Enlace inválido" : "Invalid link",
      });
    }

    await connection.query("UPDATE user SET isVerified = true WHERE email = ?", [email]);
    await connection.query("INSERT INTO settings (userId, language) VALUES (?, ?)", [user.id, acceptedLanguage]);
    connection.release();

    res.status(200).json({
      ok: true,
      message: acceptedLanguage === "es" ? "Cuenta verificada correctamente" : "Account verified successfully",
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        ok: false,
        message: acceptedLanguage === "es" ? "Usuario no encontrado o enlace inválido" : "User not found or invalid link",
      });
    }
    console.log(error);
    res.status(500).json({
      ok: false,
      message: acceptedLanguage === "es" ? "No es posible verificar la cuenta, contacte con el administrador" : "Unable to verify the account, please contact the administrator",
    });
  }
}

const deleteUser = async (req, res = response) => {
  const { token } = req.cookies;
  const acceptedLanguage = req.headers["accept-language"] || "es";

  if (!token) {
    return res.status(400).json({
      ok: false,
      message: acceptedLanguage === "es" ? "Token es requerido" : "Token is required",
    });
  }

  try {
    const connection = await pool.getConnection();
    const { email } = jsonwebtoken.verify(token, process.env.SECRET_JWT_SEED);
    const [user] = await connection.query("SELECT id FROM user WHERE email = ?", [email]);
    if (user.length === 0) {
      connection.release();
      return res.status(404).json({
        ok: false,
        message: acceptedLanguage === "es" ? "Usuario no encontrado o token inválido" : "User not found or invalid token",
      });
    }

    await connection.query("DELETE FROM settings WHERE userId = ?", [user.id]);
    await connection.query("DELETE FROM chat WHERE userId = ?", [user.id]);
    await connection.query("DELETE FROM user WHERE email = ?", [email]);
    connection.release();

    res.status(200).json({
      ok: true,
      message: acceptedLanguage === "es" ? "Cuenta eliminada correctamente" : "Account deleted successfully",
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: acceptedLanguage === "es" ? "No es posible eliminar la cuenta, contacte con el administrador" : "Unable to delete the account, please contact the administrator",
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

const logoutUser = async (req, res = response) => {

  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/"
  });
  res.status(200).json({
    ok: true,
    message: "Sesión cerrada correctamente",
  })
}

module.exports = {
  createUser,
  loginUser,
  revalidateToken,
  requestPasswordReset,
  resetPassword,
  requestVerifiedEmail,
  verifyEmail,
  deleteUser,
  logoutUser,
};