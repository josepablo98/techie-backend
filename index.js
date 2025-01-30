const express = require('express');
require('dotenv').config();
const cors = require('cors');
const cron = require('node-cron');
const mariadb = require('mariadb');



const app = express();


app.use(cors());

app.use(express.json());

app.use('/auth', require('./routes/auth'));

const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "techie",
  port: 3306
});

cron.schedule("0 0 * * *", async () => {
  try {
    const result = await pool.query("DELETE FROM user WHERE isVerified = false AND createdAt < NOW() - INTERVAL 7 DAY");
    console.log(`Usuarios no verificados eliminados: ${result.affectedRows}`);
  } catch (error) {
    console.error("Error al limpiar usuarios no verificados", error);
  }
});

console.log("Cron job started");

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
})