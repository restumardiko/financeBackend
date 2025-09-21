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
  try {
    const refreshToken = req.cookies.refreshToken;
    console.log(req.cookies);

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }
    const result = await pool.query(
      "SELECT id,refresh_token_expires FROM users WHERE refresh_token=$1",
      [refreshToken]
    );
    console.log(result);

    const { id, refresh_token_expires } = result.rows[0];

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    if (new Date() > refresh_token_expires) {
      return res.status(403).json({ message: "Refresh token expired" });
    }

    const newAccessToken = jwt.sign({ userId: id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token: newAccessToken });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
const logOut = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token found" });
    }

    //
    await pool.query(
      "UPDATE users SET refresh_token = NULL, refresh_token_expires = NULL WHERE refresh_token=$1",
      [refreshToken]
    );

    res.clearCookie("refreshToken");

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

const signUp = async (req, res) => {
  try {
    const { name, password } = req.body;
    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users  (name,password_hash) VALUES ($1,$2) RETURNING *",
      [name, password_hash]
    );

    res.status(200).json({
      message: "sign up succesfully",
      data: result.rows[0].id,
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
const logIn = async (req, res) => {
  try {
    const { name, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE name =$1", [
      name,
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
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      "UPDATE users SET refresh_token = $1,refresh_token_expires=$2 WHERE id=$3",
      [refreshToken, expiresAt, result.rows[0].id]
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 1 * 60 * 60 * 1000,
    });

    res
      .status(200)
      .json({ token, message: "login succesfully", data: result.rows[0].id });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
const account = async (req, res) => {
  console.log("add account executed");
  try {
    const { user_id, name, account_type, balance } = req.body;
    const result = await pool.query(
      "INSERT INTO accounts (user_id,account_name,type,balance)VALUES ($1,$2,$3,$4)RETURNING *",
      [user_id, name, account_type, balance]
    );
    console.log(result);
    res.status(200).json({
      message: "add account succesfully",
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addIncome = async (req, res) => {
  try {
    const { account_id, category_id, amount, note, transaction_date, user_id } =
      req.body;

    const result = await pool.query(
      "INSERT INTO transactions(account_id,category_id,amount,note,transaction_date,user_id) VALUES ($1, $2,$3,$4,$5,$6)",
      [account_id, category_id, amount, note, transaction_date, user_id]
    );

    res.status(200).json({
      message: "Income added successfully",

      data: result.rows[0],
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

const addExpense = async (req, res) => {
  try {
    const { account_id, category_id, amount, note, transaction_date, user_id } =
      req.body;

    const result = await pool.query(
      "INSERT INTO transactions(account_id,category_id,amount,note,transaction_date,user_id) VALUES ($1, $2,$3,$4,$5,$6)",
      [account_id, category_id, amount, note, transaction_date, user_id]
    );

    res.status(200).json({
      message: "Expense added successfully",

      data: result.rows[0],
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

const transactions = async (req, res) => {
  try {
    const { user_id } = req.params;
    console.log(user_id);

    const result = await pool.query(
      `SELECT  categories.category_name,transactions.amount, transactions.note, categories.type,accounts.account_name,transactions.transaction_date FROM transactions LEFT JOIN categories ON  transactions.category_id = categories.id LEFT JOIN accounts ON transactions.account_id= accounts.id WHERE transactions.user_id=$1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "No transactions found",
        data: [],
      });
    }

    res.status(200).json({
      message: "data fetching successfully",

      data: result.rows,
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

const editTransaction = async (req, res) => {
  try {
    const { user_id, transaction_id } = req.params;
    const { account_id, category_id, amount, note, transaction_date } =
      req.body;

    const result = await pool.query(
      `UPDATE transactions SET account_id=$1,category_id=$2,amount=$3,note=$4,transaction_date=$5 WHERE id=$6 AND user_id = $7 RETURNING *`,
      [
        account_id,
        category_id,
        amount,
        note,
        transaction_date,
        transaction_id,
        user_id,
      ]
    );

    res.status(200).json({
      message: "Edit income successfully",

      data: result.rows[0],
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { user_id, transaction_id } = req.params;

    const result = await pool.query(
      `DELETE FROM transactions WHERE id=$1 AND user_id=$2 RETURNING *`,
      [transaction_id, user_id]
    );

    res.status(200).json({
      message: "delete transaction succesfully",

      data: result.rows[0],
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.default = {
  refresh,
  logOut,
  signUp,
  logIn,
  account,
  addIncome,
  addExpense,
  transactions,
  editTransaction,
  deleteTransaction,
};
