var express = require("express");
var app = express();
var bcrypt = require("bcrypt");
var flash = require("connect-flash");
var session = require("express-session");
var file = require("express-fileupload");
var conn = require("./dbconfig");
var db = require("./dbconfig2");
const nodemailer = require("nodemailer");
const fileUpload = require("express-fileupload");
const MYSQLStore = require("express-mysql-session")(session);



app.set("view engine", "ejs");

// =========================================== uses ========================================================//
app.use(
  session({
    secret: "yoursecret",
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
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  next();
});

// ============================= Routes ============================================================//
app.get("/login", (req, res) => res.render("login"));
app.get("/index", (req, res) => res.render("index"));
// app.get("/", (req, res) => res.render("index"));
app.get("/register", (req, res) => res.render("register"));
app.get("/contact", (req, res) => res.render("contact"));
app.get("/products", (req, res) => res.render("products"));
app.get("/admin", (req, res) => {
  conn.query("SELECT * FROM cart", (err, results)=>{
    if(err) throw err;
    res.render("adminviews/", {results: results});
  })
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
  conn.query("SELECT * FROM users ORDER BY RAND() LIMIT 10", (error, results, fields) => {
    if (error) throw error;
    if (req.session.loggedin) {
      res.render("adminviews/users", { results: results });
    } else {
      req.flash("error", "This is an error message!");
      res.redirect("/login");
    }
  });
});

//======================================= logging in to the system ======================================//
// app.post("/auth", async (req, res, next) => {
  // var {username, password} = req.body;

  // var sql = `SELECT * FROM users WHERE name = "${username}"`;
//   await db.query(sql, async (err, result) => {
//     if (err) throw err;
//     if (result.length == 0) {
//       console.log("user does not exist");
//     } else {
//       var hashedpassword = result[0].password;

//       if (await bcrypt.compare(password, hashedpassword)) {
//         req.session.loggedin = true;
//         req.session.username = username;
//         res.redirect("/admin");
//       } else {
//         console.log("password incorrect!");
//         res.send("password incorrect!");
//       }
//     }
//   });
// });


  // Route: Handle login form submission
  app.post('/auth', (req, res) => {
    const { username, password } = req.body;
    
    // Check if the username exists
    var sql = 'SELECT * FROM users WHERE name = ?';
    conn.query(sql, [username], async (err, results) => {
      if (err) throw err;
  
      if (results.length > 0) {
        const user = results[0];
  
        // Compare the hashed password
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          // Set user session and redirect to the dashboard
          req.session.loggedin = true;
          req.session.user = user;
          res.redirect('/admin');
        } else {
          res.send('Invalid credentials!');
        }
      } else {
        res.send('User not found!');
      }
    });
  });



// ================================ admin view all products=============================//
app.get("/admin/all_products", (req, res) => {
  conn.query("SELECT * FROM products", (error, results) => {
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
      res.redirect("/admin/users");
    }
  ); 
});

// ================================ insert products ========================= //
app.post("/admin/insertproduct", (req, res) => {
  const { product_name, description, keywords, category, brand } = req.body;
  let image;
  let uploadpath;
  image = req.files.image;
  uploadpath = __dirname + "/public/uploads/" + image.name;

  image.mv(uploadpath, (err) => {
    if (err) throw err;
  });

  conn.query(
    "INSERT INTO products(product_name, description, keywords, category, brand, image) VALUES(?, ?, ?, ?, ?, ?)",
    [product_name, description, keywords, category, brand, image.name],
    (error, results, fields) => {
      if (error) throw error;
      res.redirect("/admin/insertproduct");
    }
  );
});

// ==================================view products=======================//
app.get("/view_products", (req, res) => {
  conn.query("SELECT * FROM products", (err, results, fields) => {
    if (err) throw err;
    res.render("view_products", {
      results: results,
      menu: req.session.username,
    });
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
app.post("/cart/:id", (req, res)=>{
  const pid = req.params.id;
  const name = req.session.username;
  const Quantity = req.body.Quantity;
  const price = req.body.price ;
  let sql = "SELECT * FROM users WHERE name = ?";
  conn.query(sql, [name], (err,result)=>{
if(err) throw err;
conn.query("INSERT INTO cart(user_id, product_id, Quantity, price) VALUES(?, ?,?, ?)", [result[0].id, pid, Quantity, price], (err, results)=>{
  if(err) throw err;
  res.redirect('/');
})
  })


})

//========================== home page with pagination============================//
app.get("/", (req, res) => {
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
      let iterator = (page - 5) < 1 ? 1 : (page - 5);
      let endingLink =
        (iterator + 9) <= numOfPages ? (iterator + 9) : page + (numOfPages - page);
      // if (endingLink < (page + 4)) {
      //   iterator -= (page + 4 - numOfPages);
      // }
      res.render("index", {
        data: results,
        page,
        numOfPages,
        iterator,
        endingLink,
      });
    });
  });
});

app.listen(3000);
console.log("app is running at prot 3000");
module.exports = app;