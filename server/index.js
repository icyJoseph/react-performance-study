const express = require("express");
const app = express();

const PORT = 9191;
const accessControlAllowOrigin = ["Access-Control-Allow-Origin", "*"];
const accessControlAllowHeaders = ["Access-Control-Allow-Headers", "*"];

const mock = require("./mock");

app.use((req, res, next) => {
  res.setHeader(...accessControlAllowOrigin);
  res.setHeader(...accessControlAllowHeaders);
  console.log(
    `****\nmethod: ${req.method}\nendpoint: ${req.originalUrl}\nsource: ${
      req.headers.origin
    }\n****`
  );
  next();
});

app.get("/", (req, res) => {
  return res.json(mock);
});

app.listen(PORT, () => {
  console.log(`Mock Server running on PORT ${PORT}`);
});
