//======================================== PayPal Payment Processing ========================================//
app.get("/pay", (req, res) => {
    const cart = req.session.cart || [];
    const totalPrice = cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const finalPrice = (1.25 * totalPrice).toFixed(2);
  
    const payer = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      transactions: [
        {
          amount: {
            total: finalPrice,
            currency: "NZD",
          },
          description: "Purchase from demo store",
        },
      ],
      redirect_urls: {
        return_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
      },
    };
  
    // PayPal API call
    const paypal = require("paypal-rest-sdk");
    paypal.configure({
      mode: "sandbox", // sandbox or live
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    });
  
    paypal.payment.create(payer, (error, payment) => {
      if (error) {
        console.error(error);
        res.status(500).send("Payment creation failed!");
      } else {
        res.redirect(payment.links[1].href); // Redirect to PayPal for approval
      }
    });
  });
  
  // Success and Cancel routes
  app.get("/success", (req, res) => {
    req.session.cart = []; // Clear the cart after successful payment
    req.flash('success_msg', "Payment successful!")
    res.redirect("/cart");
  });
  
  app.get("/cancel", (req, res) => {
    res.send("Payment cancelled!");
  });
  ///============================================================ End of paypal payment integration ===========================================//
 