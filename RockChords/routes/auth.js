const express = require('express');
const User = require("../models/user");
const bodyParser = require('body-parser');
const path = require("path");
const busboyBodyParser = require('busboy-body-parser');
const fs = require("fs-promise");
const router = express.Router();
const ObjectID = require('mongodb').ObjectID;

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
// const cloudinary = require('cloudinary');
// const cloud = require("../cloud");




const cloudinary = require('cloudinary');
const defaultImageUrl = "https://res.cloudinary.com/imariams/image/upload/v1544472882/rockchords/default.png";
const defaultImageId = "default";

cloudinary.config({
    cloud_name: 'imariams',
    api_key: '828399378781476',
    api_secret: 'Qph7nYJl6W1U_LD34patXY5slHk'
});

let cloudUploader = function cloudUploader(buffer) {
    return new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload_stream({
                    resource_type: 'image',
                    folder: "rockchords/users/",
                    public_id: "userId"
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                })
            .end(buffer);
    });
}

let cloudRemover = function cloudRemover(id) {
    return Promise.resolve(
        cloudinary.v2.uploader.destroy(id,
            (error, result) => console.log(result, error))
    );
}

router.use(passport.initialize());
router.use(passport.session());

passport.use(new LocalStrategy({
    usernameField: 'login',
    passwordField: 'password'
}, function (login, password, done) {
    User.findByLogin(login, (err, user) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
            return done(null, false);
        }
        return done(null, user);
    });
}));

// визначає, яку інформацію зберігати у Cookie сесії
passport.serializeUser(function (user, done) {
    // наприклад, зберегти у Cookie сесії id користувача
    done(null, user.id);
});
passport.deserializeUser((_id, done) => {
    User.findById(_id, (err, user) => {
        done(null, user);
    });
});

router.get('/login', (req, res) => {
    if (req.user) {
        res.redirect('/');
        return;
    }
    let urlParsed = (require('url')).parse(req.url, true);
    let errors = urlParsed.query.Error;
    res.render('login', {
        title: "Login",
        errors: errors
    });
});


router.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/auth/login?Error=Passwors+or+login+incorrect,+please+try+again'
    }),
    (req, res) => {
        res.redirect("/");
    }
);

router.get('/register', (req, res) => {
    if (req.user) {
        res.redirect('/'); // redirect from this page
        return; // blocked sync
    }
    let urlParsed = (require('url')).parse(req.url, true);
    let errors = urlParsed.query.Error;
    res.render('register', {
        errors: errors
    });
});


router.post('/register', (req, res, next) => {
        if (req.user) {
            res.redirect('/'); // redirect from this page
            return; // blocked sync
        }
        let login = req.body.login;
        let fullname = req.body.fullname;
        let password = req.body.password;
        let password2 = req.body.password2;
        let role = 0;
        let hash = bcrypt.hashSync(req.body.password, 12);
        if (req.user) {
            res.redirect('/');
            return;
        }
        if (req.body.password !== req.body.password2) {
            res.redirect(`/auth/register?Error=Passwords+don't+match`);
        } else {
            let hash = bcrypt.hashSync(req.body.password, 12);
            User.findByLogin(req.body.login, function (err, user) {
                if (err) {
                    next(err);
                } else if (user) {
                    res.redirect('/auth/register?Error=user+' + login + '+has+already+registered');
                } else if (req.files.ava !== void 0) {
                    const user = new User(login, hash.toString(), fullname, role);
                    const buffer = req.files.ava[0].data;
                   // console.log("user.buffer:", buffer);
                    cloudUploader(buffer)
                        .then(photo => {
                            user.imageUrl = photo.secure_url;
                            user.imageId = photo.public_id;
                            User.insert(user)
                                .then(user => {
                                    const userId = (user._id).toString();
                                    res.redirect('/auth/login');
                                })
                                .catch(err => res.status(500).send(err.toString()));
                        })
                        .catch(err => res.status(500).send(err.toString()));
                }
                else {
                    const user = new User(login, hash.toString(), fullname, role);
                    User.insert(user)
                    .then(user => {
                        const userId = (user._id).toString();
                        res.redirect('/auth/login');
                    })
                    .catch(err => res.status(500).send(err.toString()));
                }
            });
        }
    },
    (req, res) => {
        res.redirect('/auth/login');
    }
);
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

module.exports = router;