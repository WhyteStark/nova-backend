const express = require("express");
const cors = require("cors");

const app = express();

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

app.listen(PORT, () => {
  console.log(`NOVA backend running on port ${PORT}`);
});
