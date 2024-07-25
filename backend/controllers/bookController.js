const Book = require('../models/bookModel');
const fs = require('fs');

exports.getAllBooks = (req, res, next) => {
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
};

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  });


  book.save()
    .then(() => {
      console.log('Livre enregistré !')
      res.status(201).json({ message: 'Livre enregistré !' })
    })
    .catch(error => { res.status(500).json({ error }) });
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(
      (book) => {
        res.status(200).json(book);
      })
    .catch(
      (error) => {
        res.status(404).json({ error });
      });
};

exports.deleteOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Utilisateur non authentifié' });
      } else {
        const filename = book.imageUrl.split('/images/')[1];

        fs.unlink(`images/${filename}`, (err) => {
          if (err) {
            console.log("Erreur lors de la suppression de l'ancienne image", err);
          } else {
            console.log("Suppression de l'ancienne image réussie");
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
};

exports.updateOneBook = (req, res, next) => {

  let bookObject;
  if (req.file) {
    bookObject = {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    };
  } else {
    bookObject = { ...req.body };
  }

  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: 'Utilisateur non authentifié' });
      } else {
        // Delete previous image before update
        // Can be done sync or async
        if(req.file){
          fs.unlink(book.imageUrl.split("4000/")[1], (err) => {
            if (err) {
              console.log("Erreur lors de la suppression de l'ancienne image", err);
            } else {
              console.log("Suppression de l'ancienne image réussie");
            }
          });
        }

        Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
          .then(() => {
            res.status(200).json({ message: 'Livre modifié!' })
          })
          .catch(error => res.status(500).json({ error }));
      }
    })
    .catch((error) => {
      res.status(404).json({ error });
    });
};

exports.createRating = (req, res) => {
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
};

exports.getBestRatedBooks = (req, res, next) => {

  Book.find()
    .then((books) => {
      const bookSorted = books.sort((b, a) =>
        a.averageRating - b.averageRating
      );
      res.status(200).json(bookSorted.slice(0, 3));
    })
    .catch((error) => res.status(500).json({ error }));
}