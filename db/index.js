const pg = require("pg");
const { Pool } = pg;
require("dotenv").config();

console.log(process.env.PORT); // 2000
console.log(process.env.JWT_SECRET); // expectopetroleum
console.log(process.env.DB_USER);

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

module.exports = pool;
