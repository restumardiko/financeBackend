const bcrypt = require("bcryptjs");
require("dotenv").config();

const express = require("express");
const app = express();
const pool = require("../db/index.js");
const jwt = require("jsonwebtoken");
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const crypto = require("crypto");

function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

const refresh = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT id,refresh_token_expires FROM users WHERE refresh_token=$1",
      [refreshToken]
    );
    await client.query("COMMIT");
    console.log(result);

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    const { id, refresh_token_expires } = result.rows[0];

    if (new Date() > refresh_token_expires) {
      return res.status(403).json({ message: "Refresh token expired" });
    }

    const newAccessToken = jwt.sign({ userId: id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.status(200).json({ token: newAccessToken });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};
const logOut = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token found" });
    }

    //
    await client.query("BEGIN");
    await client.query(
      "UPDATE users SET refresh_token = NULL, refresh_token_expires = NULL WHERE refresh_token=$1",
      [refreshToken]
    );
    await client.query("COMMIT");

    res.clearCookie("refreshToken");

    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};

const signUp = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { name, email, password } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO users  (name,password_hash,email) VALUES ($1,$2,$3) RETURNING *",
      [name, password_hash, email]
    );
    await client.query("COMMIT");

    return res.status(200).json({
      message: "sign up succesfully",
      data: result.rows[0].id,
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};
const logIn = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { email, password } = req.body;
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM users WHERE email =$1", [
      email,
    ]);

    if (result.rowCount == 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(
      password,
      result.rows[0].password_hash
    );

    if (!isMatch) {
      return res.status(401).json({ message: "password wrong" });
    }
    const token = jwt.sign(
      { userId: result.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
    await client.query(
      "UPDATE users SET refresh_token = $1,refresh_token_expires=$2 WHERE id=$3",
      [refreshToken, expiresAt, result.rows[0].id]
    );
    await client.query("COMMIT");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1 * 60 * 60 * 1000,
    });

    return res.status(200).json({ token, message: "login succesfully" });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};

const userInformation = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const user_id = req.user.userId;

    const userResult = await client.query(
      "SELECT name,email,created_at FROM users WHERE id = $1",
      [user_id]
    );

    //initial balance each account

    const initialBalance = await client.query(
      "SELECT accounts.account_name,accounts.initial_balance FROM accounts WHERE accounts.user_id=$1",
      [user_id]
    );
    // total balance

    const totalBalance = await client.query(
      `
   SELECT 
  SUM(account_balance) AS user_total_balance
FROM (
  SELECT
    accounts.initial_balance 
    + COALESCE(
        SUM(
          CASE 
            WHEN categories.type = 'Income' THEN transactions.amount 
            WHEN categories.type = 'Expense' THEN -transactions.amount 
          END
        ), 
      0
    ) AS account_balance
  FROM accounts
  LEFT JOIN transactions 
    ON transactions.account_id = accounts.id
  LEFT JOIN categories 
    ON categories.id = transactions.category_id
  WHERE accounts.user_id = $1
  GROUP BY accounts.id, accounts.initial_balance
) AS balances
  `,
      [user_id]
    );

    // console.log(transactionResult);

    // const transactions =
    //   transactionResult.rowCount == 0 ? "empty" : transactionResult.rows;
    //const total_balance =
    // totalBalance.rowCount == 0 ? "empty" : totalBalance.rows[0].total_balance;
    const name = userResult.rows[0].name;
    const email = userResult.rows[0].email;
    const created_at = userResult.rows[0].created_at;
    const total_balance = totalBalance.rows[0].user_total_balance;
    const initial_balance = initialBalance.rows;
    console.log("ini initial balance", initialBalance);

    return res.status(200).json({
      name,
      email,
      created_at,
      total_balance,
      initial_balance,
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};

const addAccount = async (req, res) => {
  let client;
  console.log("add account executed");
  try {
    client = await pool.connect();
    const { name, account_type, total_balance } = req.body;
    const user_id = req.user.userId;
    await client.query("BEGIN");
    const result = await client.query(
      "SELECT id FROM accounts WHERE user_id=$1 AND account_name = $2",
      [user_id, name]
    );

    if (result.rowCount == 0) {
      const result = await client.query(
        "INSERT INTO accounts (user_id,account_name,type,initial_balance)VALUES ($1,$2,$3,$4)RETURNING *",
        [user_id, name, account_type, total_balance]
      );
      console.log("ini ketika sudah ditambahkan", result);
      await client.query("COMMIT");

      return res.status(200).json({
        message: "add account succesfully",
        data: result.rows[0],
      });
    }
    await client.query("COMMIT");
    return res.status(500).json({
      message: "account already added",
      data: result.rows[0],
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};
//revise
const showAccount = async (req, res) => {
  let client;
  console.log("show all account");
  try {
    client = await pool.connect();
    const user_id = req.user.userId;

    const result = await client.query(
      `
 SELECT 
  accounts.id AS account_id,
  accounts.account_name,
  accounts.initial_balance 
    + COALESCE(
        SUM(
          CASE 
            WHEN categories.type = 'Income' THEN transactions.amount 
            WHEN categories.type = 'Expense' THEN -transactions.amount 
          END
        ), 
      0
    ) AS total_balance,


  CASE 
    WHEN COUNT(transactions.id) = 0 THEN true
    ELSE false
  END AS is_deletable

FROM accounts
LEFT JOIN transactions 
  ON transactions.account_id = accounts.id
LEFT JOIN categories 
  ON categories.id = transactions.category_id
WHERE accounts.user_id = $1
GROUP BY 
  accounts.id, 
  accounts.account_name, 
  accounts.initial_balance;
  `,
      [user_id]
    );
    //     /// is deletable
    //     const isDeletable = await client.query(
    //       `SELECT
    //   accounts.id,
    //   accounts.account_name
    // FROM accounts
    // WHERE accounts.user_id = $1
    //   AND NOT EXISTS (
    //     SELECT 1
    //     FROM transactions t
    //     WHERE t.account_id = accounts.id
    //   )`,
    //       [user_id]
    //     );

    if (result.rowCount == 0) {
      return res.status(200).json({
        message: "please add account",
        data: [],
      });
    }
    return res.status(200).json({
      message: "account showed",
      data: result.rows,
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};

const deleteAccount = async (req, res) => {
  console.log("delete account executed");
  let client;
  try {
    client = await pool.connect();
    const { account_id } = req.body;
    console.log("ini account id", account_id);
    const user_id = req.user.userId;
    await client.query("BEGIN");
    const result = await client.query(
      `DELETE FROM accounts
WHERE id = $1
  AND user_id = $2
  AND NOT EXISTS (
    SELECT 1
    FROM transactions
    WHERE transactions.account_id = accounts.id
  )
RETURNING *`,
      [account_id, user_id]
    );
    await client.query("COMMIT");
    if (result.rows.length === 0) {
      return res.status(400).json({
        message:
          "Account cannot be deleted because it has transactions or does not existt found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "delete account succesfully",
      data: result.rows[0],
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};

const addTransaction = async (req, res) => {
  console.log("add transaction");
  let client;
  try {
    client = await pool.connect();
    const user_id = req.user.userId;
    const { account_id, category_id, amount, note } = req.body;

    await client.query("BEGIN");

    const updateTransaction = await client.query(
      "INSERT INTO transactions(account_id,category_id,amount,note,user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [account_id, category_id, amount, note, user_id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "add transaction successfully",
      data: updateTransaction.rows[0],
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};

const latestTransactions = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const user_id = req.user.userId;

    const result = await client.query(
      `SELECT  categories.category_name,transactions.amount, transactions.note,transactions.id,transactions.created_at, categories.type,accounts.account_name FROM transactions LEFT JOIN categories ON  transactions.category_id = categories.id LEFT JOIN accounts ON transactions.account_id= accounts.id WHERE transactions.user_id=$1 ORDER BY transactions.created_at DESC
LIMIT 5 `,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "No transactions found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "data fetching successfully",

      data: result.rows,
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};

const transactions = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const user_id = req.user.userId;
    client.query("BEGIN");

    const result = await client.query(
      `SELECT  categories.category_name,transactions.amount, transactions.note,transactions.created_at,transactions.id,accounts.account_name, categories.type,accounts.account_name FROM transactions LEFT JOIN categories ON  transactions.category_id = categories.id LEFT JOIN accounts ON transactions.account_id= accounts.id WHERE transactions.user_id=$1 ORDER BY transactions.created_at DESC`,
      [user_id]
    );
    await client.query("COMMIT");

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "No transactions found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "data fetching successfully",

      data: result.rows,
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};

const editTransaction = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const user_id = req.user.userId;
    const { transaction_id } = req.params;
    const { account_id, category_id, amount, note, transaction_date } =
      req.body;

    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE transactions SET account_id=$1,category_id=$2,amount=$3,note=$4 WHERE id=$5 AND user_id = $6 RETURNING *`,
      [account_id, category_id, amount, note, transaction_id, user_id]
    );
    await client.query("COMMIT");

    return res.status(200).json({
      message: "Edit income successfully",

      data: result.rows[0],
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};

const deleteTransaction = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const user_id = req.user.userId;
    const { transaction_id } = req.params;
    console.log("ini transaction id", transaction_id);
    console.log("ini user id", user_id);

    await client.query("BEGIN");

    const result = await client.query(
      `DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING *`,
      [transaction_id, user_id]
    );
    await await client.query("COMMIT");
    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "No transactions found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "delete transaction succesfully",

      data: result.rows[0],
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("DB ERROR:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (client) client.release();
  }
};

exports.default = {
  refresh,
  logOut,
  signUp,
  logIn,
  userInformation,
  latestTransactions,
  addAccount,
  showAccount,
  deleteAccount,
  addTransaction,
  transactions,
  editTransaction,
  deleteTransaction,
};
