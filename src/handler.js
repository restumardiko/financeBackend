const { nanoid } = require("nanoid");

const express = require("express");
const app = express();
const pool = require("../db/index.js");
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const signUp = async (req, res) => {
  try {
    const { name, password } = req.body;
    const result = await pool.query(
      "INSERT INTO users  (name,password_hash) VALUES ($1,$2) RETURNING *",
      [name, password]
    );

    res.status(200).json({
      message: "sign up succesfully",
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
const logIn = async (req, res) => {
  try {
    const { name, password } = req.body;
    const result = await pool.query(
      "SELECT * FROM users WHERE name =$1 AND password_hash= $2 ",
      [name, password]
    );

    if (result.rowCount == 1) {
      res.status(200).json({
        message: "login succesfully",
        data: result.rows[0].id,
      });
    } else {
      res.status(500).json({
        message: "name or password wrong !",
      });
    }
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
      "INSERT INTO accounts (user_id,name,type,balance)VALUES ($1,$2,$3,$4)RETURNING *",
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

const editExpense = async (req, res) => {};

const deleteIncome = async (req, res) => {};
const deleteExpense = async (req, res) => {};

exports.default = {
  signUp,
  logIn,
  account,
  addIncome,
  addExpense,
  transactions,
  editTransaction,
  editExpense,
  deleteIncome,
  deleteExpense,
};
