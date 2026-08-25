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

// Receive an order
app.post("/api/order", (req, res) => {
  const { network, phone, bundle, price } = req.body;

  if (!network || !phone || !bundle || price === undefined) {
    return res.status(400).json({
      error: "Missing order information"
    });
  }

  const order = {
    network,
    phone,
    bundle,
    price,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  console.log("NOVA ORDER:", order);

  res.json({
    success: true,
    message: "Order received",
    order
  });
});

// Verify a Paystack transaction
app.get("/api/verify-payment/:reference", async (req, res) => {
  try {
    const reference = req.params.reference;

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return res.status(500).json({
        error: "Paystack secret key is not configured"
      });
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Paystack verification failed",
        details: data
      });
    }

    res.json({
      success: true,
      status: data.data?.status,
      reference: data.data?.reference,
      amount: data.data?.amount,
      currency: data.data?.currency
    });

  } catch (error) {
    console.error("PAYMENT VERIFICATION ERROR:", error);

    res.status(500).json({
      error: "Unable to verify payment"
    });
  }
});
app.get("/api/verify/:reference", async (req, res) => {
  try {
    const reference = req.params.reference;

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.message || "Payment verification failed"
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
    console.error("Verification error:", error);

    res.status(500).json({
      success: false,
      error: "Unable to verify payment"
    });
  }
});
// Test ClubKonnect API connection
app.get("/api/clubkonnect-test", async (req, res) => {
  try {
    const userId = process.env.CLUBKONNECT_USERID;
    const apiKey = process.env.CLUBKONNECT_APIKEY;

    if (!userId || !apiKey) {
      return res.status(500).json({
        success: false,
        error: "ClubKonnect credentials are missing"
      });
    }

    const url =
      `https://www.nellobytesystems.com/APIQueryV1.asp` +
      `?UserID=${encodeURIComponent(userId)}` +
      `&APIKey=${encodeURIComponent(apiKey)}` +
      `&RequestID=NOVA-TEST-${Date.now()}`;

    const response = await fetch(url);
    const data = await response.text();

    res.status(response.ok ? 200 : response.status).send(data);

  } catch (error) {
    console.error("CLUBKONNECT TEST ERROR:", error);

    res.status(500).json({
      success: false,
      error: "Unable to connect to ClubKonnect"
    });
  }
});
app.listen(PORT, () => {
  console.log(`NOVA backend running on port ${PORT}`);
});
