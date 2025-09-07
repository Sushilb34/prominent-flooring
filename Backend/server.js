required("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const PDFDocument = require("pdfkit");

const app = express();
app.use(bodyParser.json());

//=========Paypal Utility Functions=========

async function generateAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_SECRET, PAYPAL_API } = process.env;
  const response = await axios({
    url: `${PAYPAL_API}/v1/oauth2/token`,
    method: "post",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data: "grant_type=client_credentials",
    auth: {
      username: PAYPAL_CLIENT_ID,
      password: PAYPAL_SECRET,
    },
  });
  return response.data.access_token;
}

// Create order
app.post('/create-order', async (req, res) => {
  try {
    const accessToken = await generateAccessToken();
    const { items } = req.body;

    // Calculate total
    let total = 0;
    const purchase_units = [{
      items: items.map(it => {
        total += parseFloat(it.price) * it.quantity;
        return {
          name: it.name,
          unit_amount: { currency_code: "USD", value: it.price },
          quantity: it.quantity.toString()
        };
      }),
      amount: {
        currency_code: "USD",
        value: total.toFixed(2),
        breakdown: {
          item_total: { currency_code: "USD", value: total.toFixed(2) }
        }
      }
    }];

    const order = await axios.post(
      `${process.env.PAYPAL_API}/v2/checkout/orders`,
      { intent: "CAPTURE", purchase_units },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    res.json({ id: order.data.id });
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
    res.status(500).send("Error creating order");
  }
});

// Capture order
app.post('/capture-order', async (req, res) => {
  try {
    const accessToken = await generateAccessToken();
    const { orderId } = req.body;

    const response = await axios.post(
      `${process.env.PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const order = response.data;
    if (order.status === 'COMPLETED') {
      const invoiceData = {
        invoiceId: `INV-${Date.now()}`,
        orderId,
        payer: order.payer.email_address,
        amount: order.purchase_units[0].payments.captures[0].amount.value,
        currency: order.purchase_units[0].payments.captures[0].amount.currency_code,
        items: order.purchase_units[0].items || []
      };

      const pdfPath = await generateInvoicePdf(invoiceData);
      if (invoiceData.payer) {
        await sendInvoiceEmail(invoiceData.payer, pdfPath, invoiceData.invoiceId);
      }

      return res.json({ status: 'COMPLETED' });
    } else {
      return res.json({ status: order.status });
    }
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
    res.status(500).send("Error capturing order");
  }
});

async function generateInvoicePdf(data) {
  return new Promise((resolve, reject) => {
    const invoicesDir = path.join(__dirname, "invoices");
    if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir);

    const filename = `${data.invoiceId}.pdf`;
    const filePath = path.join(invoicesDir, filename);

    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice ID: ${data.invoiceId}`);
    doc.text(`Order ID: ${data.orderId}`);
    doc.text(`Payer: ${data.payer}`);
    doc.moveDown();

    doc.text("Items:", { underline: true });
    data.items.forEach((it) => {
      doc.text(
        `${it.name}  —  Qty: ${it.quantity}  —  Price: ${it.unit_amount.value}`
      );
    });

    doc.moveDown();
    doc
      .fontSize(14)
      .text(`Total: ${data.amount} ${data.currency}`, { align: "right" });
    doc.moveDown();
    doc.fontSize(10).text("Thank you for your payment!", { align: "center" });

    doc.end();
    stream.on("finish", () => resolve(filePath));
    stream.on("error", (err) => reject(err));
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
);