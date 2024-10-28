var express = require("express");
var app = express();
var bcrypt = require("bcrypt");

var session = require("express-session");
var file = require("express-fileupload");
var conn = require("./dbconfig");
var db = require("./dbconfig2");
var flash = require("connect-flash");
var nodemailer = require("nodemailer");
var fileUpload = require("express-fileupload");

//environment variables
const port = process.env.PORT || 3000;
const environment = process.env.environment;
const client_id = process.env.client_id;
const client_secret = process.env.client_secret;

app.set("view engine", "ejs");

// =========================================== uses ========================================================//
app.use(
  session({
    secret: client_secret,
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

// Middleware to expose flash messages to views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// ============================= Routes ============================================================//
app.get("/login", (req, res) => res.render("login"));
// app.get("/payment", (req, res) => res.render("payment"));
app.get("/index", (req, res) => res.render("index"));
app.get("/checkout", (req, res) => res.render("checkout"));
app.get("/register", (req, res) => res.render("register"));
app.get("/contact", (req, res) => {
  const searchTerm = req.query.search || "";
  res.render("contact", { searchTerm });
});

app.get("/products", (req, res) => {
  const searchTerm = req.query.search || "";
  res.render("products", { searchTerm });
});

// Route for displaying the the admin dashboard
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

app.get("/admin/insertbrand", (req, res) =>
  res.render("adminviews/insertbrand")
);
app.get("/admin/insertcategory", (req, res) =>
  res.render("adminviews/insertcategory")
);
app.get("/admin/insertproduct", (req, res) =>
  res.render("adminviews/insertproduct")
);

app.get("/testing", (req, res) => res.render("testing"));
// ===================================== viewing all users=============================================//
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

// Route: Handle login form submission
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

// ================================ admin view all products=============================//
app.get("/admin/all_products", (req, res) => {
  conn.query("SELECT * FROM products LIMIT 10", (error, results) => {
    if (error) throw error;
    res.render("adminviews/all_products", { results: results });
  });
});

// ================================ admin view all Categories=============================//
app.get("/admin/all_categories", (req, res) => {
  conn.query("SELECT * FROM categories", (error, results) => {
    if (error) throw error;
    res.render("adminviews/all_categories", { results: results });
  });
});

// ================================ admin view all Brands=============================//
app.get("/admin/all_brands", (req, res) => {
  conn.query("SELECT * FROM brands", (error, results) => {
    if (error) throw error;
    res.render("adminviews/all_brands", { results: results });
  });
});

// ========================================== inserting into users =====================================//
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

//==================================== getting user to edit===========================//
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

// ===================================== updating users table========================//
app.post("/updateuser/:id", (req, res) => {
  const upid = req.params.id;
  const name = req.body.username;
  const password = req.body.password;
  const surname = req.body.surname;
  const phone = req.body.phone;
  const email = req.body.email;

  conn.query(
    "UPDATE users SET name = ?, password = ?, surname = ?, phone = ?, email = ? WHERE id = ?",
    [name, password, surname, phone, email, upid],
    (error, results, fields) => {
      if (error) throw error;
      res.redirect("/admin/users");
    }
  );
});

// ======================================== deleting a user =================================//
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

// ================================ insert products ========================= //
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

// ==================================view products=======================//
app.get("/view_products", (req, res) => {
  const searchTerm = req.query.search || "";
  const query =
    "SELECT * FROM products WHERE description LIKE ? OR keywords LIKE ?";

  db.query(query, [`%${searchTerm}%`, `%${searchTerm}%`], (err, results) => {
    if (err) throw err;
    res.render("view_products", { results, searchTerm });
  });
});

// ================================ insert categories ========================= //
app.post("/admin/insertcategory", (req, res) => {
  const { category_name, category_description } = req.body;
  conn.query(
    "INSERT INTO categories(category_name, description) VALUES(?,?)",
    [category_name, category_description],
    (error, results, fields) => {
      if (error) throw error;
      req.flash("success_msg", "Category added Successfuly");
      res.redirect("/admin/insertcategory");
    }
  );
});

// ================================ insert brand ========================= //
app.post("/admin/insertbrand", (req, res) => {
  const { brand_name, brand_description } = req.body;
  let sql = "INSERT INTO brands(brand_name,	description) VALUES(?,?)";
  conn.query(sql, [brand_name, brand_description], (error, results, fields) => {
    if (error) throw error;
    req.flash("success_msg", "Brand added Successfuly");
    res.redirect("/admin/insertbrand");
  });
});
// ============================ logout =====================================//
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// ============================ sending mail using contact page==============================//
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

// ============================ adding items to cart=======================//
app.post("/cart/:id", (req, res) => {
  const pid = req.params.id;
  const name = req.session.username;
  const { id, product_name, image, price, quantity } = req.body;
  sql = "INSERT INTO cart(Product_id, product_name,image, price, quantity, user_name)  VALUES(?,?,?,?,?,?) "
  conn.query(sql, [id, product_name, image,price, quantity, name], (err, results,fields)=>{
    if(err) throw err;
    res.redirect("/",)
  })
 
});

//========================== home page with pagination============================//
app.get("/", (req, res) => {
  const searchTerm = req.query.search || "";
  const resultsPerPage = 3;
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
      });
    });
  });
});



// Add to Cart
app.post('/add-to-cart/:id', (req, res) => {
  const productId = req.params.id;
  const quantity = parseInt(req.body.quantity);

  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) throw err;

    const product = results[0];
    if (product) {
      req.session.cart = req.session.cart || [];
      const existingProductIndex = req.session.cart.findIndex(item => item.id === product.id);

      if (existingProductIndex > -1) {
        // If the product is already in the cart, update the quantity
        req.session.cart[existingProductIndex].quantity += quantity;
      } else {
        // If the product is not in the cart, add it
        req.session.cart.push({ ...product, quantity,});
       
      }
      res.redirect('/');
    }
  });
});

// View Cart
app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  res.render('cart', { cart, totalPrice, });
});


// Remove from Cart
app.get('/remove-from-cart/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  req.session.cart = req.session.cart.filter(item => item.id !== productId);
  res.redirect('/cart');
});

// Payment Page
app.get('/payment', (req, res) => {
  const cart = req.session.cart || [];
  const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  res.render('payment', { cart, totalPrice });
});

app.listen(3000);
console.log("app is running at prot 3000");
module.exports = app;
