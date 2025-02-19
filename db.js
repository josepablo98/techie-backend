const mariadb = require("mariadb");
require("dotenv").config();

const pool = mariadb.createPool({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME,
    port: Number(process.env.DBPORT),
    connectionLimit: Number(process.env.DBCONNECTIONLIMIT),
    acquireTimeout: Number(process.env.DBTIMEOUT),
});

module.exports = pool;