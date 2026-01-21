const express = require("express");
const handler = require("./handler.js").default;
const router = express.Router();
const auth = require("./auth.js");

router.post("/signUp", handler.signUp);
router.delete("/logOUt", handler.logOut);
router.post("/refresh", handler.refresh);
router.post("/logIn", handler.logIn);
router.use(auth);

router.get("/userInformation", handler.userInformation);
router.post("/addAccount", handler.addAccount);
router.get("/showAccount", handler.showAccount);
router.delete("/deleteAccount", handler.deleteAccount);
router.delete("/deleteTransaction/:transaction_id", handler.deleteTransaction);
router.post("/addTransaction", handler.addTransaction);

router.get("/latestTransactions", handler.latestTransactions);
router.get("/transactions", handler.transactions);
router.put("/transaction/:transaction_id", handler.editTransaction);

module.exports = router;
