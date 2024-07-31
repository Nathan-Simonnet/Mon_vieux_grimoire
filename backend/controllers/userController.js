const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const secretToken = process.env.SECRET_TOKEN

exports.signup = (req, res, next) => {
    try {
        const emailRegex = /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/;

        if (!emailRegex.test(req.body.email)) {
            return res.status(400).json({ message: "Format d'email invalide" });
        }

        if (req.body.password.length === 0 || req.body.password.length === undefined) {
            return res.status(400).json({ message: "Mot de passe invalide" });
        }

        bcrypt.hash(req.body.password, 10)
            .then(hash => {
                const user = new User({
                    email: req.body.email,
                    password: hash
                });
                user.save()
                    .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                    .catch(error => res.status(500).json({ error }));
            })
            .catch(error => res.status(500).json({ error }));
    } catch (err) {
        res.status(500).json({ err })
    }
}

exports.login = (req, res, next) => {
    try {
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect !' });
                }
                bcrypt.compare(req.body.password, user.password)
                    .then(valid => {
                        if (!valid) {
                            return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect!' });
                        }
                        res.status(200).json({
                            userId: user._id,
                            token:
                                jsonwebtoken.sign(
                                    { userId: user._id },
                                    secretToken,
                                    { expiresIn: '24h' }
                                )
                        });
                    })
                    .catch(error => res.status(500).json({ error }));
            })
            .catch(error => res.status(500).json({ error }));
    } catch (err) {
        res.status(500).json({ err })
    }
}