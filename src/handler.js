const { nanoid } = require("nanoid");

const express = require("express");
const app = express();
const pool = require("../db/index.js");
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const addIncome = async (req, res) => {
  try {
    const id = nanoid(5);
    //const insertAt = new Date();
    const { type, amount } = req.body;

    const result = await pool.query(
      'INSERT INTO "transaction" (type, amount) VALUES ($1, $2) RETURNING *',
      [type, amount]
    );

    res.status(200).json({
      message: "Income added successfully",

      data: result.rows[0],
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: "Database insert error" });
  }
};

const addExpense = async (req, res) => {
  try {
    const id = nanoid(5);
    const insertAt = new Date();
    const { type, amount } = req.body;

    const result = await pool.query(
      'INSERT INTO "transaction" (id, type, amount, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, type, amount, insertAt]
    );

    res.status(200).json({
      message: "Expense added successfully",
      data: result.rows[0], // langsung balikin row dari DB
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: "Database insert error" });
  }
};

const showIncome = async (req, res) => {
  try {
    const id = nanoid(5);
    const insertAt = new Date();
    const { type, amount } = req.body;

    const result = await pool.query(
      'INSERT INTO "transaction" (id, type, amount, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, type, amount, insertAt]
    );

    res.status(201).json({
      message: "Income added successfully",
      data: result.rows[0], // langsung balikin row dari DB
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: "Database insert error" });
  }
};

const showExpense = async (req, res) => {
  try {
    const id = nanoid(5);
    const insertAt = new Date();
    const { type, amount } = req.body;

    const result = await pool.query(
      'INSERT INTO "transaction" (id, type, amount, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, type, amount, insertAt]
    );

    res.status(201).json({
      message: "Income added successfully",
      data: result.rows[0], // langsung balikin row dari DB
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: "Database insert error" });
  }
};

const showBoth = async (req, res) => {
  try {
    const id = nanoid(5);
    const insertAt = new Date();
    const { type, amount } = req.body;

    const result = await pool.query(
      'INSERT INTO "transaction" (id, type, amount, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, type, amount, insertAt]
    );

    res.status(201).json({
      message: "Income added successfully",
      data: result.rows[0], // langsung balikin row dari DB
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: "Database insert error" });
  }
};

const editIncome = async (req, res) => {
  try {
    const id = nanoid(5);
    const insertAt = new Date();
    const { type, amount } = req.body;

    const result = await pool.query(
      'INSERT INTO "transaction" (id, type, amount, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, type, amount, insertAt]
    );

    res.status(201).json({
      message: "Income added successfully",
      data: result.rows[0], // langsung balikin row dari DB
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: "Database insert error" });
  }
};

const editExpense = async (req, res) => {
  try {
    const id = nanoid(5);
    const insertAt = new Date();
    const { type, amount } = req.body;

    const result = await pool.query(
      'INSERT INTO "transaction" (id, type, amount, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, type, amount, insertAt]
    );

    res.status(201).json({
      message: "Income added successfully",
      data: result.rows[0], // langsung balikin row dari DB
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: "Database insert error" });
  }
};

const deleteIncome = async (req, res) => {
  try {
    const id = nanoid(5);
    const insertAt = new Date();
    const { type, amount } = req.body;

    const result = await pool.query(
      'INSERT INTO "transaction" (id, type, amount, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, type, amount, insertAt]
    );

    res.status(201).json({
      message: "Income added successfully",
      data: result.rows[0], // langsung balikin row dari DB
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: "Database insert error" });
  }
};
const deleteExpense = async (req, res) => {
  try {
    const id = nanoid(5);
    const insertAt = new Date();
    const { type, amount } = req.body;

    const result = await pool.query(
      'INSERT INTO "transaction" (id, type, amount, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, type, amount, insertAt]
    );

    res.status(201).json({
      message: "Income added successfully",
      data: result.rows[0], // langsung balikin row dari DB
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: "Database insert error" });
  }
};

exports.default = {
  addIncome,
  addExpense,
  showIncome,
  showExpense,
  showBoth,
  editIncome,
  editExpense,
  deleteIncome,
  deleteExpense,
};
