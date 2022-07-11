const reviewModel = require("../models/reviewModel");
const mongoose = require("mongoose");
const bookModel = require("../models/bookModel");
const ObjectId = mongoose.Types.ObjectId;

const validName = /^[A-Za-z ]+$/;
const isValid = function (data) {
  if (typeof data !== "undefined" || data !== null) return true;
};
const createReviewForBook = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const reviewDetail = req.body;
    let reviewObj = {}; 
    let { reviewedBy, rating, review } = reviewDetail;
    if (!ObjectId.isValid(bookId)) {
      return res
        .status(400)
        .send({ status: false, message: "Please provide valid book id" });
    }
    if (Object.keys(reviewDetail).length === 0) {
      return res
        .status(400)
        .send({
          status: false,
          message: "Please provide required review detail!!!",
        });
    }
    if (!reviewedBy || !isValid(reviewedBy)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter reviewer name" });
    }
    if (!validName.test(reviewedBy)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid reviewer name" });
    }
    reviewObj.reviewedBy = reviewedBy.trim().split(' ').filter((word)=>word).join(' ');

    if (!rating || !isValid(rating)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter rating" });
    }
    if (typeof rating !== "number") {
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid rating" });
    }
    reviewObj.rating = rating.trim().split(' ').filter((word)=>word).join(' ');

    if (!review || !isValid(review)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter review" });
    }
    reviewObj.review = review.trim().split(' ').filter((word)=>word).join(' ');

    const IsBookIdExists = await bookModel.findOne({
      _id: bookId,
      isDeleted: false,
    });
    if (!IsBookIdExists) {
      return res
        .status(400)
        .send({ status: false, message: "Given Book id does not exist" });
    }

    reviewObj.bookId = bookId;
    const newReview = await reviewModel.create(reviewObj);
    if (newReview.review) {
      const updateBookDetails = await bookModel.findOneAndUpdate(
        { _id: bookId },
        { $inc: { reviews: 1 } },
        { new: true }
      );
      return res
        .status(200)
        .send({ status: true, message: "Success", data: updateBookDetails });
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

module.exports.createReviewForBook = createReviewForBook;
