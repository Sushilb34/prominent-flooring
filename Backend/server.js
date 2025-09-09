require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const { createOrder, captureOrder } = require("./services/paypal");

const app = express();
app.use(bodyParser.json());

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
