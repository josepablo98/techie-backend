const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const pool = require('./db');



const app = express();


app.use(cors());

app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/chat', require('./routes/chat'));



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

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
})