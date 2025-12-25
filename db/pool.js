const pg = require("pg");
const { Pool } = pg;

const pool = new Pool({
  // connectionString: process.env.DATABASE_URL,
  // ssl:
  //   process.env.NODE_ENV === "production"
  //     ? { rejectUnauthorized: false }
  //     : false,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false, // local = NO SSL
});

module.exports = pool;
