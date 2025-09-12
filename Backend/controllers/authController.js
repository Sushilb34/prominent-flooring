const jwt = require("jsonwebtoken");

// Admin Login Controller
exports.adminLogin = (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    // Generate JWT Token
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    return res.json({
      token,
      message: "✅ Admin login successful",
    });
  }

  return res.status(401).json({ message: "❌ Invalid admin credentials" });
};
