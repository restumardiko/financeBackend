const pg = require("pg");
const { Pool } = pg;

const pool = new Pool({
  user: "postgres",
  password: "udahmakanbelum",
  host: "localhost",
  port: 5432,
  database: "postgres",
});

module.exports = pool;
