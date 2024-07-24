const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const authentification = require('../middlewares/authentificationConfig');
const uploadImgConfig = require('../middlewares/uploadImgConfig');

router.get('/', bookController.getAllBooks);
router.post('/', authentification, uploadImgConfig, bookController.createBook)
router.get('/bestrating', bookController.getBestRatedBooks);
router.get('/:id', bookController.getOneBook);
router.delete('/:id',authentification, bookController.deleteOneBook);
router.put('/:id',authentification, uploadImgConfig, bookController.updateOneBook);
router.post('/:id/rating', authentification, bookController.createRating);

module.exports = router;