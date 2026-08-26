const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/*
|--------------------------------------------------------------------------
| SERVE NOVA FRONTEND
|--------------------------------------------------------------------------
*/

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


/*
|--------------------------------------------------------------------------
| API HEALTH
|--------------------------------------------------------------------------
*/

app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "NOVA Data API"
  });
});


/*
|--------------------------------------------------------------------------
| RECEIVE AN ORDER
|--------------------------------------------------------------------------
*/

app.post("/api/order", (req, res) => {
  const {
    network,
    phone,
    bundle,
    price
  } = req.body;

  if (
    !network ||
    !phone ||
    !bundle ||
    price === undefined
  ) {
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


/*
|--------------------------------------------------------------------------
| VERIFY PAYSTACK TRANSACTION
|--------------------------------------------------------------------------
*/

app.get(
  "/api/verify-payment/:reference",
  async (req, res) => {

    try {

      const reference =
        req.params.reference;

      const secretKey =
        process.env.PAYSTACK_SECRET_KEY;

      if (!secretKey) {

        return res.status(500).json({
          error:
            "Paystack secret key is not configured"
        });

      }

      const response =
        await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${secretKey}`,

              "Content-Type":
                "application/json"
            }
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        return res
          .status(response.status)
          .json({
            error:
              "Paystack verification failed",

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

    }

    catch (error) {

      console.error(
        "PAYMENT VERIFICATION ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Unable to verify payment"
      });

    }

  }
);


/*
|--------------------------------------------------------------------------
| ALTERNATIVE PAYMENT VERIFICATION ROUTE
|--------------------------------------------------------------------------
*/

app.get(
  "/api/verify/:reference",
  async (req, res) => {

    try {

      const reference =
        req.params.reference;

      const response =
        await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

              "Content-Type":
                "application/json"
            }
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        return res
          .status(response.status)
          .json({
            success: false,

            error:
              data.message ||
              "Payment verification failed"
          });

      }

      res.json({
        success: true,
        status: data.data?.status,
        reference: data.data?.reference,
        amount: data.data?.amount,
        currency: data.data?.currency
      });

    }

    catch (error) {

      console.error(
        "Verification error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to verify payment"
      });

    }

  }
);


/*
|--------------------------------------------------------------------------
| CLUBKONNECT TEST
|--------------------------------------------------------------------------
*/

app.get(
  "/api/clubkonnect-test",
  async (req, res) => {

    try {

      const userId =
        process.env.CLUBKONNECT_USERID;

      const apiKey =
        process.env.CLUBKONNECT_APIKEY;

      if (!userId || !apiKey) {

        return res.status(500).json({
          success: false,
          error:
            "ClubKonnect credentials are missing"
        });

      }

      const url =
        `https://www.nellobytesystems.com/APIQueryV1.asp` +
        `?UserID=${encodeURIComponent(userId)}` +
        `&APIKey=${encodeURIComponent(apiKey)}` +
        `&ORDERID=NOVA-TEST-${Date.now()}`;

      
      const response =
        await fetch(url);

      const data =
        await response.text();

      res
        .status(
          response.ok
            ? 200
            : response.status
        )
        .send(data);

    }

    catch (error) {

      console.error(
        "CLUBKONNECT TEST ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to connect to ClubKonnect"
      });

    }

  }
);


/*
|--------------------------------------------------------------------------
| START NOVA SERVER
|--------------------------------------------------------------------------
*/

app.listen(
  PORT,
  () => {
    console.log(
      `NOVA backend running on port ${PORT}`
    );
  }
);
