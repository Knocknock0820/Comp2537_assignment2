require("./utils.js");
require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const bcrypt = require("bcrypt");
const saltRounds = 12;

const app = express();
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

const Joi = require("joi");
// const mongoSanitizer = require('mongo-sanitizer').default;
//import mongoSanitizer from 'mongo-sanitizer';
const mongoSanitize = require("express-mongo-sanitize");

const PORT = process.env.PORT || 3000;
const expireTime = 60 * 60 * 1000; //expires after 1 hour  (minutes * seconds * millis)

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_user_database = process.env.MONGODB_USER_DATABASE;
const mongodb_session_database = process.env.MONGODB_SESSION_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

const { database } = include("databaseConnection");
const userCollection = database.db(mongodb_user_database).collection("users");

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// app.use(mongoSanitizer({ replaceWith: "_" }));

//Hack for express 5.x not setting req.query as writable
app.use((req, _res, next) => {
  Object.defineProperty(req, "query", {
    ...Object.getOwnPropertyDescriptor(req, "query"),
    value: req.query,
    writable: true,
  });

  next();
});

app.use(mongoSanitize({ replaceWith: "%" }));

var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_session_database}`,
  crypto: {
    secret: mongodb_session_secret,
  },
});

app.use(
  session({
    secret: node_session_secret,
    store: mongoStore, //default is memory store
    saveUninitialized: false,
    resave: true,
  }),
);

const navLinks = [
  { name: "Home", url: "/" },
  { name: "Cats", url: "/cats" },
  { name: "Login", url: "/login" },
  { name: "404", url: "/dne" },
];

app.use((req, res, next) => {
  const pathFolders = req.path.split("/").slice(1);
  const folder = "/" + pathFolders[0];
  app.locals.folder = folder;
  app.locals.navLinks = navLinks;
  next();
});
function isValidSession(req) {
  if (req.session.authenticated) {
    return true;
  }
  return false;
}

function sessionValidation(req, res, next) {
  if (isValidSession(req)) {
    next();
  } else {
    res.redirect("/login");
  }
}

function isAdmin(req) {
  if (req.session.user_type == "admin") {
    return true;
  }
  return false;
}

function adminAuthorization(req, res, next) {
  if (!isAdmin(req)) {
    res.status(403);
    res.render("admin", { error: "Not authorized" });
    return;
  } else {
    next();
  }
}
// Routes
app.get("/", (req, res) => {
  res.render("index", {
    authenticated: req.session.authenticated,
    name: req.session.name,
  });
});

app.get("/cats", (req, res) => {
  res.render("cats");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/submitUser", async (req, res) => {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;

  const schema = Joi.object({
    name: Joi.string().alphanum().max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate(
    { name, email, password },
    { abortEarly: false },
  );

  if (validationResult.error != null) {
    // Map through the details array to get an array of all error messages
    const errorMessages = validationResult.error.details.map(
      (err) => err.message,
    );

    // Output: ["\"name\" is required", "\"email\" must be a valid email"]
    console.log(errorMessages);

    res.render("signup", {
      errors: errorMessages,
    });
    return;
  }

  var hashedPassword = await bcrypt.hash(password, saltRounds);

  await userCollection.insertOne({
    name: name,
    email: email,
    password: hashedPassword,
    user_type: "user",
  });
  console.log("Inserted user");

  req.session.authenticated = true;
  req.session.name = name;
  req.session.user_type = "user";
  req.session.cookie.maxAge = expireTime;

  res.redirect("/members");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/loggingin", async (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate({ email, password });

  if (validationResult.error != null) {
    console.log(validationResult.error);
    res.redirect("/login");
    return;
  }

  const result = await userCollection
    .find({ email: email })
    .project({ name: 1, email: 1, password: 1, user_type: 1, _id: 1 })
    .toArray();

  console.log(result);
  if (result.length != 1) {
    console.log("user not found");
    res.redirect("/loginSubmit");
    return;
  }

  if (await bcrypt.compare(password, result[0].password)) {
    console.log("correct password");
    req.session.authenticated = true;
    req.session.name = result[0].name;
    req.session.user_type = result[0].user_type;
    req.session.cookie.maxAge = expireTime;

    res.redirect("/members");
    return;
  } else {
    console.log("incorrect password");
    res.redirect("/loginSubmit");
    return;
  }
});

app.get("/loginSubmit", (req, res) => {
  res.render("loginSubmit");
});

app.get("/members", (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  } else {
    res.render("members", {
      name: req.session.name,
    });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/admin", sessionValidation, adminAuthorization, async (req, res) => {
  const result = await userCollection
    .find()
    .project({ name: 1, email: 1, user_type: 1, _id: 1 })
    .toArray();

  res.render("admin", { users: result });
});

app.post(
  "/admin/promote",
  sessionValidation,
  adminAuthorization,
  async (req, res) => {
    const email = req.body.email;

    await userCollection.updateOne(
      { email: email },
      {
        $set: {
          user_type: "admin",
        },
      },
    );

    res.redirect("/admin");
  },
);

app.post(
  "/admin/demote",
  sessionValidation,
  adminAuthorization,
  async (req, res) => {
    const email = req.body.email;

    await userCollection.updateOne(
      { email: email },
      {
        $set: {
          user_type: "user",
        },
      },
    );

    res.redirect("/admin");
  },
);

app.use(express.static(__dirname + "/public"));

app.use((req, res) => {
  res.status(404);
  res.render("404");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
