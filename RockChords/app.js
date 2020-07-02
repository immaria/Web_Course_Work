const path = require("path");
const express = require('express');
const mustache = require("mustache-express");
const bodyParser = require('body-parser');
const busboyBodyParser = require('busboy-body-parser');
const fs = require("fs-promise");
//const app = new express();
const app = module.exports = express();
const cloudinary = require('cloudinary');
const cloud = require("./cloud");
app.use(busboyBodyParser({
    limit: '5mb',
    multi: true,
}));
app.use(bodyParser.urlencoded({
    extended: false
}));

const viewsPath = path.join(__dirname, 'views');
app.engine("mustache", mustache(path.join(viewsPath, 'partials')));
app.set("views", viewsPath);
app.set('view engine', 'mustache');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(busboyBodyParser());
app.use(express.static("data/fs/"));

const mongoose = require('mongoose');

const config = require('./config');
const url = config.DataBaseUrl;
const port = config.ServerPort;
const connectOptions = {
    useNewUrlParser: true
};

//app.listen(port, () =>console.log(`Server started: ${port}`));


// const cloudinary = require('cloudinary');
// cloudinary.config({
//     cloud_name: config.cloudinary.cloud_name,
//     api_key: config.cloudinary.api_key,
//     api_secret: config.cloudinary.api_secret
// });

const session = require('express-session');
app.use(session({
    secret: 'secretnnnnoooooooo',
    resave: true,
    saveUninitialized: true
}));
const passport = require('passport');


const usersRouter = require('./routes/users');
const chorsRouter = require('./routes/chords');
const tabsRouter = require('./routes/tabs');
const auth = require('./routes/auth');
const check = require('./check');
const api = require('./routes/api');
app.use("/users", usersRouter);
app.use("/chords", chorsRouter);
app.use("/tabs", tabsRouter);
app.use("/auth", auth);
app.use("/api", api);

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
    res.render('index', {
        'title': 'Home',
        'user': req.user
    });
});
app.get('/about', (req, res) => {
    res.render('about', {
        'title': 'About',
        'user': req.user
    });
});
const User = require("./models/user");
app.get('/profile/:id', (req, res) => {
    const id = req.params.id;
    User.getById(id)
        .then(user => {
            if (typeof user === 'undefined') {
                res.status(404).send(`User with id ${id} not found`);
            } else {
                res.render("profile", {
                    "user": req.user,
                    title: `User ${user.fullname}`
                })
            }
        })
});

app.post('/profile/:id/update', (req, res) => {
        let id = req.params.id;
        let fullname = req.body.fullname;
        let login = req.body.login;
        if (req.files.image !== void 0) {
            const buffer = req.files.image[0].data;
            cloud.cloudUploader(buffer)
                .then(photo => {
                    let user = User.getById(id)
                        .then(user => {
                            user.imageUrl = photo.secure_url;
                            user.imageId = photo.public_id;
                            return User.update(id, login, fullname, user.imageUrl, user.imageId);
                        })
                })
                .then(() => res.redirect(`/profile/${id}`))
                .catch(err => {
                    console.log(err);
                    res.status(500).send(err.message)
                });
        }
        else {
            User.simpleUpdate(id, login, fullname)
            .then(res.redirect(`/profile/${id}`))
            .catch(err => {
                console.log(err);
                res.status(500).send(err.toString())});
        }
});

app.get('/wrong', (req, res) => {
    res.render('404', {
        'title': '404',
        'user': req.user
    });
});

mongoose.connect(url, connectOptions)
    .then(() => console.log('Mongo database connected'))
    .then(app.listen(port, () => console.log(`Server started: ${port}`)))
    .catch(() => console.log('ERROR: Mongo database not connected'));