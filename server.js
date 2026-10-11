const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Paystack-Signature"]
}));

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

/*
========================================================
ENVIRONMENT VARIABLES
========================================================

Required on Render:

PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxx
CLUBKONNECT_USERID=xxxxxxxx
CLUBKONNECT_APIKEY=xxxxxxxx

Optional:

NOVA_CALLBACK_URL=https://whytestark.github.io/-NOVA-/
*/

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const CLUBKONNECT_USERID = process.env.CLUBKONNECT_USERID;
const CLUBKONNECT_APIKEY = process.env.CLUBKONNECT_APIKEY;

const NOVA_CALLBACK_URL =
  process.env.NOVA_CALLBACK_URL ||
  "https://whytestark.github.io/-NOVA-/";

/*
========================================================
DATA PLANS
========================================================

price = what NOVA charges customer
cost  = provider cost

IMPORTANT:
Only use real provider product codes.
Do not invent codes for unavailable plans.
*/

const DATA_PLANS = {
  MTN: [
    {
      name: "500MB",
      duration: "7 days",
      price: 350,
      cost: 307,
      productCode: "2",
      productId: "500"
    },
    {
      name: "1GB",
      duration: "7 days",
      price: 500,
      cost: 410,
      productCode: "4",
      productId: "1000"
    },
    {
      name: "2GB",
      duration: "7 days",
      price: 950,
      cost: 820,
      productCode: "5",
      productId: "2000"
    },
    {
      name: "3GB",
      duration: "7 days",
      price: 1400,
      cost: 1230,
      productCode: "6",
      productId: "3000"
    },
    {
      name: "5GB",
      duration: "7 days",
      price: 2300,
      cost: 2050,
      productCode: "8",
      productId: "5000"
    },

    {
      name: "1GB",
      duration: "30 days",
      price: 650,
      cost: 563,
      productCode: "10",
      productId: "1000.00"
    },
    {
      name: "2GB",
      duration: "30 days",
      price: 1250,
      cost: 1117,
      productCode: "11",
      productId: "2000.00"
    },
    {
      name: "3GB",
      duration: "30 days",
      price: 1800,
      cost: 1629,
      productCode: "12",
      productId: "3000.00"
    },
    {
      name: "5GB",
      duration: "30 days",
      price: 2750,
      cost: 2511,
      productCode: "13",
      productId: "5000.00"
    },
    {
      name: "7GB",
      duration: "30 days",
      price: 3800,
      cost: 3395,
      productCode: "26",
      productId: "3500.02"
    },
    {
      name: "10GB",
      duration: "30 days",
      price: 4900,
      cost: 4365,
      productCode: "27",
      productId: "4500.01"
    },
    {
      name: "12.5GB",
      duration: "30 days",
      price: 6000,
      cost: 5335,
      productCode: "28",
      productId: "5500.01"
    },
    {
      name: "16.5GB",
      duration: "30 days",
      price: 7100,
      cost: 6305,
      productCode: "29",
      productId: "6500.01"
    },
    {
      name: "20GB",
      duration: "30 days",
      price: 8200,
      cost: 7275,
      productCode: "30",
      productId: "7500.01"
    },
    {
      name: "25GB",
      duration: "30 days",
      price: 9900,
      cost: 8730,
      productCode: "31",
      productId: "9000.01"
    },

    {
      name: "20GB",
      duration: "7 days",
      price: 5500,
      cost: 4850,
      productCode: "36",
      productId: "5000.01"
    }
  ],

  Glo: [
    {
      name: "200MB",
      duration: "14 days",
      price: 150,
      cost: 94,
      productCode: "1",
      productId: "200"
    },
    {
      name: "500MB",
      duration: "7 days",
      price: 300,
      cost: 230,
      productCode: "2",
      productId: "500"
    },
    {
      name: "1GB",
      duration: "3 days",
      price: 500,
      cost: 392,
      productCode: "8",
      productId: "1000.11"
    },
    {
      name: "3GB",
      duration: "3 days",
      price: 1400,
      cost: 1176,
      productCode: "9",
      productId: "3000.11"
    },
    {
      name: "5GB",
      duration: "3 days",
      price: 2300,
      cost: 1960,
      productCode: "10",
      productId: "5000.11"
    },

    {
      name: "1GB",
      duration: "30 days",
      price: 550,
      cost: 461,
      productCode: "3",
      productId: "1000"
    },
    {
      name: "2GB",
      duration: "30 days",
      price: 1050,
      cost: 922,
      productCode: "4",
      productId: "2000"
    },
    {
      name: "3GB",
      duration: "30 days",
      price: 1600,
      cost: 1383,
      productCode: "5",
      productId: "3000"
    },
    {
      name: "5GB",
      duration: "30 days",
      price: 2600,
      cost: 2306,
      productCode: "6",
      productId: "5000"
    },

    {
      name: "10GB",
      duration: "30 days",
      price: 5000,
      cost: 4612,
      productCode: "7",
      productId: "10000"
    },

    {
      name: "7.5GB",
      duration: "30 days",
      price: 3000,
      cost: 2425,
      productCode: "20",
      productId: "2500.01"
    },
    {
      name: "12.5GB",
      duration: "30 days",
      price: 4500,
      cost: 3880,
      productCode: "22",
      productId: "4000.01"
    },
    {
      name: "16GB",
      duration: "30 days",
      price: 5500,
      cost: 4850,
      productCode: "23",
      productId: "5000.01"
    },
    {
      name: "28GB",
      duration: "30 days",
      price: 8500,
      cost: 7760,
      productCode: "24",
      productId: "8000.01"
    }
  ],

  Airtel: [
    {
      name: "1GB",
      duration: "1 day",
      price: 550,
      cost: 484.91,
      productCode: "14",
      productId: "499.91"
    },
    {
      name: "1.5GB",
      duration: "2 days",
      price: 650,
      cost: 581.91,
      productCode: "15",
      productId: "599.91"
    },
    {
      name: "2GB",
      duration: "2 days",
      price: 800,
      cost: 727.41,
      productCode: "16",
      productId: "749.91"
    },
    {
      name: "3GB",
      duration: "2 days",
      price: 1050,
      cost: 969.91,
      productCode: "17",
      productId: "999.91"
    },
    {
      name: "5GB",
      duration: "2 days",
      price: 1600,
      cost: 1454.91,
      productCode: "18",
      productId: "1499.91"
    },

    {
      name: "500MB",
      duration: "7 days",
      price: 550,
      cost: 484.92,
      productCode: "19",
      productId: "499.92"
    },
    {
      name: "1GB",
      duration: "7 days",
      price: 900,
      cost: 775.91,
      productCode: "20",
      productId: "799.91"
    },
    {
      name: "1.5GB",
      duration: "7 days",
      price: 1100,
      cost: 969.92,
      productCode: "21",
      productId: "999.92"
    },
    {
      name: "3.5GB",
      duration: "7 days",
      price: 1650,
      cost: 1454.92,
      productCode: "22",
      productId: "1499.92"
    },
    {
      name: "6GB",
      duration: "7 days",
      price: 2750,
      cost: 2424.91,
      productCode: "23",
      productId: "2499.91"
    },
    {
      name: "10GB",
      duration: "7 days",
      price: 3300,
      cost: 2909.91,
      productCode: "24",
      productId: "2999.91"
    },
    {
      name: "18GB",
      duration: "7 days",
      price: 5500,
      cost: 4849.91,
      productCode: "25",
      productId: "4999.91"
    },

    {
      name: "2GB",
      duration: "30 days",
      price: 1650,
      cost: 1454.93,
      productCode: "26",
      productId: "1499.93"
    },
    {
      name: "3GB",
      duration: "30 days",
      price: 2200,
      cost: 1939.91,
      productCode: "27",
      productId: "1999.91"
    },
    {
      name: "4GB",
      duration: "30 days",
      price: 2750,
      cost: 2424.92,
      productCode: "28",
      productId: "2499.92"
    },
    {
      name: "8GB",
      duration: "30 days",
      price: 3300,
      cost: 2909.92,
      productCode: "29",
      productId: "2999.92"
    },
    {
      name: "10GB",
      duration: "30 days",
      price: 4300,
      cost: 3879.91,
      productCode: "30",
      productId: "3999.91"
    },
    {
      name: "13GB",
      duration: "30 days",
      price: 5300,
      cost: 4849.92,
      productCode: "31",
      productId: "4999.92"
    },
    {
      name: "18GB",
      duration: "30 days",
      price: 6300,
      cost: 5819.91,
      productCode: "32",
      productId: "5999.91"
    },
    {
      name: "25GB",
      duration: "30 days",
      price: 8200,
      cost: 7759.91,
      productCode: "33",
      productId: "7999.91"
    }
  ],

  "9mobile": [
    {
      name: "50MB",
      duration: "30 days",
      price: 100,
      cost: 25,
      productCode: "1",
      productId: "50"
    },
    {
      name: "100MB",
      duration: "30 days",
      price: 150,
      cost: 51,
      productCode: "2",
      productId: "100"
    },
    {
      name: "300MB",
      duration: "30 days",
      price: 200,
      cost: 153,
      productCode: "3",
      productId: "300"
    },
    {
      name: "500MB",
      duration: "30 days",
      price: 300,
      cost: 246,
      productCode: "4",
      productId: "500"
    },
    {
      name: "1GB",
      duration: "30 days",
      price: 600,
      cost: 492,
      productCode: "5",
      productId: "1000"
    },
    {
      name: "2GB",
      duration: "30 days",
      price: 1150,
      cost: 984,
      productCode: "6",
      productId: "2000"
    },
    {
      name: "3GB",
      duration: "30 days",
      price: 1700,
      cost: 1476,
      productCode: "7",
      productId: "3000"
    },
    {
      name: "4GB",
      duration: "30 days",
      price: 2200,
      cost: 1968,
      productCode: "8",
      productId: "4000"
    },
    {
      name: "5GB",
      duration: "30 days",
      price: 2800,
      cost: 2460,
      productCode: "9",
      productId: "5000"
    },
    {
      name: "10GB",
      duration: "30 days",
      price: 5500,
      cost: 4920,
      productCode: "10",
      productId: "10000"
    },
    {
      name: "15GB",
      duration: "30 days",
      price: 7900,
      cost: 7380,
      productCode: "11",
      productId: "15000"
    },
    {
      name: "20GB",
      duration: "30 days",
      price: 10500,
      cost: 9840,
      productCode: "12",
      productId: "20000"
    },
    {
      name: "25GB",
      duration: "30 days",
      price: 13000,
      cost: 12300,
      productCode: "13",
      productId: "25000"
    }
  ]
};

/*
========================================================
NETWORK CODES
========================================================
*/

const NETWORK_CODES = {
  MTN: "01",
  Glo: "02",
  "9mobile": "03",
  Airtel: "04"
};

/*
========================================================
IN-MEMORY ORDERS
========================================================

This is suitable for testing.

For production, replace this with a real database.
*/

const orders = new Map();

/*
========================================================
HELPERS
========================================================
*/

function generateId(prefix = "NOVA") {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(5).toString("hex")}`;
}

function normalizePhone(phone) {
  let value = String(phone || "").replace(/\D/g, "");

  if (value.startsWith("234")) {
    value = "0" + value.slice(3);
  }

  if (value.length === 10 && value.startsWith("8")) {
    value = "0" + value;
  }

  return value;
}

function validNigerianPhone(phone) {
  return /^0[789][01]\d{8}$/.test(phone);
}

function getPlan(network, planIndex) {
  if (!DATA_PLANS[network]) {
    return null;
  }

  const index = Number(planIndex);

  if (!Number.isInteger(index)) {
    return null;
  }

  return DATA_PLANS[network][index] || null;
}

function publicPlan(plan, index) {
  return {
    index,
    name: plan.name,
    duration: plan.duration,
    price: plan.price,
    productCode: plan.productCode,
    productId: plan.productId
  };
}

async function paystackRequest(url, options = {}) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = {
      status: false,
      message: text || "Invalid response from Paystack"
    };
  }

  if (!response.ok) {
    throw new Error(
      data.message || `Paystack request failed with HTTP ${response.status}`
    );
  }

  return data;
}

/*
========================================================
ROOT
========================================================
*/

app.get("/", (req, res) => {
  res.json({
    message: "NOVA Data API is running 🚀",
    version: "3.0.0"
  });
});

/*
========================================================
HEALTH
========================================================
*/

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "NOVA Data API",
    time: new Date().toISOString()
  });
});

/*
========================================================
NETWORKS
========================================================
*/

app.get("/api/networks", (req, res) => {
  res.json({
    success: true,
    networks: Object.keys(DATA_PLANS)
  });
});

/*
========================================================
PLANS
========================================================
*/

app.get("/api/plans", (req, res) => {
  const requestedNetwork = req.query.network;

  if (requestedNetwork) {
    if (!DATA_PLANS[requestedNetwork]) {
      return res.status(404).json({
        success: false,
        message: "Network not found."
      });
    }

    return res.json({
      success: true,
      network: requestedNetwork,
      plans: DATA_PLANS[requestedNetwork].map(publicPlan)
    });
  }

  const result = {};

  for (const network of Object.keys(DATA_PLANS)) {
    result[network] = DATA_PLANS[network].map(publicPlan);
  }

  res.json({
    success: true,
    plans: result
  });
});

/*
========================================================
CREATE ORDER + INITIALIZE PAYSTACK
========================================================
*/

app.post("/api/order", async (req, res) => {
  try {
    const {
      network,
      phone,
      email,
      planIndex
    } = req.body;

    if (!network || !DATA_PLANS[network]) {
      return res.status(400).json({
        success: false,
        message: "Invalid network."
      });
    }

    const normalizedPhone = normalizePhone(phone);

    if (!validNigerianPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Nigerian phone number."
      });
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address."
      });
    }

    const plan = getPlan(network, planIndex);

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid data plan."
      });
    }

    const requestId = generateId("NOVA");
    const orderId = generateId("ORDER");

    const order = {
      orderId,
      requestId,
      network,
      phone: normalizedPhone,
      email: String(email).trim().toLowerCase(),
      planIndex: Number(planIndex),
      bundle: plan.name,
      duration: plan.duration,
      price: plan.price,
      cost: plan.cost,
      productCode: plan.productCode,
      productId: plan.productId,
      status: "payment_pending",
      deliveryStatus: "not_started",
      createdAt: new Date().toISOString()
    };

    orders.set(orderId, order);

    /*
      Paystack amount is in kobo.
      We calculate it from the backend plan,
      NOT from the frontend.
    */

    const paystackPayload = {
      email: order.email,
      amount: Math.round(order.price * 100),
      currency: "NGN",
      reference: order.requestId,
      callback_url: NOVA_CALLBACK_URL,
      metadata: {
        orderId: order.orderId,
        requestId: order.requestId,
        network: order.network,
        phone: order.phone,
        planIndex: order.planIndex,
        bundle: order.bundle,
        duration: order.duration
      }
    };

    const payment = await paystackRequest(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        body: JSON.stringify(paystackPayload)
      }
    );

    if (!payment.status || !payment.data) {
      orders.delete(orderId);

      return res.status(502).json({
        success: false,
        message: payment.message || "Unable to initialize payment."
      });
    }

    order.paymentReference = payment.data.reference;
    order.authorizationUrl = payment.data.authorization_url;
    order.accessCode = payment.data.access_code;

    orders.set(orderId, order);

    res.json({
      success: true,
      message: "Order created successfully.",
      order: {
        orderId: order.orderId,
        requestId: order.requestId,
        network: order.network,
        phone: order.phone,
        bundle: order.bundle,
        duration: order.duration,
        price: order.price,
        status: order.status
      },
      payment: {
        reference: payment.data.reference,
        authorization_url: payment.data.authorization_url,
        access_code: payment.data.access_code
      }
    });

  } catch (error) {
    console.error("ORDER ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Unable to create order."
    });
  }
});

/*
========================================================
VERIFY PAYSTACK PAYMENT
========================================================
*/

app.get("/api/verify-payment/:reference", async (req, res) => {
  try {
    const reference = String(req.params.reference || "").trim();

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Payment reference is required."
      });
    }

    const result = await paystackRequest(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET"
      }
    );

    if (!result.status || !result.data) {
      return res.status(400).json({
        success: false,
        message: result.message || "Unable to verify payment."
      });
    }

    const transaction = result.data;

    /*
      Find matching order.
    */

    let order = null;
    let orderId = null;

    for (const [id, item] of orders.entries()) {
      if (
        item.requestId === reference ||
        item.paymentReference === reference
      ) {
        order = item;
        orderId = id;
        break;
      }
    }

    /*
      Verify both transaction status AND amount.
      This is important before delivering digital value.
    */

    const expectedAmount = order
      ? Math.round(order.price * 100)
      : null;

    const amountMatches =
      expectedAmount === null ||
      Number(transaction.amount) === expectedAmount;

    const paymentSuccessful =
      transaction.status === "success" &&
      transaction.currency === "NGN" &&
      amountMatches;

    if (!paymentSuccessful) {
      if (order) {
        order.status = transaction.status || "payment_failed";
        orders.set(orderId, order);
      }

      return res.json({
        success: true,
        paid: false,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        message: amountMatches
          ? "Payment has not completed successfully."
          :  "Payment amount does not match the order."
      });
    }

    if (order) {
      order.status = "paid";
      order.paidAt = new Date().toISOString();
      order.paystackTransactionId = transaction.id;

      orders.set(orderId, order);
    }

    res.json({
      success: true,
      paid: true,
      status: transaction.status,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      order: order
        ? {
            orderId: order.orderId,
            requestId: order.requestId,
            network: order.network,
            phone: order.phone,
            bundle: order.bundle,
            duration: order.duration,
            price: order.price,
            status: order.status
          }
        : null
    });

  } catch (error) {
    console.error("VERIFY ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed."
    });
  }
});

/*
========================================================
DELIVER DATA
========================================================

Provider:
Nellobyte data bundle API

Credentials stay on Render.
*/

app.post("/api/deliver", async (req, res) => {
  try {
    const {
      network,
      phone,
      planIndex,
      requestId
    } = req.body;

    if (!CLUBKONNECT_USERID || !CLUBKONNECT_APIKEY) {
      return res.status(500).json({
        success: false,
        message: "Data provider credentials are not configured on the server."
      });
    }

    if (!network || !DATA_PLANS[network]) {
      return res.status(400).json({
        success: false,
        message: "Invalid network."
      });
    }

    const normalizedPhone = normalizePhone(phone);

    if (!validNigerianPhone(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Nigerian phone number."
      });
    }

    const plan = getPlan(network, planIndex);

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Invalid data plan."
      });
    }

    /*
      Find order by requestId.
    */

    let order = null;
    let orderId = null;

    for (const [id, item] of orders.entries()) {
      if (item.requestId === requestId) {
        order = item;
        orderId = id;
        break;
      }
    }

    /*
      Never deliver before payment has been verified.
    */

    if (!order || order.status !== "paid") {
      return res.status(403).json({
        success: false,
        message: "Payment must be verified before data delivery."
      });
    }

    if (network!== order.network || normalizedPhone !== order.phone || Number(planIndex) !== Number(order.planindex)) {
      return res.status(400).json({ success: false, message: "Order details do not match the original order." });
    }

    /*
      Prevent duplicate delivery attempts.
    */

    if (order.deliveryStatus === "success") {
      return res.json({
        success: true,
        alreadyDelivered: true,
        message: "This order has already been delivered.",
        order
      });
    }

    order.deliveryStatus = "processing";
    orders.set(orderId, order);

    const providerUrl =
      "https://www.nellobytesystems.com/APIDatabundleV1.asp";

    const params = new URLSearchParams({
      UserID: CLUBKONNECT_USERID,
      APIKey: CLUBKONNECT_APIKEY,
      MobileNetwork: NETWORK_CODES[network],
      DataPlan: plan.productCode,
      MobileNumber: normalizedPhone,
      RequestID: requestId
    });

    /*
      Add callback URL if you configured one.
    */

    if (process.env.NOVA_PROVIDER_CALLBACK_URL) {
      params.append(
        "CallBackURL",
        process.env.NOVA_PROVIDER_CALLBACK_URL
      );
    }

    const providerResponse = await fetch(
      `${providerUrl}?${params.toString()}`,
      {
        method: "GET"
      }
    );

    const providerText = await providerResponse.text();

    let providerData;

    try {
      providerData = JSON.parse(providerText);
    } catch {
      providerData = {
        raw: providerText
      };
    }

    /*
      We don't assume every provider response has the same
      JSON field names. Store the response for inspection.
    */

    const providerTextLower = providerText.toLowerCase();

    const obviousSuccess =
      providerTextLower.includes("success") ||
      providerTextLower.includes("successful") ||
      providerTextLower.includes("completed");

    const obviousFailure =
      providerTextLower.includes("failed") ||
      providerTextLower.includes("error") ||
      providerTextLower.includes("invalid");

    if (obviousFailure && !obviousSuccess) {
      order.deliveryStatus = "failed";
      order.providerResponse = providerData;
      order.providerResponseAt = new Date().toISOString();

      orders.set(orderId, order);

      return res.status(502).json({
        success: false,
        message: "Data provider reported a failure.",
        provider: providerData
      });
    }

    order.deliveryStatus = obviousSuccess
      ? "success"
      : "submitted";

    order.providerResponse = providerData;
    order.providerResponseAt = new Date().toISOString();

    if (obviousSuccess) {
      order.deliveredAt = new Date().toISOString();
    }

    orders.set(orderId, order);

    res.json({
      success: true,
      message: obviousSuccess
        ? "Data delivery successful."
        : "Data order submitted to provider.",
      provider: providerData,
      order: {
        orderId: order.orderId,
        requestId: order.requestId,
        network: order.network,
        phone: order.phone,
        bundle: order.bundle,
        duration: order.duration,
        price: order.price,
        status: order.status,
        deliveryStatus: order.deliveryStatus
      }
    });

  } catch (error) {
    console.error("DELIVERY ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Data delivery failed."
    });
  }
});

/*
========================================================
GET ORDER
========================================================
*/

app.get("/api/order/:orderId", (req, res) => {
  const order = orders.get(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found."
    });
  }

  res.json({
    success: true,
    order
  });
});

/*
========================================================
PAYSTACK WEBHOOK
========================================================

Paystack signs webhook requests using HMAC SHA512.

The webhook marks a payment as paid, but actual delivery
is still protected by the verified payment state.
*/

app.post("/api/paystack/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];

    if (!signature || !PAYSTACK_SECRET_KEY) {
      return res.status(401).send("Unauthorized");
    }

    const expectedSignature = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(req.rawBody || JSON.stringify(req.body))
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(401).send("Invalid signature");
    }

    /*
      Always acknowledge the webhook quickly.
    */

    res.sendStatus(200);

    const event = req.body;

    if (
      event &&
      event.event === "charge.success" &&
      event.data
    ) {
      const transaction = event.data;

      let order = null;
      let orderId = null;

      for (const [id, item] of orders.entries()) {
        if (
          item.requestId === transaction.reference ||
          item.paymentReference === transaction.reference
        ) {
          order = item;
          orderId = id;
          break;
        }
      }

      if (!order) {
        console.log(
          "Webhook received for unknown order:",
          transaction.reference
        );
        return;
      }

      const expectedAmount = Math.round(order.price * 100);

      if (
        transaction.status !== "success" ||
        transaction.currency !== "NGN" ||
        Number(transaction.amount) !== expectedAmount
      ) {
        console.log("Webhook payment validation failed.");
        return;
      }

      if (order.status === "paid") {
        return;
      }

      order.status = "paid";
      order.paidAt = new Date().toISOString();
      order.paystackTransactionId = transaction.id;

      orders.set(orderId, order);

      console.log(
        `Payment confirmed for ${order.orderId}`
      );

      /*
        Delivery can be triggered by the frontend after verification.
        Keeping this separate avoids accidental duplicate fulfilment.
      */
    }

  } catch (error) {
    console.error("WEBHOOK ERROR:", error);

    if (!res.headersSent) {
      res.sendStatus(500);
    }
  }
});

/*
========================================================
GENERIC PROVIDER CALLBACK
========================================================
*/

app.all("/api/callback", (req, res) => {
  console.log("Provider callback received:");
  console.log({
    method: req.method,
    query: req.query,
    body: req.body
  });

  res.json({
    success: true,
    message: "NOVA callback received."
  });
});

/*
========================================================
START SERVER
========================================================
*/

app.listen(PORT, () => {
  console.log(`NOVA Data API running on port ${PORT}`);
});
