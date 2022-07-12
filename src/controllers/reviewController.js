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
      return res.status(400).send({
        status: false,
        message: "Please provide required review detail!!!",
      });
    }
    if (!reviewedBy) {
      reviewedBy = "Guest";
    }
    if (!isValid(reviewedBy)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter reviewer name" });
    }
    if (!validName.test(reviewedBy)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid reviewer name" });
    }
    reviewObj.reviewedBy = reviewedBy
      .trim()
      .split(" ")
      .filter((word) => word)
      .join(" ");

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
    if(rating<0 || rating>5){
      return res
      .status(400)
      .send({ status: false, message: "Please enter rating between 0 to 5" });
    }
    reviewObj.rating = rating;

    if (!review || !isValid(review)) {
      return res
        .status(400)
        .send({ status: false, message: "Please enter review" });
    }
    reviewObj.review = review
      .trim()
      .split(" ")
      .filter((word) => word)
      .join(" ");

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
      let reviewDetail = {
        bookId: newReview.bookId,
        reviewedBy: newReview.reviewedBy,
        reviewedAt: newReview.reviewedAt,
        rating: newReview.rating,
        review: newReview.review
      }
      updateBookDetails._doc.reviewsData = reviewDetail;
      return res
        .status(200)
        .send({ status: true, message: "Success", data: updateBookDetails });
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

const updateReview = async (req, res) => {
  try {
    let { review, rating, reviewedBy } = req.body;
    let { bookId, reviewId } = req.params;

    if (!ObjectId.isValid(bookId)) {
      return res
        .status(400)
        .send({ status: false, message: "Enter Valid Book Id." });
    }

    if (!ObjectId.isValid(reviewId)) {
      return res
        .status(400)
        .send({ status: false, message: "Enter Valid Review Id." });
    }

    if (Object.keys(req.body).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "Requst Body Cannot be Empty" });
    }

    let book = await bookModel.findOne({ _id: bookId, isDeleted: false });
    if (!book) {
      return res
        .status(404)
        .send({ status: true, message: "Book Does Not Found !!!" });
    }

    let reviewExist = await reviewModel.findOne({
      _id: reviewId,
      isDeleted: false,
    });

    if (!reviewExist) {
      return res
        .status(404)
        .send({ status: true, message: "Review Does Not Found !!!" });
    }

    let updatedReview = {};
    if (review) updatedReview.review = review;
    if (rating) updatedReview.rating = rating;
    if (reviewedBy) updatedReview.reviewedBy = reviewedBy;

    let result = await reviewModel.findByIdAndUpdate(
      { _id: reviewId },
      updatedReview,
      { new: true }
    );

    res.status(200).send({ status: false, message: "Success", data: result });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

/*############################################ DELETE REVIEWS BY BOOK-ID AND REVIEW ID ##########################################################*/

const deleteReview = async (req, res) => {
  try {
    let bookId = req.params.bookId;
    let reviewId = req.params.reviewId;

    if (!ObjectId.isValid(bookId))
      return res
        .status(400)
        .send({ status: false, message: "Enter Valid Book Id." });
    if (!ObjectId.isValid(reviewId))
      return res
        .status(400)
        .send({ status: false, message: "Enter Valid Review Id." });

    let book = await bookModel.findOne({ _id: bookId, isDeleted: false });

    if (!book)
      return res
        .status(404)
        .send({ status: true, message: "Book Does Not Found !!!" });
    let reviews = book.reviews;
    console.log(reviews);
    book = book._id.toString();

    let review = await reviewModel.findOneAndUpdate(
      { _id: reviewId, bookId: bookId, isDeleted: false },
      { $set: { isDeleted: true } }
    );

    if (!review)
      return res
        .status(404)
        .send({ status: true, message: "Review Does Not Found !!!" });

    await bookModel.findOneAndUpdate({ _id: bookId }, { reviews: reviews - 1 });
    res.status(200).send({ status: true, message: "Review Deleted !!!" });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

module.exports.createReviewForBook = createReviewForBook;
module.exports.updateReview = updateReview;
module.exports.deleteReview = deleteReview;
