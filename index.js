const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const cron = require('node-cron');
const pool = require('./db');
const fs = require('fs');
const https = require('https');



const app = express();

app.use(cookieParser());


app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/chat', require('./routes/chat'));
app.use('/settings', require('./routes/settings'));

const httpsOptions = {
  key: fs.readFileSync('../certs/localhost-key.pem'),
  cert: fs.readFileSync('../certs/localhost.pem')
};



cron.schedule("0 0 * * *", async () => {
  try {
    const connection = await pool.getConnection()
    const result = await connection.query("DELETE FROM user WHERE isVerified = false AND createdAt < NOW() - INTERVAL 7 DAY");
    console.log(`Usuarios no verificados eliminados: ${result.affectedRows}`);
    connection.release()
  } catch (error) {
    console.error("Error al limpiar usuarios no verificados", error);
  }
});

console.log("Cron job started");

https.createServer(httpsOptions, app).listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en https://localhost:${process.env.PORT}`);
});