var express = require("express");
// import express from "express";
var app = express();
var bcrypt = require("bcrypt");
var paypal = require("./services/paypal")
var session = require("express-session");
var file = require("express-fileupload");
var conn = require("./dbconfig");
var db = require("./dbconfig2");
var flash = require("connect-flash");
var nodemailer = require("nodemailer");
var fileUpload = require("express-fileupload");
var axios = require('axios');
const dotenv = require("dotenv");

//paypal

dotenv.config(); // Load environment variables

//environment variables
const PORT = process.env.PORT || 3000;
const ENVIRONMENT = process.env.ENVIRONMENT;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

app.set("view engine", "ejs");

// =========================================== uses ========================================================//
app.use(
  session({
    secret: CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

//middleware to make 'user' available to all templates
app.use((req, res, next) => {
  res.locals.username = req.session.username;
  next();
});

app.use(express.json());
app.use(fileUpload());
app.use(flash());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static("public"));

//-----------------  Middleware to expose flash messages to views ----------------- //
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// ============================= Routes ============================================================//
//----------------- home page with pagination----------------- //
app.get("/", (req, res) => {
  const resultsPerPage = 3;
  const searchTerm = req.query.search || "";
  //cart functionality
  const cart = req.session.cart || [];
  const cartCount = req.session.cart ? req.session.cart.length : 0;
  const totalPrice = req.session.cart
    ? cart.reduce((total, item) => total + item.price * item.quantity, 0)
    : 0.0;
  conn.query("SELECT * FROM products", (err, results) => {
    if (err) throw err;
    const numOfResults = results.length;
    const numOfPages = Math.ceil(numOfResults / resultsPerPage);
    let page = req.query.page ? Number(req.query.page) : 1;

    if (page > numOfPages) {
      res.redirect("/?page=" + encodeURIComponent(numOfPages));
    } else if (page < 1) {
      res.redirect("/?page=" + encodeURIComponent("1"));
    }

    const startingLimit = (page - 1) * resultsPerPage;
    sql = `SELECT * FROM products LIMIT ${startingLimit}, ${resultsPerPage}`;

    conn.query(sql, (err, results) => {
      if (err) throw err;
      let iterator = page - 5 < 1 ? 1 : page - 5;
      let endingLink =
        iterator + 9 <= numOfPages ? iterator + 9 : page + (numOfPages - page);
      // if (endingLink < (page + 4)) {
      //   iterator -= (page + 4 - numOfPages);
      // }
      res.render("index", {
        data: results,
        page,
        numOfPages,
        iterator,
        endingLink,
        searchTerm,
        cart: req.session.cart || [],
        cartCount,
        totalPrice,
      });
    });
  });
});
app.get("/login", (req, res) => {
  //cart functionality
  const cart = req.session.cart || [];
  const cartCount = req.session.cart ? req.session.cart.length : 0;
  const totalPrice = req.session.cart
    ? cart.reduce((total, item) => total + item.price * item.quantity, 0)
    : 0.0;
  res.render("login", { cart: req.session.cart || [], cartCount, totalPrice });
});
app.get("/index", (req, res) => res.render("index"));
app.get("/checkout", (req, res) => {
  //cart functionality
  const cart = req.session.cart || [];
  const cartCount = req.session.cart ? req.session.cart.length : 0;
  const totalPrice = req.session.cart
    ? cart.reduce((total, item) => total + item.price * item.quantity, 0)
    : 0.0;
  res.render("checkout", {cart, cartCount, totalPrice });
});

app.get("/register", (req, res) => {

  //cart functionality
  const cart = req.session.cart || [];
  const cartCount = req.session.cart ? req.session.cart.length : 0;
  const totalPrice = req.session.cart
    ? cart.reduce((total, item) => total + item.price * item.quantity, 0)
    : 0.0;
  res.render("register", {
    cart: req.session.cart || [],
    cartCount,
    totalPrice,
  });
});
app.get("/contact", (req, res) => {
  const searchTerm = req.query.search || "";
    //cart functionality
    const cart = req.session.cart || [];
    const cartCount = req.session.cart ? req.session.cart.length : 0;
    const totalPrice = req.session.cart
      ? cart.reduce((total, item) => total + item.price * item.quantity, 0)
      : 0.0;
  res.render("contact", {
    cart: req.session.cart || [],
    cartCount,
    totalPrice,
  });
});

//----------------- View products ----------------- //
app.get("/view_products", (req, res) => {
  const searchTerm = req.query.search || "";
    //cart functionality
    const cart = req.session.cart || [];
    const cartCount = req.session.cart ? req.session.cart.length : 0;
    const totalPrice = req.session.cart
      ? cart.reduce((total, item) => total + item.price * item.quantity, 0)
      : 0.0;
  const query =
    "SELECT * FROM products WHERE description LIKE ? OR keywords LIKE ?";

  db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
    if (err) throw err;
    res.render("view_products", { results, searchTerm, cartCount, totalPrice });
  });
});

app.get("/products", (req, res) => {
  const searchTerm = req.query.search || "";
  res.render("products", { searchTerm });
});

// ----------------- admin dashboard ----------------- //
app.get("/admin", (req, res) => {
  const query =
    "SELECT rating, COUNT(*) AS count FROM product_rating GROUP BY rating";
  const salesquery = "SELECT week, sales_amount FROM weekly_sales";
  db.query(query, (err, results) => {
    if (err) throw err;

    db.query(salesquery, (err, saleResults) => {
      if (err) throw err;

      // Pass the product ratings and weeklt sales data to the EJS template
      res.render("adminviews/index", { ratings: results, sales: saleResults });
    });
  });
});
// ----------------- admin insert Brand ----------------- //
app.get("/admin/insertbrand", (req, res) =>
  res.render("adminviews/insertbrand")
);
// ----------------- admin insert category ----------------- //
app.get("/admin/insertcategory", (req, res) =>
  res.render("adminviews/insertcategory")
);
// ----------------- admin insert Product ----------------- //
app.get("/admin/insertproduct", (req, res) =>
  res.render("adminviews/insertproduct")
);

// ----------------- viewing all users ----------------- //
app.get("/admin/users", (req, res) => {
  conn.query(
    "SELECT * FROM users ORDER BY RAND() LIMIT 10",
    (error, results, fields) => {
      if (error) throw error;
      if (req.session.loggedin) {
        res.render("adminviews/users", { results: results });
      } else {
        req.flash("error", "This is an error message!");
        res.redirect("/login");
      }
    }
  );
});

//----------------- Handle login form submission ----------------- //
app.post("/auth", (req, res) => {
  const { username, password } = req.body;

  // Check if the username exists
  var sql = "SELECT * FROM users WHERE name = ?";
  conn.query(sql, [username], async (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      const user = results[0];

      // Compare the hashed password
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        // Set user session and redirect to the dashboard
        req.session.loggedin = true;
        req.session.username = user.name;

        req.flash("success_msg", " Successfuly logged in!");
        res.redirect("/admin");
      } else {
        // res.send('Invalid credentials!');
        req.flash("error_msg", "Invalid credentials! Try again");
        res.redirect("/login");
      }
    } else {
      req.flash("error_msg", "User not found");
      res.redirect("/login");
    }
  });
});

// -----------------  admin view all products----------------- //
app.get("/admin/all_products", (req, res) => {
  const searchTerm = req.query.search || "";
  const query =
    "SELECT * FROM products WHERE description LIKE ? OR keywords LIKE ?";

  db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
    if (err) throw err;
    res.render("adminviews/all_products", { results, searchTerm });
  });
});
//-----------------  Getting a product to edit  ----------------- //
app.get("/admin/edit_product/:id", (req, res) => {
  const productId = req.params.id;
  const sql = "SELECT * FROM products WHERE id = ?";
  conn.query(sql, [productId], (err, results) => {
    if (err) throw err;
    res.render("adminviews/editProduct", { record: results[0] });
  });
});

//----------------- Update Product  ----------------- //
app.post("/admin/update_product/:id", (req, res) => {
  const productId = req.params.id;
  const { product_name, description, keywords, category, brand, price } =
    req.body;
  const sql =
    "UPDATE products SET product_name = ?, description = ?, keywords = ?, category = ?, brand = ?, price = ? WHERE id = ?";
  conn.query(
    sql,
    [product_name, description, keywords, category, brand, price, productId],
    (err, results) => {
      if (err) throw err;
      req.flash("success_msg", "Product Updated successfully");
      res.redirect("/admin/all_products");
    }
  );
});

// ----------------- Deleting a product ----------------- /
app.get("/admin/delete_product/:id", (req, res) => {
  let pid = req.params.id;
  const sql = "DELETE FROM products WHERE id = ?";
  conn.query(sql, [pid], (err, results) => {
    if (err) throw err;
    req.flash("error_msg", "Product deleted Successfuly");
    res.redirect("/admin/all_products");
  });
});

// ----------------- admin view all Categories ----------------- /
app.get("/admin/all_categories", (req, res) => {
  conn.query("SELECT * FROM categories", (error, results) => {
    if (error) throw error;
    res.render("adminviews/all_categories", { results: results });
  });
});
//-----------------  getting category to edit----------------- //
app.get("/admin/edit_category/:id", (req, res) => {
  const id = req.params.id;

  conn.query(
    "SELECT * FROM categories WHERE id = ?",
    [id],
    (error, results, fields) => {
      if (error) throw error;
      res.render("adminviews/editCategory", { record: results[0] });
    }
  );
});

//-----------------  getting category to edit----------------- //
app.post("/admin/update_category/:id", (req, res) => {
  const categoryId = req.params.id;
  const { category_name, description } = req.body;
  const sql =
    "UPDATE categories SET category_name = ?, description = ? WHERE id = ? ";
  conn.query(sql, [category_name, description, categoryId], (err, results) => {
    if (err) throw err;
    req.flash("success_msg", "Category Updated successfully");
    res.redirect("/admin/all_categories");
  });
});

//----------------- admin delete a category----------------- //
app.get("/admin/delete_category/:id", (req, res) => {
  const categoryId = req.params.id;
  const sql = "DELETE FROM categories WHERE id = ? ";
  conn.query(
    "DELETE FROM categories WHERE id = ? ",
    [categoryId],
    (err, results) => {
      if (err) throw err;
      req.flash("err.msg", "Category deleted successfully");
      res.redirect("/admin/all_categories");
    }
  );
});

//----------------- admin view all Brands----------------- //
app.get("/admin/all_brands", (req, res) => {
  conn.query("SELECT * FROM brands", (error, results) => {
    if (error) throw error;
    res.render("adminviews/all_brands", { results: results });
  });
});

//----------------- admin edit Brand----------------- //
app.get("/admin/edit_brand/:id", (req, res) => {
  const brandId = req.params.id;
  const sql = "SELECT * FROM brands WHERE id = ?";
  conn.query(sql, [brandId], (err, results) => {
    if (err) throw err;
    res.render("adminviews/editBrand", { record: results[0] });
  });
});

//----------------- admin update Brand----------------- //
app.post("/admin/update_brand/:id", (req, res) => {
  const brandID = req.params.id;
  const { brand_name, description } = req.body;
  const sql = "UPDATE brands SET brand_name = ?, description = ? WHERE id = ? ";
  conn.query(sql, [brand_name, description, brandID], (err, results) => {
    if (err) throw err;
    req.flash("success_msg", "Brand updated successfully");
    res.redirect("/admin/all_brands");
  });
});

// ----------------- admin delete Brand ----------------- //
app.get("/admin/delete_brand/:id", (req, res) => {
  const bid = req.params.id;
  const sql = "DELETE FROM brands WHERE id = ? ";
  conn.query(sql, [bid], (err, results) => {
    if (err) throw err;
    req.flash("error_msg", "Brand deleted successfully");
    res.redirect("/admin/all_brands");
  });
});
// ----------------- inserting into users ----------------- //
app.post("/insertuser", async (req, res) => {
  let id = req.body.id;
  let name = req.body.username;
  let password = req.body.password;
  let surname = req.body.surname;
  let phone = req.body.phone;
  let email = req.body.email;
  let hash = await bcrypt.hash(password, 10);
  conn.query(
    "INSERT INTO users VALUES(?,?,?,?,?,?)",
    [id, name, hash, surname, phone, email],
    (error, results, fields) => {
      if (error) throw error;
      res.send(
        `<script>alert("Data inserted successfully"); window.location.href = "/login"; </script>`
      );
    }
  );
});

//-----------------  getting user to edit----------------- //
app.get("/admin/edituser/:id", (req, res) => {
  const id = req.params.id;

  conn.query(
    "SELECT * FROM users WHERE id = ?",
    [id],
    (error, results, fields) => {
      if (error) throw error;
      res.render("adminviews/edituser", { record: results[0] });
    }
  );
});

// -----------------  updating users table ----------------- //
app.post("/updateuser/:id", (req, res) => {
  const upid = req.params.id;
  const name = req.body.username;
  const password = req.body.password;
  const surname = req.body.surname;
  const phone = req.body.phone;
  const email = req.body.email;

  conn.query(
    "UPDATE users SET name = ?,  surname = ?, phone = ?, email = ? WHERE id = ?",
    [name, surname, phone, email, upid],
    (error, results, fields) => {
      if (error) throw error;
      req.flash("success_msg", "User updated successfully");
      res.redirect("/admin/users");
    }
  );
});

// ----------------- deleting a user ----------------- //
app.get("/deleteuser/:id", (req, res) => {
  const id = req.params.id;
  conn.query(
    "DELETE  FROM users WHERE id = ?",
    [id],
    (error, results, fields) => {
      if (error) throw error;
      req.flash("error_msg", "User deleted Successfuly");
      res.redirect("/admin/users");
    }
  );
});

//-----------------  insert products  ----------------- //
app.post("/admin/insertproduct", (req, res) => {
  const { product_name, description, keywords, category, brand, price } =
    req.body;
  let image;
  let uploadpath;
  image = req.files.image;
  uploadpath = __dirname + "/public/uploads/" + image.name;

  image.mv(uploadpath, (err) => {
    if (err) throw err;
  });

  conn.query(
    "INSERT INTO products(product_name, description, keywords, category, brand, price, image) VALUES(?, ?, ?, ?, ?, ?, ?)",
    [product_name, description, keywords, category, brand, price, image.name],
    (error, results, fields) => {
      if (error) throw error;
      req.flash("success_msg", "Product added Successfuly");
      res.redirect("/admin/insertproduct");
    }
  );
});

// ----------------- insert categories -----------------  //
app.post("/admin/insertcategory", (req, res) => {
  const { category_name, description } = req.body;
  conn.query(
    "INSERT INTO categories(category_name, description) VALUES(?,?)",
    [category_name, description],
    (error, results, fields) => {
      if (error) throw error;
      req.flash("success_msg", "Category added Successfuly");
      res.redirect("/admin/insertcategory");
    }
  );
});

// ----------------- Insert brand ----------------- //
app.post("/admin/insertbrand", (req, res) => {
  const { brand_name, description } = req.body;
  let sql = "INSERT INTO brands(brand_name,	description) VALUES(?,?)";
  conn.query(sql, [brand_name, description], (error, results, fields) => {
    if (error) throw error;
    req.flash("success_msg", "Brand added Successfuly");
    res.redirect("/admin/insertbrand");
  });
});
// ----------------- Logout ----------------- //
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

//-----------------  Sending mail using contact page ----------------- //
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ausiemass@gmail.com",
        pass: "jnqe fxlc sesy vabk",
      },
    });

    let mailOptions = {
      from: email,
      to: "ausiemass@yahoo.com",
      subject: `New message from ${name}`,
      text: message,
    };

    let info = await transporter.sendMail(mailOptions);

    console.log("Message sent: %s", info.messageId);
    res.redirect("contact");
  } catch (error) {
    console.error("Error sending email: ", error);
    res.status(500).send("Error sending email.");
  }
});

// -----------------  Adding items to cart----------------- //
app.post("/cart/:id", (req, res) => {
  const pid = req.params.id;
  const name = req.session.username;
  const { id, product_name, image, price, quantity } = req.body;
  sql =
    "INSERT INTO cart(Product_id, product_name,image, price, quantity, user_name)  VALUES(?,?,?,?,?,?) ";
  conn.query(
    sql,
    [id, product_name, image, price, quantity, name],
    (err, results, fields) => {
      if (err) throw err;
      res.redirect("/");
    }
  );
});

//======================================== checkout and cart ========================================//
// Add to Cart
app.post("/add-to-cart/:id", (req, res) => {
  const productId = req.params.id;
  const quantity = parseInt(req.body.quantity);

  db.query(
    "SELECT * FROM products WHERE id = ?",
    [productId],
    (err, results) => {
      if (err) throw err;

      const product = results[0];
      if (product) {
        req.session.cart = req.session.cart || [];
        const existingProductIndex = req.session.cart.findIndex(
          (item) => item.id === product.id
        );

        if (existingProductIndex > -1) {
          // If the product is already in the cart, update the quantity
          req.session.cart[existingProductIndex].quantity += quantity;
        } else {
          // If the product is not in the cart, add it
          req.session.cart.push({ ...product, quantity });
        }
        res.redirect("/");
      }
    }
  );
});

// View Cart
app.get("/cart", (req, res) => {
  const cart = req.session.cart || [];
  const cartCount = req.session.cart ? req.session.cart.length : 0;
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  res.render("cart", { cart, totalPrice, cartCount });
});

// Remove from Cart
app.get("/remove-from-cart/:id", (req, res) => {
  const productId = parseInt(req.params.id);
  req.session.cart = req.session.cart.filter((item) => item.id !== productId);
  res.redirect("/cart");
});

// Payment Page
app.get("/payment", (req, res) => {
  //cart functionality
  const cart = req.session.cart || [];
  const cartCount = req.session.cart ? req.session.cart.length : 0;
  const totalPrice = req.session.cart
    ? cart.reduce((total, item) => total + item.price * item.quantity, 0)
    : 0.0;
  res.render("payment", { cart, totalPrice, cartCount });
});

//============================paypal processing===================================================//


// PayPal payment route
app.get('/pay', async (req, res) => {
  // const total = req.body.total;

  const cart = req.session.cart || [];
  const cartCount = req.session.cart ? req.session.cart.length : 0;
  const totalPrice = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  try {
      // Step 1: Create PayPal payment
      const paymentResponse = await axios.post('https://api.sandbox.paypal.com/v1/payments/payment', {
          intent: 'sale',
          redirect_urls: {
              return_url: `http://localhost:3000/success`,
              cancel_url: `http://localhost:3000/cancel`
          },
          payer: {
              payment_method: 'paypal'
          },
          transactions: [{
              amount: {
                  total: totalPrice,
                  currency: 'USD'
              },
              description: 'Shopping Cart Total'
          }]
      }, {
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAccessToken()}` // Get access token
          }
      });

      // Redirect to PayPal approval URL
      const approvalUrl = paymentResponse.data.links.find(link => link.rel === 'approval_url').href;
      res.redirect(approvalUrl);
  } catch (error) {
      console.error('PayPal payment error:', error);
      res.status(500).send('Error processing payment');
  }
});

// Capture payment route
app.get('/success', async (req, res) => {
  const paymentId = req.query.paymentId;
  const payerId = req.query.PayerID;

  try {
      // Step 2: Capture the payment
      const captureResponse = await axios.post(`https://api.sandbox.paypal.com/v1/payments/payment/${paymentId}/execute`, {
          payer_id: payerId
      }, {
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getAccessToken()}` // Get access token
          }
      });

      // Handle successful payment
      res.send(`Payment successful! Amount: $${captureResponse.data.transactions[0].amount.total}`);
  } catch (error) {
      console.error('Payment capture error:', error);
      res.status(500).send('Error capturing payment');
  }
});

// Cancel route
app.get('/cancel', (req, res) => {
  res.send('Payment was canceled.');
});

// Function to get PayPal access token
async function getAccessToken() {
  const response = await axios.post('https://api.sandbox.paypal.com/v1/oauth2/token', null, {
      auth: {
          username: process.env.CLIENT_ID,
          password: process.env.CLIENT_SECRET
      },
      params: {
          grant_type: 'client_credentials'
      },
      headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US'
      }
  });
  return response.data.access_token;
}




// end of paypal processing
app.listen(PORT, () => console.log("app is running at port 3000"));
// console.log("app is running at port 3000");
module.exports = app;
