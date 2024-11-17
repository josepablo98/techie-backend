const { response } = require("express");
const bcrypt = require("bcrypt");
const { generateToken } = require("../helpers/generateToken");
const mariadb = require("mariadb");

const createUser = async (req, res = response) => {
  const { name, email, password } = req.body;
  if (Object.keys(req.body).length !== 3) {
    return res.status(400).json({
      ok: false,
      message: "Todos los campos son requeridos",
    });
  }

  if (!name || !email || !password) {
    return res.status(400).json({
      ok: false,
      message: "Nombre, email o contraseña no proporcionados",
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
      message: "Error creando usuario",
    });
  }
};

const loginUser = async (req, res = response) => {
  const { email, password } = req.body;
  if (Object.keys(req.body).length !== 2) {
    return res.status(400).json({
      ok: false,
      message: "Todos los campos son requeridos",
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
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado",
      });
    }

    const user = {...rows}
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({
        ok: false,
        message: "Contraseña incorrecta",
      });
    }

    const token = await generateToken(user.email, user.name);

    res.status(200).json({
      ok: true,
      email: user.email,
      name: user.name,
      message: "Usuario logueado correctamente",
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Error logeando usuario",
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
    email,
  });
};

module.exports = {
  createUser,
  loginUser,
  revalidateToken,
};