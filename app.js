//* MAIN app.js

//* Requirements
/* #region */
require("dotenv").config(); // environment variable to store the secrets
const express = require("express");
const https = require("https");
const mongoose = require("mongoose");
const ejs = require("ejs");
const encrypt = require("mongoose-encryption"); // encrypt database data
const _ = require("lodash");
/* #endregion */

//* App Constant
/* #region */
// get APP CONST, setup static files, initialize ejs and body parser
const app = express();
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
/* #endregion */

//* MAIN

//* Setup Database
/* #region */

const dbName = "userDB";
// connect to the mongo service
mongoose.connect(`mongodb://${process.env.DB_HOST}:27017/${dbName}`);
// make the schema and model to store the usernames and passwords
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});
// setup encryption
userSchema.plugin(encrypt, {
    secret: process.env.SECRET,
    encryptedFields: ["password"],
}); // specify the secret and the fields to be encrypted.
// make the model
const User = mongoose.model("User", userSchema);

/* #endregion */

//* Pages
/* #region */

// Home Route
app.route("/").get((req, res) => {
    res.render("home");
});

// Register Page
app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password,
        });
        newUser.save((err) => {
            if (!err) res.render("secrets");
            else console.log(err);
        });
    });

// Login Page
app.route("/login")
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        const mail = req.body.username;
        const pwd = req.body.password;
        User.findOne({ email: mail }, (err, foundUser) => {
            if (err) console.log(err);
            else {
                if (foundUser) {
                    if (foundUser.password === pwd) {
                        res.render("secrets");
                    }
                }
            }
        });
    });

// Listen to browser port
app.listen(process.env.PORT || 3000, () => {
    console.log("Server Started!");
});

/* #endregion */
