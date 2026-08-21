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

app.listen(PORT, () => {
  console.log(`NOVA backend running on port ${PORT}`);
});
