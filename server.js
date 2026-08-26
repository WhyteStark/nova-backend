const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/*
|--------------------------------------------------------------------------
| FRONTEND
|--------------------------------------------------------------------------
*/

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});


/*
|--------------------------------------------------------------------------
| HEALTH CHECK
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
| CREATE NOVA ORDER
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
| PAYSTACK VERIFICATION
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
        return res.status(response.status).json({
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

    } catch (error) {

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
| ALTERNATIVE PAYSTACK VERIFICATION
|--------------------------------------------------------------------------
*/

app.get(
  "/api/verify/:reference",
  async (req, res) => {

    try {

      const reference =
        req.params.reference;

      const secretKey =
        process.env.PAYSTACK_SECRET_KEY;

      if (!secretKey) {
        return res.status(500).json({
          success: false,
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
        return res.status(response.status).json({
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

    } catch (error) {

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
| CLUBKONNECT CONFIG
|--------------------------------------------------------------------------
*/

const CLUBKONNECT_BASE =
  "https://www.nellobytesystems.com";


function getClubKonnectCredentials() {

  const userId =
    process.env.CLUBKONNECT_USERID;

  const apiKey =
    process.env.CLUBKONNECT_APIKEY;

  if (!userId || !apiKey) {
    return null;
  }

  return {
    userId,
    apiKey
  };
}


/*
|--------------------------------------------------------------------------
| GET CLUBKONNECT NETWORKS
|--------------------------------------------------------------------------
|
| This keeps the credentials on the server.
|
*/

app.get(
  "/api/networks",
  async (req, res) => {

    try {

      const credentials =
        getClubKonnectCredentials();

      if (!credentials) {
        return res.status(500).json({
          success: false,
          error:
            "ClubKonnect credentials are missing"
        });
      }

      const url =
        CLUBKONNECT_BASE +
        "/APIDatabundleNetworkV2.asp" +
        `?UserID=${encodeURIComponent(credentials.userId)}` +
        `&APIKey=${encodeURIComponent(credentials.apiKey)}`;

      const response =
        await fetch(url);

      const text =
        await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error:
            "ClubKonnect network request failed",
          details: data
        });
      }

      res.json({
        success: true,
        networks: data
      });

    } catch (error) {

      console.error(
        "CLUBKONNECT NETWORK ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to retrieve ClubKonnect networks"
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| GET CLUBKONNECT DATA PLANS
|--------------------------------------------------------------------------
*/

app.get(
  "/api/data-plans",
  async (req, res) => {

    try {

      const credentials =
        getClubKonnectCredentials();

      if (!credentials) {
        return res.status(500).json({
          success: false,
          error:
            "ClubKonnect credentials are missing"
        });
      }

      const url =
        CLUBKONNECT_BASE +
        "/APIDatabundlePlansV2.asp" +
        `?UserID=${encodeURIComponent(credentials.userId)}` +
        `&APIKey=${encodeURIComponent(credentials.apiKey)}`;

      const response =
        await fetch(url);

      const text =
        await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error:
            "ClubKonnect plans request failed",
          details: data
        });
      }

      res.json({
        success: true,
        plans: data
      });

    } catch (error) {

      console.error(
        "CLUBKONNECT PLANS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to retrieve ClubKonnect data plans"
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| TEST CLUBKONNECT CONNECTION
|--------------------------------------------------------------------------
*/

app.get(
  "/api/clubkonnect-test",
  async (req, res) => {

    try {

      const credentials =
        getClubKonnectCredentials();

      if (!credentials) {
        return res.status(500).json({
          success: false,
          error:
            "ClubKonnect credentials are missing"
        });
      }

      /*
       * This is a transaction-query endpoint.
       * It requires a real OrderID or RequestID.
       *
       * We therefore don't send a fake transaction here.
       */

      res.json({
        success: true,
        message:
          "ClubKonnect credentials are configured. Use /api/networks or /api/data-plans to retrieve live data."
      });

    } catch (error) {

      console.error(
        "CLUBKONNECT TEST ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Unable to test ClubKonnect"
      });
    }
  }
);


/*
|--------------------------------------------------------------------------
| BUY DATA FROM CLUBKONNECT
|--------------------------------------------------------------------------
|
| This endpoint is deliberately separate from Paystack verification.
| We will connect the two only after testing the purchase endpoint.
|
*/

app.post(
  "/api/buy-data",
  async (req, res) => {

    try {

      const {
        mobileNetwork,
        dataPlan,
        mobileNumber,
        requestId
      } = req.body;


      if (
        !mobileNetwork ||
        !dataPlan ||
        !mobileNumber ||
        !requestId
      ) {

        return res.status(400).json({
          success: false,
          error:
            "Missing data purchase information"
        });

      }


      const credentials =
        getClubKonnectCredentials();


      if (!credentials) {

        return res.status(500).json({
          success: false,
          error:
            "ClubKonnect credentials are missing"
        });

      }


      const url =
        CLUBKONNECT_BASE +
        "/APIDatabundleV1.asp" +
        `?UserID=${encodeURIComponent(credentials.userId)}` +
        `&APIKey=${encodeURIComponent(credentials.apiKey)}` +
        `&MobileNetwork=${encodeURIComponent(mobileNetwork)}` +
        `&DataPlan=${encodeURIComponent(dataPlan)}` +
        `&MobileNumber=${encodeURIComponent(mobileNumber)}` +
        `&RequestID=${encodeURIComponent(requestId)}`;


      console.log(
        "CLUBKONNECT DATA REQUEST:",
        {
          mobileNetwork,
          dataPlan,
          mobileNumber,
          requestId
        }
      );


      const response =
        await fetch(url);


      const text =
        await response.text();


      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          raw: text
        };
      }


      if (!response.ok) {

        return res.status(response.status).json({
          success: false,
          error:
            "ClubKonnect data purchase request failed",
          details: data
        });

      }


      res.json({
        success: true,
        message:
          "ClubKonnect data order submitted",
        result: data
      });


    } catch (error) {

      console.error(
        "CLUBKONNECT DATA PURCHASE ERROR:",
        error
      );


      res.status(500).json({
        success: false,
        error:
          "Unable to submit data purchase"
      });

    }
  }
);


/*
|--------------------------------------------------------------------------
| QUERY CLUBKONNECT TRANSACTION BY REQUEST ID
|--------------------------------------------------------------------------
*/

app.get(
  "/api/clubkonnect/query/:requestId",
  async (req, res) => {

    try {

      const requestId =
        req.params.requestId;

      const credentials =
        getClubKonnectCredentials();


      if (!credentials) {

        return res.status(500).json({
          success: false,
          error:
            "ClubKonnect credentials are missing"
        });

      }


      const url =
        CLUBKONNECT_BASE +
        "/APIQueryV1.asp" +
        `?UserID=${encodeURIComponent(credentials.userId)}` +
        `&APIKey=${encodeURIComponent(credentials.apiKey)}` +
        `&RequestID=${encodeURIComponent(requestId)}`;


      const response =
        await fetch(url);


      const text =
        await response.text();


      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          raw: text
        };
      }


      res.status(
        response.ok
          ? 200
          : response.status
      ).json({
        success:
          response.ok,

        result:
          data
      });


    } catch (error) {

      console.error(
        "CLUBKONNECT QUERY ERROR:",
        error
      );


      res.status(500).json({
        success: false,
        error:
          "Unable to query ClubKonnect transaction"
      });

    }
  }
);


/*
|--------------------------------------------------------------------------
| START SERVER
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
