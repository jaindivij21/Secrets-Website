//* MAIN app.js

//* Requirements
/* #region */
const express = require("express");
const https = require("https");
const mongoose = require("mongoose");
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

//* Pages
/* #region */

// Listen to browser port
app.listen(process.env.PORT || 3000, () => {
    console.log("Server Started!");
});

/* #endregion */
