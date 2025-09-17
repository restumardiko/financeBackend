const birds = require("./src/birds.js");
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
require("dotenv").config();

const port = process.env.PORT || 2000;

app.use(express.json());
app.use(cookieParser());
app.use("/", birds);

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
