const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "NOVA Data API is running 🚀"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "NOVA Data API"
  });
});

app.post("/api/order", (req, res) => {
  const { network, phone, bundle, price } = req.body;

  if (!network || !phone || !bundle || price === undefined) {
    return res.status(400).json({
      error: "Missing order information"
    });
  }

  const order = {
    network: network,
    phone: phone,
    bundle: bundle,
    price: price,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  console.log("NOVA ORDER:", order);

  res.json({
    success: true,
    message: "Order received",
    order: order
  });
});
app.get("/api/verify-payment/:reference", async (req, res) => {
  const reference = req.params.reference;

  if (!reference) {
    return res.status(400).json({
      error: "Payment reference is required"
    });
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Paystack verification failed"
      });
    }

    res.json({
      success: true,
      status: data.data.status,
      reference: data.data.reference,
      amount: data.data.amount,
      currency: data.data.currency
    });

  } catch (error) {
    console.error("Payment verification error:", error);

    res.status(500).json({
      error: "Unable to verify payment"
    });
  }
});
app.listen(PORT, () => {
  console.log(`NOVA backend running on port ${PORT}`);
});
