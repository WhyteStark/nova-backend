const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(cors());
app.use(express.json());

/*
|--------------------------------------------------------------------------
| ENVIRONMENT VARIABLES
|--------------------------------------------------------------------------
*/

const PAYSTACK_SECRET_KEY =
  process.env.PAYSTACK_SECRET_KEY || "";

const CLUBKONNECT_USERID =
  process.env.CLUBKONNECT_USERID || "";

const CLUBKONNECT_APIKEY =
  process.env.CLUBKONNECT_APIKEY || "";

const NOVA_CALLBACK_URL =
  process.env.NOVA_CALLBACK_URL || "";

/*
|--------------------------------------------------------------------------
| NETWORK CODES
|--------------------------------------------------------------------------
*/

const NETWORK_CODES = {
  MTN: "01",
  Glo: "02",
  Airtel: "04",
  "9mobile": "03"
};

/*
|--------------------------------------------------------------------------
| NOVA DATA PLANS
|--------------------------------------------------------------------------
|
| price = amount charged by NOVA
| cost  = current ClubKonnect cost supplied by their plan catalogue
|
| IMPORTANT:
| The backend is the source of truth for productCode and networkId.
|
|--------------------------------------------------------------------------
*/

const DATA_PLANS = {

  /*
  |--------------------------------------------------------------------------
  | MTN
  |--------------------------------------------------------------------------
  */

  MTN: [

    {
      name: "500MB",
      duration: "7 days",
      price: 350,
      productCode: "2",
      productId: "500",
      cost: 307
    },

    {
      name: "1GB",
      duration: "7 days",
      price: 500,
      productCode: "4",
      productId: "1000",
      cost: 410
    },

    {
      name: "2GB",
      duration: "7 days",
      price: 950,
      productCode: "5",
      productId: "2000",
      cost: 820
    },

    {
      name: "3GB",
      duration: "7 days",
      price: 1400,
      productCode: "6",
      productId: "3000",
      cost: 1230
    },

    {
      name: "5GB",
      duration: "7 days",
      price: 2300,
      productCode: "8",
      productId: "5000",
      cost: 2050
    },

    {
      name: "1GB",
      duration: "30 days",
      price: 650,
      productCode: "10",
      productId: "1000.00",
      cost: 563
    },

    {
      name: "2GB",
      duration: "30 days",
      price: 1250,
      productCode: "11",
      productId: "2000.00",
      cost: 1117
    },

    {
      name: "3GB",
      duration: "30 days",
      price: 1800,
      productCode: "12",
      productId: "3000.00",
      cost: 1629
    },

    {
      name: "5GB",
      duration: "30 days",
      price: 2750,
      productCode: "13",
      productId: "5000.00",
      cost: 2511
    },

    {
      name: "7GB",
      duration: "30 days",
      price: 3800,
      productCode: "26",
      productId: "3500.02",
      cost: 3395
    },

    {
      name: "10GB",
      duration: "30 days",
      price: 4900,
      productCode: "27",
      productId: "4500.01",
      cost: 4365
    },

    {
      name: "12.5GB",
      duration: "30 days",
      price: 6000,
      productCode: "28",
      productId: "5500.01",
      cost: 5335
    },

    {
      name: "16.5GB",
      duration: "30 days",
      price: 7100,
      productCode: "29",
      productId: "6500.01",
      cost: 6305
    },

    {
      name: "20GB",
      duration: "30 days",
      price: 8200,
      productCode: "30",
      productId: "7500.01",
      cost: 7275
    },

    {
      name: "25GB",
      duration: "30 days",
      price: 9900,
      productCode: "31",
      productId: "9000.01",
      cost: 8730
    },

    {
      name: "20GB",
      duration: "7 days",
      price: 5500,
      productCode: "36",
      productId: "5000.01",
      cost: 4850
    }

  ],

  /*
  |--------------------------------------------------------------------------
  | GLO
  |--------------------------------------------------------------------------
  */

  Glo: [

    {
      name: "200MB",
      duration: "14 days",
      price: 150,
      productCode: "1",
      productId: "200",
      cost: 94
    },

    {
      name: "500MB",
      duration: "7 days",
      price: 300,
      productCode: "2",
      productId: "500",
      cost: 230
    },

    {
      name: "1GB",
      duration: "3 days",
      price: 500,
      productCode: "8",
      productId: "1000.11",
      cost: 392
    },

    {
      name: "3GB",
      duration: "3 days",
      price: 1400,
      productCode: "9",
      productId: "3000.11",
      cost: 1176
    },

    {
      name: "5GB",
      duration: "3 days",
      price: 2300,
      productCode: "10",
      productId: "5000.11",
      cost: 1960
    },

    {
      name: "1GB",
      duration: "30 days",
      price: 550,
      productCode: "3",
      productId: "1000",
      cost: 461
    },

    {
      name: "2GB",
      duration: "30 days",
      price: 1050,
      productCode: "4",
      productId: "2000",
      cost: 922
    },

    {
      name: "3GB",
      duration: "30 days",
      price: 1600,
      productCode: "5",
      productId: "3000",
      cost: 1383
    },

    {
      name: "5GB",
      duration: "30 days",
      price: 2600,
      productCode: "6",
      productId: "5000",
      cost: 2306
    },

    {
      name: "7.5GB",
      duration: "30 days",
      price: 3000,
      productCode: "20",
      productId: "2500.01",
      cost: 2425
    },

    {
      name: "10GB",
      duration: "30 days",
      price: 5200,
      productCode: "21",
      productId: "3000.01",
      cost: 2910
    },

    {
      name: "12.5GB",
      duration: "30 days",
      price: 4500,
      productCode: "22",
      productId: "4000.01",
      cost: 3880
    },

    {
      name: "16GB",
      duration: "30 days",
      price: 5500,
      productCode: "23",
      productId: "5000.01",
      cost: 4850
    },

    {
      name: "28GB",
      duration: "30 days",
      price: 8500,
      productCode: "24",
      productId: "8000.01",
      cost: 7760
    }

  ],

  /*
  |--------------------------------------------------------------------------
  | AIRTEL
  |--------------------------------------------------------------------------
  */

  Airtel: [

    {
      name: "1GB",
      duration: "1 day",
      price: 550,
      productCode: "14",
      productId: "499.91",
      cost: 484.91
    },

    {
      name: "1.5GB",
      duration: "2 days",
      price: 650,
      productCode: "15",
      productId: "599.91",
      cost: 581.91
    },

    {
      name: "2GB",
      duration: "2 days",
      price: 800,
      productCode: "16",
      productId: "749.91",
      cost: 727.41
    },

    {
      name: "3GB",
      duration: "2 days",
      price: 1050,
      productCode: "17",
      productId: "999.91",
      cost: 969.91
    },

    {
      name: "5GB",
      duration: "2 days",
      price: 1600,
      productCode: "18",
      productId: "1499.91",
      cost: 1454.91
    },

    {
      name: "500MB",
      duration: "7 days",
      price: 550,
      productCode: "19",
      productId: "499.92",
      cost: 484.92
    },

    {
      name: "1GB",
      duration: "7 days",
      price: 900,
      productCode: "20",
      productId: "799.91",
      cost: 775.91
    },

    {
      name: "1.5GB",
      duration: "7 days",
      price: 1100,
      productCode: "21",
      productId: "999.92",
      cost: 969.92
    },

    {
      name: "3.5GB",
      duration: "7 days",
      price: 1650,
      productCode: "22",
      productId: "1499.92",
      cost: 1454.92
    },

    {
      name: "6GB",
      duration: "7 days",
      price: 2750,
      productCode: "23",
      productId: "2499.91",
      cost: 2424.91
    },

    {
      name: "10GB",
      duration: "7 days",
      price: 3300,
      productCode: "24",
      productId: "2999.91",
      cost: 2909.91
    },

    {
      name: "18GB",
      duration: "7 days",
      price: 5500,
      productCode: "25",
      productId: "4999.91",
      cost: 4849.91
    },

    {
      name: "2GB",
      duration: "30 days",
      price: 1650,
      productCode: "26",
      productId: "1499.93",
      cost: 1454.93
    },

    {
      name: "3GB",
      duration: "30 days",
      price: 2200,
      productCode: "27",
      productId: "1999.91",
      cost: 1939.91
    },

    {
      name: "4GB",
      duration: "30 days",
      price: 2750,
      productCode: "28",
      productId: "2499.92",
      cost: 2424.92
    },

    {
      name: "8GB",
      duration: "30 days",
      price: 3300,
      productCode: "29",
      productId: "2999.92",
      cost: 2909.92
    },

    {
      name: "10GB",
      duration: "30 days",
      price: 4300,
      productCode: "30",
      productId: "3999.91",
      cost: 3879.91
    },

    {
      name: "13GB",
      duration: "30 days",
      price: 5300,
      productCode: "31",
      productId: "4999.92",
      cost: 4849.92
    },

    {
      name: "18GB",
      duration: "30 days",
      price: 6300,
      productCode: "32",
      productId: "5999.91",
      cost: 5819.91
    },

    {
      name: "25GB",
      duration: "30 days",
      price: 8200,
      productCode: "33",
      productId: "7999.91",
      cost: 7759.91
    }

  ],

  /*
  |--------------------------------------------------------------------------
  | 9MOBILE
  |--------------------------------------------------------------------------
  */

  "9mobile": [

    {
      name: "50MB",
      duration: "30 days",
      price: 100,
      productCode: "1",
      productId: "50",
      cost: 25
    },

    {
      name: "100MB",
      duration: "30 days",
      price: 150,
      productCode: "2",
      productId: "100",
      cost: 51
    },

    {
      name: "300MB",
      duration: "30 days",
      price: 200,
      productCode: "3",
      productId: "300",
      cost: 153
    },

    {
      name: "500MB",
      duration: "30 days",
      price: 300,
      productCode: "4",
      productId: "500",
      cost: 246
    },

    {
      name: "1GB",
      duration: "30 days",
      price: 600,
      productCode: "5",
      productId: "1000",
      cost: 492
    },

    {
      name: "2GB",
      duration: "30 days",
      price: 1150,
      productCode: "6",
      productId: "2000",
      cost: 984
    },

    {
      name: "3GB",
      duration: "30 days",
      price: 1700,
      productCode: "7",
      productId: "3000",
      cost: 1476
    },

    {
      name: "4GB",
      duration: "30 days",
      price: 2200,
      productCode: "8",
      productId: "4000",
      cost: 1968
    },

    {
      name: "5GB",
      duration: "30 days",
      price: 2800,
      productCode: "9",
      productId: "5000",
      cost: 2460
    },

    {
      name: "10GB",
      duration: "30 days",
      price: 5500,
      productCode: "10",
      productId: "10000",
      cost: 4920
    },

    {
      name: "15GB",
      duration: "30 days",
      price: 7900,
      productCode: "11",
      productId: "15000",
      cost: 7380
    },

    {
      name: "20GB",
      duration: "30 days",
      price: 10500,
      productCode: "12",
      productId: "20000",
      cost: 9840
    },

    {
      name: "25GB",
      duration: "30 days",
      price: 13000,
      productCode: "13",
      productId: "25000",
      cost: 12300
    }

  ]

};

/*
|--------------------------------------------------------------------------
| HELPER FUNCTIONS
|--------------------------------------------------------------------------
*/

function createRequestId() {

  return (
    "NOVA-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
  );

}

function getPlan(network, planIndex) {

  if (!DATA_PLANS[network]) {
    return null;
  }

  const index = Number(planIndex);

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= DATA_PLANS[network].length
  ) {
    return null;
  }

  return DATA_PLANS[network][index];

}

/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {

  res.json({
    message: "NOVA Data API is running 🚀",
    version: "3.0.0"
  });

});

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {

  res.json({
    success: true,
    status: "online",
    service: "NOVA Data API"
  });

});

/*
|--------------------------------------------------------------------------
| GET NETWORKS
|--------------------------------------------------------------------------
*/

app.get("/api/networks", (req, res) => {

  const networks = Object.keys(NETWORK_CODES).map(
    (name) => ({
      name: name,
      networkId: NETWORK_CODES[name]
    })
  );

  res.json({
    success: true,
    networks: networks
  });

});

/*
|--------------------------------------------------------------------------
| GET ALL PLANS
|--------------------------------------------------------------------------
*/

app.get("/api/plans", (req, res) => {

  const network = req.query.network;

  if (!network) {

    return res.json({
      success: true,
      plans: DATA_PLANS
    });

  }

  if (!DATA_PLANS[network]) {

    return res.status(404).json({
      success: false,
      error: "Network not found"
    });

  }

  res.json({
    success: true,
    network: network,
    networkId: NETWORK_CODES[network],
    plans: DATA_PLANS[network]
  });

});

/*
|--------------------------------------------------------------------------
| CREATE NOVA ORDER
|--------------------------------------------------------------------------
*/

app.post("/api/order", (req, res) => {

  try {

    const {
      network,
      phone,
      planIndex
    } = req.body;

    if (
      !network ||
      !phone ||
      planIndex === undefined
    ) {

      return res.status(400).json({
        success: false,
        error: "Network, phone and planIndex are required"
      });

    }

    if (!NETWORK_CODES[network]) {

      return res.status(400).json({
        success: false,
        error: "Invalid network"
      });

    }

    const plan =
      getPlan(network, planIndex);

    if (!plan) {

      return res.status(400).json({
        success: false,
        error: "Invalid data plan"
      });

    }

    const requestId =
      createRequestId();

    const order = {

      requestId: requestId,

      network: network,

      networkId:
        NETWORK_CODES[network],

      phone: phone,

      bundle:
        plan.name,

      duration:
        plan.duration,

      price:
        plan.price,

      productCode:
        plan.productCode,

      productId:
        plan.productId,

      status:
        "pending",

      createdAt:
        new Date().toISOString()

    };

    console.log(
      "NOVA ORDER CREATED:",
      order
    );

    return res.json({

      success: true,

      message:
        "Order created successfully",

      order: order

    });

  } catch (error) {

    console.error(
      "ORDER ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        "Unable to create order"

    });

  }

});

/*
|--------------------------------------------------------------------------
| PART 1 ENDS HERE
|--------------------------------------------------------------------------
|
| PART 2 will continue from this point with:
|
| - Paystack payment verification
| - ClubKonnect delivery
| - RequestID generation/handling
| - Transaction querying
| - Callback handling
| - Final app.listen()
|
|--------------------------------------------------------------------------
*/


