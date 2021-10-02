const mongoose = require("mongoose");

// make the schema and model to store the usernames and passwords
const userSchema = new mongoose.Schema({
    username: String,
    googleId: String,
    secret: String,
});

module.exports = userSchema;
