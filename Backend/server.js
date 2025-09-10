require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes")
    ;
const { createOrder, captureOrder } = require("./services/paypal");

const app = express();

app.use(bodyParser.json());

app.use("/auth", authRoutes);

// Serve static files from the root directory
const path = require("path");
app.use(express.static(path.join(__dirname, "../")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../index.html"));
});
// ========= Routes =========
app.post("/create-order", async (req, res) => {
  try {
    const { items } = req.body;
    const order = await createOrder(items);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating order");
  }
});

app.post("/capture-order", async (req, res) => {
  try {
    const { orderId } = req.body;
    const result = await captureOrder(orderId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error capturing order");
  }
});

// ========= Server =========
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);
