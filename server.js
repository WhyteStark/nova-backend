const express = require("express");

const app = express();
const PORT = 3000;

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

  if (!network || !phone || !bundle || !price) {
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

app.listen(PORT, () => {
  console.log(`NOVA backend running on port ${PORT}`);
});
