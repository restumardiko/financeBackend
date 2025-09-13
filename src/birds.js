const express = require("express");
const handler = require("./handler.js").default;
const router = express.Router();

//middleware that is specific to this router
// const timeLog = (req, res, next) => {
//   console.log("Time: ", Date.now());
//   next();
// };
// router.use(timeLog);
router.post("/signUp", handler.signUp);
router.post("/logIn", handler.logIn);
router.post("/account", handler.account);
router.post("/income", handler.addIncome);
router.post("/expense", handler.addExpense);
router.get("/transactions/:user_id", handler.transactions);
router.put("/transaction/:user_id/:transaction_id", handler.editTransaction);
router.delete(
  "/transaction/:user_id/:transaction_id",
  handler.deleteTransaction
);

module.exports = router;
