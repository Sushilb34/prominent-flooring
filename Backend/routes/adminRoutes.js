const express = require("express");
const { adminLogin } = require("../controllers/authController");

const router = express.Router();

// POST /admin/login
router.post("/login", adminLogin);

module.exports = router;
