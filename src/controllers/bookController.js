const bookModel = require("../models/bookModel");
const userModel = require("../models/userModel");
const reviewModel = require("../models/reviewModel");
const ObjectId = require("mongoose").Types.ObjectId;
const isbn = require("isbn-validate"); // to validate 10 digit isbn
const { checksum } = require("isbn-validation"); // to validate 13 digit isbn

let createBookDocument = async (req, res) => {
  try {
    let bookDeatils = req.body;
    let { title, excerpt, userId, ISBN, category, subcategory, releasedAt } =bookDeatils;
    let obj = {};

    if (Object.keys(bookDeatils).length == 0) {
      return res
        .status(400)
        .send({ status: false, msg: "Please provide necessary Book Details" });
    }

    if (!title) {
      return res.status(400).send({ status: false, msg: "Title is required" });
    }
    obj.title = title
    .trim()
    .split(" ")
    .filter((word) => word)
    .join(" ");

    if (!excerpt) {
      return res
        .status(400)
        .send({ status: false, msg: "Excerpt is required" });
    }
    obj.excerpt = excerpt
    .trim()
    .split(" ")
    .filter((word) => word)
    .join(" ");
    if (!userId) {
      return res
        .status(400)
        .send({ status: false, msg: "User Id is required" });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).send({ status: false, msg: "User Id is Invalid" });
    }
    obj.userId = userId;
    if (!category) {
      return res
        .status(400)
        .send({ status: false, msg: "Category is required" });
    }
    obj.category = category
    .trim()
    .split(" ")
    .filter((word) => word)
    .join(" ");

    if (!ISBN) {
      return res.status(400).send({ status: false, msg: "ISBN is required" });
    }
    // if(!isbn.Validate(ISBN) || !checksum(ISBN)){
    //     return res.status(400).send({status: false, message: "Please enter valid ISBN"})
    // }
    obj.ISBN = ISBN.trim()
    .split(" ")
    .filter((word) => word)
    .join("");
    if (!subcategory) {
      return res
        .status(400)
        .send({ status: false, msg: "Subcategory is required" });
    }
    obj.subcategory = subcategory;
    if (!releasedAt) {
      return res
        .status(400)
        .send({ status: false, msg: "releasedAt is required" });
    }
    obj.releasedAt = releasedAt;
    const titleExist = await bookModel.findOne({title: obj.title});

    if (titleExist) {
      return res
        .status(409)
        .send({ status: false, msg: "Title already exists" });
    }

    const isIsbnExist = await bookModel.findOne({ ISBN: obj.ISBN });
    if (isIsbnExist) {
      return res.status(409).send({ status: false, msg: "ISBN already exists" });
    }

    let validId = await userModel.findById(userId);
    if (!validId) {
      return res
        .status(400)
        .send({ status: false, msg: "userId is not Valid Id" });
    }
    let savedData = await bookModel.create(obj);
    return res.status(201).send({ status: true, message: 'Success', data: savedData });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

/*############################################ GET BOOK ##########################################################*/

const getBook = async (req, res) => {
  try {
    const detailFromQuery = req.query;
    //console.log(detailFromQuery)
    //console.log(typeof detailFromQuery.category)
     if (Object.keys(detailFromQuery).length === 0) {
       res.status(400).send({ status: false, msg: "Please Enter filter" });
       return;
     }
    //let loggedIn = req.loggedIn
      
     
     
    let filter = {
      isDeleted: false,
    };
    if (detailFromQuery.userId) {
        if(detailFromQuery.userId.trim().length === 0){
            res.status(400).send({ status: false, msg: "Please Enter user id" });
          return;
        }
      filter._id = detailFromQuery.userId.trim();
    }
    if (detailFromQuery.category) {
        if(detailFromQuery.category.trim().length === 0){
            res.status(400).send({ status: false, msg: "Please Enter category" });
          return;
        }
      filter.category = detailFromQuery.category.trim();
    }
    if (detailFromQuery.subcategory) {
        if(detailFromQuery.subcategory.trim().length === 0){
            res.status(400).send({ status: false, msg: "Please Enter subcategory" });
          return;
        }
      let subCategoryArr = detailFromQuery.subcategory
        .split(",")
        .map((el) => el.trim());
      filter.subcategory = { $in: subCategoryArr };
    }
    const books = await bookModel
      .find(filter)
      .sort({ title: 1 })
      .select({ ISBN: 0, subcategory: 0, deletedAt: 0, isDeleted: 0 });
    if (books.length === 0) {
      res.status(404).send({ status: false, msg: "No book found" });
      return;
    }
    return res
      .status(200)
      .send({ status: true, message: "Success", data: books });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
const getBookById = async (req, res) => {
  const bookId = req.params.bookId;
  if (bookId.length === 0) {
    // empty string is falsy
    return res.status(400).send({ status: false, msg: "Please give bookId" });
  }
  if (bookId.trim().length !== 24) {
    return res
      .status(400)
      .send({ status: false, msg: "Please give valid bookId" });
  }
  const filteredBookId = bookId.trim();
  const book = await bookModel.findOne({
    _id: filteredBookId,
    isDeleted: false,
  });
  if (!book) {
    return res.status(404).send({ status: false, message: "Book not found" });
  }
  // console.log(book)
  let reviews = await reviewModel.find({bookId : bookId, isDeleted : false}).select({isDeleted: 0, createdAt: 0, updatedAt: 0, __v: 0})
  if (book.reviews === 0) {
    book._doc.reviewsData = [];
  }
  book._doc.reviewsData = reviews
  return res.status(200).send({ status: true, message: "Success", data: book });
};

/*############################################ UPDATE BOOKS BY BOOK-ID ##########################################################*/

const updateBook = async (req, res) => {
  try {
    let bookId = req.params.bookId;

    if (!ObjectId.isValid(bookId)) {
      return res.status(400).send({ status: false, msg: "Book Id is Invalid" });
    }

    let bookDetailToUpdate = req.body;
    if(Object.keys(bookDetailToUpdate).length===0){
      return res.status(400).send({status: false, message: 'Please provide details to update'})
    }
    let { title, excerpt, releasedAt, ISBN } = bookDetailToUpdate;

    let bookObject = {};
    if(Object.keys(bookDetailToUpdate).indexOf('title') !== -1){
  if (title.trim().length===0) {
    return res.status(400).send({status: false, message: 'Please Enter title'})
  }
  let trimmedTitle = title
        .trim()
        .split(" ")
        .filter((word) => word)
        .join(" ");
        const isTitleExist = await bookModel.findOne({ title: trimmedTitle });
        if (isTitleExist) {
          return res
            .status(409)
            .send({ status: false, msg: "Title already exists" });
        }
        bookObject.title = trimmedTitle;
      }
        if(Object.keys(bookDetailToUpdate).indexOf('excerpt') !== -1){
      if (excerpt.length==0) {
        return res.status(400).send({status: false, message: 'Please Enter excerpt'})
      }
      bookObject.excerpt = excerpt
      .trim()
      .split(" ")
      .filter((word) => word)
      .join(" ");
    }
      if(Object.keys(bookDetailToUpdate).indexOf("ISBN") !== -1){
        if (ISBN.length==0) {
          return res.status(400).send({status: false, message: 'Please Enter ISBN'})
            }
            let trimmedISBN = ISBN.trim()
            .split("-")
            .filter((word) => word)
            .join("");
            if(ISBN.length == 10){
              if (!isbn.Validate(trimmedISBN)){
                return res
                  .status(400)
                  .send({ status: false, msg: "ISBN is Invalid" });
              }
            }
            if(ISBN.length == 13){
              if (!checksum(trimmedISBN)){
                return res
                  .status(400)
                  .send({ status: false, msg: "ISBN is Invalid" });
              }
            const isIsbnExist = await bookModel.findOne({ ISBN: trimmedISBN });
        
            if (isIsbnExist) {
              return res.status(409).send({ status: false, msg: "ISBN already exists" });
            }
            bookObject.ISBN = trimmedISBN;
        }
      }
      
         
    
        
    
    
    // if (!isbn.Validate(ISBN)) {
    //   if (!checksum(bookObject.ISBN)) {
    //     return res
    //       .status(400)
    //       .send({ status: false, msg: "ISBN is Invalid" });
    //   }
    // }
    if(Object.keys(bookDetailToUpdate).indexOf('releasedAt') !== -1)
      if (releasedAt.length==0) {
        return res.status(400).send({status: false, message: 'Please Enter releasedAt date'})
      }
      bookObject.releasedAt = releasedAt;
    
    
  let book = await bookModel.findOne({_id: bookId, isDeleted: false});
    if (!book) {
      return res
        .status(404)
        .send({
          status: false,
          message: 'Book not found',
        });
    }
    // if (book.isDeleted == true) {
    //   return res
    //     .status(404)
    //     .send({ status: false, msg: "Document already deleted" });
    // }
  let updatedbookDetail = await bookModel.findOneAndUpdate(
      { _id: book._id },
      bookObject,
      { returnDocument: "after" }
    );

    return res
      .status(200)
      .send({ status: true, message: "Success", data: updatedbookDetail });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

/*############################################ DELETE BY BOOK-ID ##########################################################*/

const deletedbook = async (req, res) => {
  try {
    let bookId = req.params.bookId;

    if (!bookId) {
      return res
        .status(400)
        .send({ status: false, message: "book id is empty" });
    }
    if (!ObjectId.isValid(bookId)) {
      return res
        .status(400)
        .send({ status: false, message: "bookid format invalid" });
    }

    let findId = await bookModel.findOne({ _id: bookId, isDeleted: false });

    if (!findId) {
      return res
        .status(400)
        .send({ status: false, message: "The requested Book is unavailable" });
    }

    let deletedData = await bookModel.updateOne(
      { _id: bookId },
      { $set: { isDeleted: true, deletedAt: Date.now() } }
    );
    return res.status(200).send({ status: true, message: "Book is deleted" });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

module.exports.createBookDocument = createBookDocument;
module.exports.getBook = getBook;
module.exports.getBookById = getBookById;
module.exports.updateBook = updateBook;
module.exports.deletedbook = deletedbook;

