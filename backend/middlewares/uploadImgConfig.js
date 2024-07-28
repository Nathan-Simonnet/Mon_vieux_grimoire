const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');

// Create folder "images" if not exist
const imgStorageFolder = 'images';
if (!fs.existsSync(imgStorageFolder)) {
  fs.mkdirSync(imgStorageFolder);
}

// Store files TEMPORARELY in memory (buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('image');

module.exports = (req, res, next) => {
  upload(req, res, (err) => {
    console.log("SHARP")
    if (err) { return res.status(500).json({ error: err.message }); };

    // If the image has not been modified
    if (!req.file) { return next(); };

    // Check extension
    // const MIME_TYPES = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];
    if (!/\.(jpg|png|jpeg|webp)$/i.test(req.file.originalname)) {
      return res.status(400).json({ message: 'Formats accéptés: wepb, jpg, png, jpeg' });
    }

    const cleanString = (str) => str.replace(/[^a-zA-Z0-9_]/g, '');
    // // => voyage_au_ce//ntre_d/e_la_te-rre.jpeg 
    const nameWithoutExtension = req.file.originalname.split(' ').join('_').split('.').slice(0, -1).join('.');
    // => voyage_au_ce//ntre_d/e_la_te-rre
    const cleanedString = cleanString(nameWithoutExtension);
    // => voyage_au_centre_de_la_terre
    const currentTimeStamp = Date.now();
    const fullImgName = cleanedString + "_" + currentTimeStamp + ".webp";
    // => voyage_au_centre_de_la_terre_1721309822643.webp 
    const outputPath = `${imgStorageFolder}/${fullImgName}`;

    sharp(req.file.buffer)
      .toFormat('webp')
      .webp({ lossless: true, quality: 50 })
      .resize({
        width: 400,
        fit: 'contain',
      })
      .toFile(outputPath, (err, info) => {
        if (err) { return res.status(500).json({ err }); };
        req.file.filename = fullImgName;
        next();
      });
  });
};
