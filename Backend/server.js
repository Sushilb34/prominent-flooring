require("dotenv").config();
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

const path = require("path");
app.use(express.json());

const bodyParser = require("body-parser");

app.use(bodyParser.json());



// Serve static files from the root directory

app.get("/", (req, res) => {
  console.log(
    "Serving index.html from:",
    path.join(__dirname, "../index.html")
  );
  res.sendFile(path.join(__dirname, "../index.html"));
});

app.use(express.static(path.join(__dirname, "../")));

app.post("/checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Prominent Product",
            },
            unit_amount: 50 * 100, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      success_url: `${process.env.BASE_URL}`,
      cancel_url: `${process.env.BASE_URL}`,
    });

    // 👉 Send session info to frontend
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`🚀 Server running on http://localhost:${port}`)
);
