const express = require("express");
const router = express.Router();
const { userRegistration, userLogin } = require('../controllers/userController')
const { createBookDocument, getBook, getBookById, updateBook, deletedbook } = require('../controllers/bookController')
const { authentication, authorisation } = require('../middlewares/auth');
const { createReviewForBook, updateReview, deleteReview } = require("../controllers/reviewController");

//These Are the APIs:-
//User API
router.post("/register", userRegistration)
router.post("/login", userLogin)

//Book APIs
router.post("/books", authentication, authorisation, createBookDocument)
router.get("/books",authentication, getBook)
router.get("/books/:bookId", authentication, getBookById)
router.put("/books/:bookId", authentication, authorisation, updateBook)
router.delete("/books/:bookId", authentication, authorisation, deletedbook)

//APIs of Review
router.post("/books/:bookId/review", createReviewForBook)
router.put("/books/:bookId/review/:reviewId", updateReview)
router.delete("/books/:bookId/review/:reviewId", deleteReview)
router.all("/*", function (req, res){
    res.status(404).send({status :false, message: "URL not found."})
})


module.exports = router;