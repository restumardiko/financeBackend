const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // ambil setelah 'Bearer'

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // verifikasi token
    req.user = decoded; // simpan info user ke request
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}
module.exports = authMiddleware;
