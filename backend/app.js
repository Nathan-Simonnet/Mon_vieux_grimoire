// Credentials
// =======================================
require('dotenv').config();
const dataBaseUrl = process.env.DATABASE_URL;

// Mongoose
// =========================================
const mongoose = require('mongoose');
mongoose.connect(dataBaseUrl)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

// Express configs
// =========================================
const express = require('express');
const app = express();
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

// Routes
// =========================================
const userRouter = require('./routes/userRouter');
const bookRouter = require('./routes/bookRouter');

app.use('/api/auth', userRouter);
app.use('/api/books', bookRouter)
app.use('/images', express.static('images'));

module.exports = app;