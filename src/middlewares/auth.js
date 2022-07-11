const jwt = require("jsonwebtoken");
const bookModel = require("../models/bookModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
let decodedToken;

const authentication = async (req, res, next) => {
  try {
    let token = req.headers["x-api-key" || "X-Api-Key"];
    if (!token) {
      return res.status(401).send({ status: false, msg: "No Token Found !!!" });
    }

    decodedToken = jwt.verify(token, "Room 1");

    if (!decodedToken) {
      return res
        .status(401)
        .send({ status: false, message: "Token is invalid !!!" });
    }
    next();
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

const authorisation = async (req, res, next) => {
  try {
    let token = req.headers["x-api-key" || "X-Api-Key"];
    decodedToken = jwt.verify(token, "Room 1");
    let userId = req.body.userId;
    let bookId = req.params.bookId;
    let userIdFromBook;
    
    if (bookId) {
      if (!ObjectId.isValid(bookId)) {
        return res
          .status(400)
          .send({ status: false, message: "Please provide valid book id" });
      }
      let user = await bookModel.findOne({ _id: bookId, isDeleted: false });
      console.log(user);
      if (!user) {
        return res
          .status(404)
          .send({ status: false, message: "No Book found" });
      }
      userIdFromBook = user.userId.toString();
    } else {
      if(!userId || userId === 'undefined' || userId.trim().length === 0){
        return res.status(400).send({status: false, message: 'Please enter userId'})
      }
      userIdFromBook = userId;
    }
    if (decodedToken.userId !== userIdFromBook) {
      return res.status(403).send({ status: false, msg: "You have no permission to create ,update or delete other user's book!!!" });
    }
    next();
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports.authentication = authentication;
module.exports.authorisation = authorisation;
