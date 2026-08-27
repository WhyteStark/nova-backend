const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const PAYSTACK_SECRET_KEY =
  process.env.PAYSTACK_SECRET_KEY;

const CLUBKONNECT_USERID =
  process.env.CLUBKONNECT_USERID;

const CLUBKONNECT_APIKEY =
  process.env.CLUBKONNECT_APIKEY;

const NOVA_CALLBACK_URL =
  process.env.NOVA_CALLBACK_URL ||
  `https://nova-backend-fh5p.onrender.com/api/clubkonnect/callback`;

const PAYSTACK_CALLBACK_URL =
  process.env.PAYSTACK_CALLBACK_URL ||
  "";


/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(cors());


/*
|--------------------------------------------------------------------------
| PAYSTACK WEBHOOK
|--------------------------------------------------------------------------
|
| This route must receive the RAW request body so the Paystack
| signature can be verified correctly.
|
|--------------------------------------------------------------------------
*/

app.post(
  "/api/paystack/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {

    try {

      const signature =
        req.headers["x-paystack-signature"];

      if (!PAYSTACK_SECRET_KEY) {
        return res.sendStatus(200);
      }

      if (!signature) {
        return res.sendStatus(401);
      }

      const hash =
        crypto
          .createHmac(
            "sha512",
            PAYSTACK_SECRET_KEY
          )
          .update(req.body)
          .digest("hex");

      const expected =
        Buffer.from(hash, "utf8");

      const received =
        Buffer.from(signature, "utf8");

      if (
        expected.length !== received.length ||
        !crypto.timingSafeEqual(
          expected,
          received
        )
      ) {
        console.log(
          "INVALID PAYSTACK WEBHOOK SIGNATURE"
        );

        return res.sendStatus(401);
      }

      const event =
        JSON.parse(req.body.toString());

      console.log(
        "PAYSTACK WEBHOOK:",
        event.event
      );

      /*
       * We intentionally do not blindly deliver data here.
       *
       * Delivery is handled through the same verified-payment
       * function below so duplicate webhook events cannot
       * accidentally send the same data twice.
       */

      if (
        event.event === "charge.success"
      ) {

        const reference =
          event?.data?.reference;

        if (reference) {

          await processSuccessfulPayment(
            reference
          );

        }

      }

      return res.sendStatus(200);

    }

    catch (error) {

      console.error(
        "PAYSTACK WEBHOOK ERROR:",
        error
      );

      return res.sendStatus(200);

    }

  }
);


/*
|--------------------------------------------------------------------------
| JSON BODY PARSER
|--------------------------------------------------------------------------
*/

app.use(express.json());


/*
|--------------------------------------------------------------------------
| NOVA DATA CATALOGUE
|--------------------------------------------------------------------------
|
| price = NOVA customer selling price
| cost = ClubKonnect supplier cost
| productCode = ClubKonnect PRODUCT_CODE
| productId = ClubKonnect PRODUCT_ID
|
|--------------------------------------------------------------------------
*/

const DATA_PLANS = {

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

    /*
     * IMPORTANT:
     * Previous price was ₦3,500 while supplier cost was ₦4,612.
     * That would lose ₦1,112 per sale.
     */
    {
      name: "10GB",
      duration: "30 days",
      price: 5200,
      productCode: "7",
      productId: "10000",
      cost: 4612
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
| NETWORK CODES
|--------------------------------------------------------------------------
*/

const NETWORK_CODES = {

  MTN: "01",

  Glo: "02",

  "9mobile": "03",

  Airtel: "04"

};


/*
|--------------------------------------------------------------------------
| ORDER STORAGE
|--------------------------------------------------------------------------
|
| IMPORTANT:
| This is temporary in-memory storage.
|
| For production, move orders to MongoDB/PostgreSQL/Supabase/etc.
| because Render can restart the server.
|
|--------------------------------------------------------------------------
*/

const ORDERS = new Map();


/*
|--------------------------------------------------------------------------
| HELPER: CREATE REQUEST ID
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


/*
|--------------------------------------------------------------------------
| HELPER: GET PLAN
|--------------------------------------------------------------------------
*/

function getPlan(network, planIndex) {

  if (!DATA_PLANS[network]) {
    return null;
  }

  const index =
    Number(planIndex);

  if (
    !Number.isInteger(index) ||
    !DATA_PLANS[network][index]
  ) {

    return null;

  }

  return DATA_PLANS[network][index];

}


/*
|--------------------------------------------------------------------------
| HELPER: VERIFY PAYSTACK TRANSACTION
|--------------------------------------------------------------------------
*/

async function verifyPaystack(reference) {

  if (!PAYSTACK_SECRET_KEY) {

    throw new Error(
      "PAYSTACK_SECRET_KEY is not configured"
    );

  }

  const response =
    await fetch(
      "https://api.paystack.co/transaction/verify/" +
      encodeURIComponent(reference),
      {

        method: "GET",

        headers: {

          Authorization:
            `Bearer ${PAYSTACK_SECRET_KEY}`,

          "Content-Type":
            "application/json"

        }

      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data?.message ||
      "Paystack verification failed"
    );

  }

  return data;

}


/*
|--------------------------------------------------------------------------
| HOME
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {

  res.json({

    message:
      "NOVA Data API is running 🚀",

    version:
      "3.0.0"

  });

});


/*
|--------------------------------------------------------------------------
| HEALTH
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {

  res.json({

    success: true,

    status:
      "online",

    service:
      "NOVA Data API",

    time:
      new Date().toISOString()

  });

});


/*
|--------------------------------------------------------------------------
| NETWORKS
|--------------------------------------------------------------------------
*/

app.get("/api/networks", (req, res) => {

  const networks =
    Object.keys(NETWORK_CODES)
      .map((name) => ({

        name,

        networkId:
          NETWORK_CODES[name],

        plans:
          DATA_PLANS[name].length

      }));

  res.json({

    success: true,

    networks

  });

});


/*
|--------------------------------------------------------------------------
| ALL PLANS / PLANS BY NETWORK
|--------------------------------------------------------------------------
*/

app.get("/api/plans", (req, res) => {

  const network =
    req.query.network;

  if (!network) {

    return res.json({

      success: true,

      plans:
        DATA_PLANS

    });

  }


  if (!DATA_PLANS[network]) {

    return res.status(404).json({

      success: false,

      error:
        "Network not found"

    });

  }


  res.json({

    success: true,

    network,

    networkId:
      NETWORK_CODES[network],

    plans:
      DATA_PLANS[network]

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
      planIndex,
      email
    } = req.body;


    if (
      !network ||
      !phone ||
      planIndex === undefined
    ) {

      return res.status(400).json({

        success: false,

        error:
          "Network, phone and planIndex are required"

      });

    }


    const plan =
      getPlan(
        network,
        planIndex
      );


    if (!plan) {

      return res.status(400).json({

        success: false,

        error:
          "Invalid network or data plan"

      });

    }


    const cleanPhone =
      String(phone)
        .replace(/\D/g, "");


    if (
      cleanPhone.length < 10 ||
      cleanPhone.length > 15
    ) {

      return res.status(400).json({

        success: false,

        error:
          "Invalid phone number"

      });

    }


    const requestId =
      createRequestId();


    const order = {

      requestId,

      network,

      networkId:
        NETWORK_CODES[network],

      phone:
        cleanPhone,

      email:
        email || null,

      planIndex:
        Number(planIndex),

      bundle:
        plan.name,

      duration:
        plan.duration,

      price:
        Number(plan.price),

      cost:
        Number(plan.cost),

      productCode:
        plan.productCode,

      productId:
        plan.productId,

      status:
        "pending_payment",

      deliveryStatus:
        "not_delivered",

      paymentReference:
        null,

      supplierOrderId:
        null,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };


    ORDERS.set(
      requestId,
      order
    );


    console.log(
      "NOVA ORDER CREATED:",
      order
    );


    return res.json({

      success: true,

      message:
        "Order created successfully",

      order

    });

  }

  catch (error) {

    console.error(
      "CREATE ORDER ERROR:",
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
| INITIALIZE PAYSTACK PAYMENT
|--------------------------------------------------------------------------
*/

app.post(
  "/api/payment/initialize",
  async (req, res) => {





/*
|--------------------------------------------------------------------------
| DELIVER ORDER TO CLUBKONNECT
|--------------------------------------------------------------------------
*/

async function deliverOrder(order) {

  if (!order) {

    throw new Error(
      "Order is required"
    );

  }


  if (
    order.deliveryStatus ===
    "delivered"
  ) {

    return order;

  }


  if (
    !CLUBKONNECT_USERID ||
    !CLUBKONNECT_APIKEY
  ) {

    order.deliveryStatus =
      "delivery_error";

    order.deliveryMessage =
      "ClubKonnect credentials are missing";

    order.updatedAt =
      new Date().toISOString();

    ORDERS.set(
      order.requestId,
      order
    );

    throw new Error(
      "ClubKonnect credentials are missing"
    );

  }


  const plan =
    getPlan(
      order.network,
      order.planIndex
    );


  if (!plan) {

    throw new Error(
      "Data plan no longer exists"
    );

  }


  order.deliveryStatus =
    "processing";

  order.status =
    "delivery_processing";

  order.updatedAt =
    new Date().toISOString();

  ORDERS.set(
    order.requestId,
    order
  );


  const url =
    "https://www.nellobytesystems.com/APIDatabundleV1.asp" +

    "?UserID=" +
    encodeURIComponent(
      CLUBKONNECT_USERID
    ) +

    "&APIKey=" +
    encodeURIComponent(
      CLUBKONNECT_APIKEY
    ) +

    "&MobileNetwork=" +
    encodeURIComponent(
      NETWORK_CODES[order.network]
    ) +

    "&DataPlan=" +
    encodeURIComponent(
      plan.productCode
    ) +

    "&MobileNumber=" +
    encodeURIComponent(
      order.phone
    ) +

    "&RequestID=" +
    encodeURIComponent(
      order.requestId
    ) +

    "&CallBackURL=" +
    encodeURIComponent(
      NOVA_CALLBACK_URL
    );


  console.log(
    "CLUBKONNECT DELIVERY REQUEST:",
    {

      requestId:
        order.requestId,

      network:
        order.network,

      networkId:
        NETWORK_CODES[order.network],

      phone:
        order.phone,

      productCode:
        plan.productCode,

      productId:
        plan.productId

    }
  );


  const response =
    await fetch(url);


  const raw =
    await response.text();


  let data;


  try {

    data =
      JSON.parse(raw);

  }

  catch {

    data = {
      raw
    };

  }


  console.log(
    "CLUBKONNECT DELIVERY RESPONSE:",
    data
  );


  /*
   * Different supplier responses may use different
   * field names, so we inspect the common ones.
   */

  const supplierStatus =
    String(
      data?.status ??
      data?.Status ??
      data?.statuscode ??
      data?.StatusCode ??
      ""
    ).toLowerCase();


  const supplierOrderId =
    data?.orderid ??
    data?.OrderID ??
    data?.orderId ??
    null;


  order.supplierOrderId =
    supplierOrderId;


  order.supplierResponse =
    data;


  /*
   * We do NOT automatically call every response "delivered".
   *
   * If ClubKonnect accepts the request, we mark it processing.
   * The callback/query endpoint will update the final state.
   */

  if (!response.ok) {

    order.deliveryStatus =
      "delivery_error";

    order.status =
      "delivery_failed";

    order.deliveryMessage =
      "ClubKonnect HTTP request failed";

  }

  else {

    order.deliveryStatus =
      "processing";

    order.status =
      "delivery_processing";

  }


  /*
   * Some supplier responses may explicitly indicate success.
   */

  if (
    supplierStatus === "success" ||
    supplierStatus === "successful" ||
    supplierStatus === "completed" ||
    supplierStatus === "delivered"
  ) {

    order.deliveryStatus =
      "delivered";

    order.status =
      "completed";

    order.deliveredAt =
      new Date().toISOString();

  }


  order.updatedAt =
    new Date().toISOString();


  ORDERS.set(
    order.requestId,
    order
  );


  return order;

}


/*
|--------------------------------------------------------------------------
| MANUAL DELIVERY ENDPOINT
|--------------------------------------------------------------------------
|
| This endpoint is protected by Paystack verification.
| The frontend should send:
|
| {
|   "requestId": "NOVA-...",
|   "reference": "NOVA-..."
| }
|
|--------------------------------------------------------------------------
*/

app.post(
  "/api/deliver",
  async (req, res) => {

    try {

      const {
        requestId,
        reference
      } = req.body;


      if (
        !requestId ||
        !reference
      ) {

        return res.status(400).json({

          success: false,

          error:
            "requestId and reference are required"

        });

      }


      const order =
        ORDERS.get(requestId);


      if (!order) {

        return res.status(404).json({

          success: false,

          error:
            "Order not found"

        });

      }


      if (
        order.requestId !==
        reference
      ) {

        return res.status(400).json({

          success: false,

          error:
            "Payment reference does not match order"

        });

      }


      /*
       * Verify directly with Paystack.
       * Never trust the frontend saying "payment successful".
       */

      const payment =
        await verifyPaystack(
          reference
        );


      const transaction =
        payment.data;


      if (
        transaction?.status !==
        "success"
      ) {

        return res.status(400).json({

          success: false,

          error:
            "Payment has not been successfully verified",

          paymentStatus:
            transaction?.status

        });

      }


      const expectedAmount =
        Math.round(
          Number(order.price) * 100
        );


      if (
        Number(transaction.amount) !==
        expectedAmount
      ) {

        return res.status(400).json({

          success: false,

          error:
            "Payment amount does not match order amount"

        });

      }


      order.paymentReference =
        reference;

      order.status =
        "payment_success";

      order.updatedAt =
        new Date().toISOString();

      ORDERS.set(
        requestId,
        order
      );


      /*
       * Prevent double delivery.
       */

      if (
        order.deliveryStatus ===
        "delivered"
      ) {

        return res.json({

          success: true,

          message:
            "Order was already delivered",

          order

        });

      }


      const deliveredOrder =
        await deliverOrder(
          order
        );


      return res.json({

        success: true,

        message:
          "Data delivery request submitted",

        order:
          deliveredOrder

      });

    }

    catch (error) {

      console.error(
        "DELIVERY ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        error:
          error.message ||
          "Unable to process delivery"

      });

    }

  }
);


/*
|--------------------------------------------------------------------------
| CLUBKONNECT CALLBACK
|--------------------------------------------------------------------------
|
| ClubKonnect can call this URL after processing.
|
| NOVA accepts both GET and POST because supplier callback
| formats can differ.
|
|--------------------------------------------------------------------------
*/

async function handleClubKonnectCallback(
  req,
  res
) {

  try {

    const payload = {

      ...(req.query || {}),

      ...(req.body || {})

    };


    console.log(
      "CLUBKONNECT CALLBACK:",
      payload
    );


    const requestId =
      payload.RequestID ??
      payload.requestId ??
      payload.REQUESTID ??
      payload.requestid;


    const orderId =
      payload.OrderID ??
      payload.orderId ??
      payload.ORDERID ??
      payload.orderid;


    const status =
      String(
        payload.Status ??
        payload.status ??
        payload.STATUS ??
        payload.ResponseCode ??
        payload.responseCode ??
        ""
      ).toLowerCase();


    let order = null;


    if (requestId) {

      order =
        ORDERS.get(
          requestId
        );

    }


    /*
     * Try supplier OrderID if RequestID wasn't found.
     */

    if (
      !order &&
      orderId
    ) {

      for (
        const item of ORDERS.values()
      ) {

        if (
          String(
            item.supplierOrderId
          ) ===
          String(orderId)
        ) {

          order = item;

          break;

        }

      }

    }


    if (!order) {

      console.log(
        "CALLBACK ORDER NOT FOUND:",
        {
          requestId,
          orderId
        }
      );


      return res.json({

        success: true,

        message:
          "Callback received but order was not found",

        requestId:
          requestId || null,

        orderId:
          orderId || null

      });

    }


    order.callback =
      payload;


    order.callbackReceivedAt =
      new Date().toISOString();


    /*
     * Map common successful statuses.
     */

    const successful =
      [
        "success",
        "successful",
        "completed",
        "complete",
        "delivered",
        "00"
      ].includes(status);


    const failed =
      [
        "failed",
        "failure",
        "cancelled",
        "canceled",
        "error"
      ].includes(status);


    if (successful) {

      order.deliveryStatus =
        "delivered";

      order.status =
        "completed";

      order.deliveredAt =
        new Date().toISOString();

    }

    else if (failed) {

      order.deliveryStatus =
        "failed";

      order.status =
        "delivery_failed";

    }

    else {

      order.deliveryStatus =
        "processing";

      order.status =
        "delivery_processing";

    }


    order.updatedAt =
      new Date().toISOString();


    ORDERS.set(
      order.requestId,
      order
    );


    return res.json({

      success: true,

      message:
        "Callback received",

      requestId:
        order.requestId,

      status:
        order.status

    });

  }

  catch (error) {

    console.error(
      "CLUBKONNECT CALLBACK ERROR:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Callback processing failed"

    });

  }

}


app.get(
  "/api/clubkonnect/callback",
  handleClubKonnectCallback
);


app.post(
  "/api/clubkonnect/callback",
  handleClubKonnectCallback
);


/*
|--------------------------------------------------------------------------
| QUERY CLUBKONNECT TRANSACTION
|--------------------------------------------------------------------------
*/

app.get(
  "/api/query",
  async (req, res) => {

    try {

      const {
        orderId,
        requestId
      } = req.query;


      if (
        !orderId &&
        !requestId
      ) {

        return res.status(400).json({

          success: false,

          error:
            "Provide orderId or requestId"

        });

      }


      if (
        !CLUBKONNECT_USERID ||
        !CLUBKONNECT_APIKEY
      ) {

        return res.status(500).json({

          success: false,

          error:
            "ClubKonnect credentials are missing"

        });

      }


      let url =
        "https://www.nellobytesystems.com/APIQueryV1.asp" +

        "?UserID=" +
        encodeURIComponent(
          CLUBKONNECT_USERID
        ) +

        "&APIKey=" +
        encodeURIComponent(
          CLUBKONNECT_APIKEY
        );


      if (orderId) {

        url +=
          "&OrderID=" +
          encodeURIComponent(
            orderId
          );

      }

      else {

        url +=
          "&RequestID=" +
          encodeURIComponent(
            requestId
          );

      }


      const response =
        await fetch(url);


      const raw =
        await response.text();


      let data;


      try {

        data =
          JSON.parse(raw);

      }

      catch {

        data = {
          raw
        };

      }


      console.log(
        "CLUBKONNECT QUERY:",
        data
      );


      /*
       * Update our local order when possible.
       */

      let localOrder = null;


      if (requestId) {

        localOrder =
          ORDERS.get(
            requestId
          );

      }


      if (
        !localOrder &&
        orderId
      ) {

        for (
          const item of ORDERS.values()
        ) {

          if (
            String(
              item.supplierOrderId
            ) ===
            String(orderId)
          ) {

            localOrder =
              item;

            break;

          }

        }

      }


      if (localOrder) {

        localOrder.lastQueryResponse =
          data;

        localOrder.lastQueriedAt =
          new Date().toISOString();


        const status =
          String(
            data?.Status ??
            data?.status ??
            data?.ResponseCode ??
            data?.responseCode ??
            ""
          ).toLowerCase();


        if (
          [
            "success",
            "successful",
            "completed",
            "complete",
            "delivered",
            "00"
          ].includes(status)
        ) {

          localOrder.deliveryStatus =
            "delivered";

          localOrder.status =
            "completed";

          localOrder.deliveredAt =
            localOrder.deliveredAt ||
            new Date().toISOString();

        }


        else if (
          [
            "failed",
            "failure",
            "cancelled",
            "canceled",
            "error"
          ].includes(status)
        ) {

          localOrder.deliveryStatus =
            "failed";

          localOrder.status =
            "delivery_failed";

        }


        ORDERS.set(
          localOrder.requestId,
          localOrder
        );

      }


      return res.status(
        response.ok ? 200 : response.status
      ).json({

        success:
          response.ok,

        queryType:
          orderId
            ? "OrderID"
            : "RequestID",

        orderId:
          orderId || null,

        requestId:
          requestId || null,

        response:
          data,

        order:
          localOrder || null

      });

    }

    catch (error) {

      console.error(
        "CLUBKONNECT QUERY ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        error:
          "Unable to query ClubKonnect transaction"

      });

    }

  }
);


/*
|--------------------------------------------------------------------------
| GET LOCAL ORDER
|--------------------------------------------------------------------------
*/

app.get(
  "/api/order/:requestId",
  (req, res) => {

    const order =
      ORDERS.get(
        req.params.requestId
      );


    if (!order) {

      return res.status(404).json({

        success: false,

        error:
          "Order not found"

      });

    }


    /*
     * Don't expose supplier credentials or supplier cost.
     */

    const safeOrder = {

      requestId:
        order.requestId,

      network:
        order.network,

      phone:
        order.phone,

      bundle:
        order.bundle,

      duration:
        order.duration,

      price:
        order.price,

      status:
        order.status,

      deliveryStatus:
        order.deliveryStatus,

      paymentReference:
        order.paymentReference,

      supplierOrderId:
        order.supplierOrderId,

      createdAt:
        order.createdAt,

      updatedAt:
        order.updatedAt,

      deliveredAt:
        order.deliveredAt || null

    };


    return res.json({

      success: true,

      order:
        safeOrder

    });

  }
);


/*
|--------------------------------------------------------------------------
| PAYSTACK CALLBACK / REDIRECT
|--------------------------------------------------------------------------
*/

app.get(
  "/api/payment/callback",
  async (req, res) => {

    try {

      const reference =
        req.query.reference;


      if (!reference) {

        return res.status(400).json({

          success: false,

          error:
            "Payment reference is missing"

        });

      }


      const order =
        await processSuccessfulPayment(
          reference
        );


      if (!order) {

        return res.status(400).json({

          success: false,

          error:
            "Payment could not be verified"

        });

      }


      return res.json({

        success: true,

        message:
          "Payment verified",

        requestId:
          order.requestId,

        status:
          order.status,

        deliveryStatus:
          order.deliveryStatus

      });

    }

    catch (error) {

      console.error(
        "PAYMENT CALLBACK ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        error:
          "Payment callback failed"

      });

    }

  }
);


/*
|--------------------------------------------------------------------------
| DEBUG / CATALOGUE CHECK
|--------------------------------------------------------------------------
*/

app.get(
  "/api/catalogue/check",
  (req, res) => {

    const result = {};


    for (
      const [network, plans]
      of Object.entries(DATA_PLANS)
    ) {

      result[network] =
        plans.map(
          (plan, index) => ({

            index,

            name:
              plan.name,

            duration:
              plan.duration,

            sellingPrice:
              plan.price,

            supplierCost:
              plan.cost,

            profit:
              Number(
                (
                  plan.price -
                  plan.cost
                ).toFixed(2)
              ),

            safe:
              plan.price >
              plan.cost

          })
        );

    }


    res.json({

      success: true,

      catalogue:
        result

    });

  }
);


/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use(
  (req, res) => {

    res.status(404).json({

      success: false,

      error:
        "Route not found",

      path:
        req.originalUrl

    });

  }
);


/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
  (error, req, res, next) => {

    console.error(
      "GLOBAL ERROR:",
      error
    );


    res.status(500).json({

      success: false,

      error:
        "Internal server error"

    });

  }
);


/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "======================================"
    );

    console.log(
      "🚀 NOVA DATA API"
    );

    console.log(
      "======================================"
    );

    console.log(
      `Port: ${PORT}`
    );

    console.log(
      "Status: ONLINE"
    );

    console.log(
      "Paystack:",
      PAYSTACK_SECRET_KEY
        ? "CONFIGURED"
        : "MISSING"
    );

    console.log(
      "ClubKonnect:",
      CLUBKONNECT_USERID &&
      CLUBKONNECT_APIKEY
        ? "CONFIGURED"
        : "MISSING"
    );

    console.log(
      "Callback:",
      NOVA_CALLBACK_URL
    );

    console.log(
      "======================================"
    );

  }
);
