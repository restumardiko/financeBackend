const birds = require("./src/birds.js");
const express = require("express");
const app = express();

const port = 2000;

app.use(express.json());

app.use("/", birds);

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
