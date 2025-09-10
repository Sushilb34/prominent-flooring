const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Temporary in-memory store (replace with DB later)
const users = [];

exports.signup = async (req, res) => {
  const { email, password } = req.body;

  const existing = users.find((u) => u.email === email);
  if (existing) return res.status(400).json({ message: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);
  users.push({ email, password: hashed });

  res.json({ message: "User registered successfully" });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token });
};
