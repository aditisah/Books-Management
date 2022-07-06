const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    title: {
        type: String,
        enum: ["Mr", "Mrs", "Miss"],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,  //Email validation
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
        maxLength: 15
    },
    address: {
        street: String,
        city:  String,
        pincode: String
    }
},{timestamps: true});


module.exports = mongoose.model("User", userSchema)