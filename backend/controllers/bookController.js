const Book = require('../models/bookModel');
const fs = require('fs');

exports.getAllBooks = (req, res, next) => {
  try {
    Book.find()
      .then(
        (books) => {
          res.status(200).json(books);
        }
      ).catch(
        (error) => {
          res.status(500).json({ error });
        }
      );
  } catch (err) {
    res.status(500).json({ err })
  }
};

exports.createBook = (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    // Prevent ratings to be filled with multiple ratings
    if (bookObject.ratings.length > 1) {
      return res.status(400).json({ err });
    }
    console.log("bookObject",bookObject)
    const book = new Book({
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
      title: bookObject.title,
      author: bookObject.author,
      year: bookObject.year,
      genre: bookObject.genre,
      ratings: [{ userId: req.auth.userId, grade: bookObject.ratings[0].grade }],
      averageRating: bookObject.ratings[0].grade 
    });
    console.log("book",book)
    // Book saving 
    book.save()
      .then(() => {
        res.status(201).json({ message: 'Livre enregistré !' });
      })
      .catch(error => {
        // If theire is a problem, we have to delete what multer/sharp spawned
        fs.unlink(book.imageUrl.split("4000/")[1], (err) => {
          if (err) {
            console.log("Erreur lors de la suppression de l'ancienne image", err);
          } else {
            console.log("Suppression de l'ancienne image réussie");
          }
        });
        res.status(500).json({ error })
      });
  } catch (err) {
    res.status(500).json({ err })
  }
};

exports.getOneBook = (req, res, next) => {
  try {
    Book.findOne({ _id: req.params.id })
      .then(
        (book) => {
          res.status(200).json(book);
        })
      .catch(
        (error) => {
          res.status(404).json({ error });
        });
  } catch (err) {
    res.status(500).json({ err })
  }
};

exports.deleteOneBook = (req, res, next) => {
  try {
    Book.findOne({ _id: req.params.id })
      .then(book => {
        if (book.userId != req.auth.userId) {
          res.status(401).json({ message: 'Utilisateur non authentifié' });
        } else {
          const filename = book.imageUrl.split('/images/')[1];
          // Img delete handler
          fs.unlink(`images/${filename}`, (err) => {
            if (err) {
              console.log("Erreur lors de la suppression de l'ancienne image", err);
            } else {
              console.log("Suppression de l'ancienne image réussie");
              // Book delete handler
              Book.deleteOne({ _id: req.params.id })
                .then(() => { res.status(200).json({ message: 'Livre supprimé !' }) })
                .catch(error => res.status(500).json({ error }));
            }
          });
        }
      })
      .catch(error => {
        res.status(500).json({ error });
      });

  } catch (err) {
    res.status(500).json({ err })
  }
};

exports.updateOneBook = (req, res, next) => {

  // Delete previous image before update
  // Can be done sync or async
  function deleteImageFile(imageUrl) {
    const filePath = imageUrl.split("4000/")[1];
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Erreur lors de la suppression de l'image ${filePath} .`, err);
      } else {
        console.log("Suppression de l'ancienne image réussie.");
      }
    });
  };

  // try {

  let bookObject;
  // Only if a file is uploaded te body need to be parsed...
  if (req.file) {

    console.log("req.body.book",JSON.parse(req.body.book))
    // pas ratings!!!
    bookObject = {
      userId: JSON.parse(req.body.book).userId,
      title: JSON.parse(req.body.book).title,
      author: JSON.parse(req.body.book).author,
      year: JSON.parse(req.body.book).year,
      genre: JSON.parse(req.body.book).genre,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    };
  } else {
    console.log("req.body",req.body )
    bookObject = { 
      userId: req.body.userId ,
      title: req.body.title,
      author: req.body.author,
      year: req.body.year,
      genre:req.body.genre
    };
  }
  console.log(bookObject)
  // delete bookObject._userId;
  const newImg = bookObject.imageUrl

  // Nothing must be empty
  for (let key in bookObject) {
    if (!bookObject[key] || bookObject[key].toString().trim() === '') {
      if (req.file) {
        deleteImageFile(newImg);
      }
      return res.status(400).json({ message: `${bookObject[key]} manquant` });
    }
  }

  // Only number, and < current year
  const currentYear = new Date().getFullYear();
  const checkIfContainsOnlyNumbers = /^\d+$/;
  if (!checkIfContainsOnlyNumbers.test(bookObject.year) || bookObject.year > currentYear) {
    if (req.file) {
      deleteImageFile(newImg);
    }
    return res.status(400).json({ message: `${bookObject.year} ne doit contenir que des chiffres, et inferieur à l'année en cours` });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: 'Action non auhtorisé.' });
      } else {
        const oldImag = book.imageUrl
        Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
          .then(() => {
            if (req.file) {
              deleteImageFile(oldImag);
            };
            res.status(200).json({ message: 'Livre modifié.' });
          })
          .catch(error => {
            deleteImageFile(newImg);
            res.status(500).json({ error })
          });
      }
    })
    .catch((error) => {
      if (req.file) {
        deleteImageFile(newImg);
      }
      res.status(500).json({ error });
    });
};

exports.createRating = (req, res) => {

  try {
    Book.findOne({ _id: req.params.id })
      .then(book => {
        if (!book) {
          return res.status(404).json({ message: 'Reference introuvable...' });
        }
        const isAlreadyRated = book.ratings.find(rating => rating.userId === req.auth.userId);
        if (!isAlreadyRated) {
          book.ratings.push({
            userId: req.auth.userId,
            grade: req.body.rating
          });

          let newRating = 0;
          book.ratings.forEach(rating => {
            newRating += rating.grade;
          });
          book.averageRating = (newRating / book.ratings.length).toFixed(1);
          book.save()
            .then(savedBook => res.status(201).json(savedBook))
            .catch(error => res.status(500).json({ error }));
        } else {
          res.status(403).json({ message: 'Ce livre a déjà été noté' });
        }
      })
      .catch(error => res.status(500).json({ error: error.message }));

  } catch (err) {
    res.status(500).json({ err })
  }

};

exports.getBestRatedBooks = async (req, res, next) => {
  try {
    const bestBooks = await Book.find().sort({ averageRating: 'desc' }).limit(3);
    res.status(200).json(bestBooks);
  } catch (err) {
    res.status(500).json({ err });
  }
};