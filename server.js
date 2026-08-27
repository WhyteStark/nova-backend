



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
