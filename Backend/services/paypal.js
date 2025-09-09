const fs = require("fs");
const path = require("path");
const axios = require("axios");
const PDFDocument = require("pdfkit");

//========= Generate Access Token =========
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

//========= Create PayPal Order =========
async function createOrder(items) {
  const accessToken = await generateAccessToken();

  let total = 0;
  const purchase_units = [
    {
      items: items.map((it) => {
        total += parseFloat(it.price) * it.quantity;
        return {
          name: it.name,
          unit_amount: { currency_code: "USD", value: it.price },
          quantity: it.quantity.toString(),
        };
      }),
      amount: {
        currency_code: "USD",
        value: total.toFixed(2),
        breakdown: {
          item_total: { currency_code: "USD", value: total.toFixed(2) },
        },
      },
    },
  ];

  const order = await axios.post(
    `${process.env.PAYPAL_API}/v2/checkout/orders`,
    { intent: "CAPTURE", purchase_units },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return order.data;
}

//========= Capture PayPal Order =========
async function captureOrder(orderId) {
  const accessToken = await generateAccessToken();

  const response = await axios.post(
    `${process.env.PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const order = response.data;

  if (order.status === "COMPLETED") {
    const invoiceData = {
      invoiceId: `INV-${Date.now()}`,
      orderId,
      payer: order.payer.email_address,
      amount: order.purchase_units[0].payments.captures[0].amount.value,
      currency:
        order.purchase_units[0].payments.captures[0].amount.currency_code,
      items: order.purchase_units[0].items || [],
    };

    const pdfPath = await generateInvoicePdf(invoiceData);

    return { status: "COMPLETED", invoice: invoiceData, file: pdfPath };
  }

  return { status: order.status };
}

//========= Generate Invoice PDF =========
async function generateInvoicePdf(data) {
  return new Promise((resolve, reject) => {
    const invoicesDir = path.join(__dirname, "../invoices");
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

module.exports = {
  createOrder,
  captureOrder,
};
