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
var findOrCreate = require("mongoose-findorcreate");
const GoogleStrategy = require("passport-google-oauth20").Strategy; // Google OAuth

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

//* Setup Database
/* #region */

const dbName = "userDB";
// connect to the mongo service
mongoose.connect(`mongodb://${process.env.DB_HOST}:27017/${dbName}`);

// get the schema
const userSchema = require("./models/users");

// Plugins
userSchema.plugin(findOrCreate);
//? https://www.npmjs.com/package/passport-local-mongoose
userSchema.plugin(passportLocalMongoose);
// make the model
const User = mongoose.model("User", userSchema);

/* #endregion */

//* Cookies and Encryption
/* #region */

// Simplified PASSPORT by passport-local-mongoose : serialize/deserialize the user (cookies)
//! Good Video Resource > https://youtu.be/W5Tb1MIeg-I?t=1006
passport.use(User.createStrategy()); //? Can create your own strategy as well : https://youtu.be/W5Tb1MIeg-I?t=1006

// sessions
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

/* #endregion */

//* Google OAuth Strategy and Initialization
/* #region */

//? http://www.passportjs.org/packages/passport-google-oauth20/
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/secrets",
        },
        (accessToken, refreshToken, profile, cb) => {
            // whatever was mentioned in scope is returned by profile
            console.log(profile);
            User.findOrCreate(
                // find or create intakes 2 arguemnts, username and googleId to find a user in the database
                { username: profile.emails[0].value, googleId: profile.id },
                function (err, user) {
                    return cb(err, user);
                }
            );
        }
    )
);

/* #endregion */

//* Pages
/* #region */

// Home Route
app.route("/").get((req, res) => {
    res.render("home");
});

// Google OAuth Routes
app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] }) // scope tells what we want after authentication
);
app.get(
    // authenticate locally and start a session
    "/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect("/secrets");
    }
);

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
    User.find({ secret: { $ne: null } }, (err, foundUsers) => {
        if (err) console.log(err);
        else {
            if (foundUsers) {
                res.render("secrets", { usersWithSecrets: foundUsers });
            }
        }
    });
});

// Submit Route
app.route("/submit")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render("submit");
        } else {
            res.redirect("/login");
        }
    })
    .post((req, res) => {
        const submittedSecret = req.body.secret; // store the user secret
        // get the current user
        User.findById(req.user.id, (err, foundUser) => {
            if (err) console.log(err);
            else {
                if (foundUser) {
                    foundUser.secret = submittedSecret;
                    foundUser.save(() => {
                        res.redirect("/secrets");
                    });
                }
            }
        });
    });

// Listen to browser port
app.listen(process.env.PORT || 3000, () => {
    console.log("Server Started!");
});

/* #endregion */
