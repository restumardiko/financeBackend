require("dotenv").config();
const birds = require("./src/birds.js");
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");

const port = process.env.PORT || 2000;

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/", birds);

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
