const express = require("express");
const handler = require("./handler.js").default;
const router = express.Router();
const auth = require("./auth.js");

router.post("/signUp", handler.signUp);
router.delete("/logOUt", handler.logOut);
router.post("/refresh", handler.refresh);
router.post("/logIn", handler.logIn);
router.use(auth);

router.get("/mainpage", handler.mainpage);
router.post("/account", handler.account);
router.get("/account", handler.showAccount);
router.delete("/account", handler.deleteAccount);
router.post("/income", handler.addIncome);
router.post("/expense", handler.addExpense);
router.get("/transactions/", handler.transactions);
router.put("/transaction/:transaction_id", handler.editTransaction);
router.delete("/transaction/:transaction_id", handler.deleteTransaction);

module.exports = router;
