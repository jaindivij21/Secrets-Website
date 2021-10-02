//* MAIN app.js

//* Requirements
/* #region */

require("dotenv").config(); // environment variable to store the secrets
const express = require("express");
const https = require("https");
const mongoose = require("mongoose");
const ejs = require("ejs");
const _ = require("lodash");
const session = require("express-session"); // Session and Cookies
const passport = require("passport"); // Authentication Tool
const passportLocalMongoose = require("passport-local-mongoose");

/* #endregion */

//* App Constant
/* #region */

// get APP CONST, setup static files, initialize ejs and body parser
const app = express();
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// Initialize the session for the app
//? https://www.npmjs.com/package/express-session
app.use(
    session({
        secret: "Our little secret",
        resave: false,
        saveUninitialized: false,
    })
);
//? http://www.passportjs.org/docs/configure/
app.use(passport.initialize());
app.use(passport.session());

/* #endregion */

//* MAIN

//* Setup Database and Encryption
/* #region */

const dbName = "userDB";
// connect to the mongo service
mongoose.connect(`mongodb://${process.env.DB_HOST}:27017/${dbName}`);
// make the schema and model to store the usernames and passwords
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

//? https://www.npmjs.com/package/passport-local-mongoose
userSchema.plugin(passportLocalMongoose);
// make the model
const User = mongoose.model("User", userSchema);

// Simplified PASSPORT by passport-local-mongoose : serialize/deserialize the user (cookies)
//! Good Video Resource > https://youtu.be/W5Tb1MIeg-I?t=1006
passport.use(User.createStrategy()); //? Can create your own strategy as well : https://youtu.be/W5Tb1MIeg-I?t=1006
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* #endregion */

//* Pages
/* #region */

// Home Route
app.route("/").get((req, res) => {
    res.render("home");
});

// Register Route
app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        //?  Register a new user instance with a given password : https://www.npmjs.com/package/passport-local-mongoose
        User.register(
            { username: req.body.username },
            req.body.password,
            (err, user) => {
                if (err) {
                    // if error
                    console.log(err);
                    res.redirect("/register");
                } else {
                    // no error : then authenticate the user instance
                    passport.authenticate("local")(req, res, () => {
                        res.redirect("/secrets");
                    });
                }
            }
        );
    });

// Login Route
app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        // get user information
        const user = new User({
            username: req.body.username,
            password: req.body.password,
        });
        //? use login method by passport: http://www.passportjs.org/docs/login/
        req.login(user, (err) => {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                });
            }
        });
    });

// Logout Route
app.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
});

// Secrets main page
app.route("/secrets").get((req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

// Listen to browser port
app.listen(process.env.PORT || 3000, () => {
    console.log("Server Started!");
});

/* #endregion */
