const express = require("express");
const handler = require("./handler.js").default;
const router = express.Router();

//middleware that is specific to this router
// const timeLog = (req, res, next) => {
//   console.log("Time: ", Date.now());
//   next();
// };
// router.use(timeLog);

router.post("/income", handler.addIncome);
router.post("/expense", handler.addExpense);
router.get("/income", handler.showIncome);
router.get("/expense", handler.showExpense);
router.get("/Both", handler.showBoth);
router.put("/income", handler.editIncome);
router.put("/expense", handler.editExpense);
router.delete("/income", handler.deleteIncome);
router.delete("/expense", handler.deleteExpense);

module.exports = router;
