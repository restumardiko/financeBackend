const auth = function (req, res, next) {
  console.log("auth");
  next();
};
module.exports = auth;
