require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const adminRoutes = require("./routes/adminRoutes");

const app = express();
app.use(bodyParser.json());

app.use("/admin", adminRoutes);

// Serve static files from the root directory
const path = require("path");
app.use(express.static(path.join(__dirname, "../")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../index.html"));
});

// ========= Server =========
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);
