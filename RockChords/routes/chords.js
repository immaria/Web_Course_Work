const express = require('express');
const Chord = require("../models/chord");
const path = require("path");
const check = require('../check');
const bodyParser = require('body-parser');
const busboyBodyParser = require('busboy-body-parser');
const fs = require("fs-promise");
const router = express.Router();
router.use(express.static("data/fs/"));
const passport = require('passport');
const session = require('express-session');
router.use(session({
    secret: 'secretnnnnoooooooo',
    resave: true,
    saveUninitialized: true,
}));
router.use(passport.initialize());
router.use(passport.session());
const cloudinary = require('cloudinary');
const cloud = require("../cloud");
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(busboyBodyParser({
    limit: '5mb',
    multi: true,
}));
const viewsPath = path.join(__dirname, 'views');
router.use(express.static("public"));

function getNumPages(req, res, next) {
    Chord.getCountPages((err, data) => {
        if (err) {
            res.status(500).send("Server error");
            console.log(err);
        }
        req.countPages = data;
        next();

    });
}

router.get('/', check.checkAuth, getNumPages, (req, res) => {
    const byFilter = req.query.byFilter;
    let urlParsed = (require('url')).parse(req.url, true);
    let pages = req.countPages;
    let items = [];
    let i = 1;
    while (i <= pages) {
        items.push(i++);
    }
    let pageNumber = parseInt(urlParsed.query.page);
    if (!pageNumber) {
        pageNumber = 1;
    }
    let nextPage;
    let prevPage;
    if (pageNumber < req.countPages) {
        nextPage = pageNumber + 1;
    }
    if (pageNumber > 1) {
        prevPage = pageNumber - 1;
    }
    if (byFilter) {
        Chord.getAll()
            .then(chords => {
                chords = chords.filter((chord) =>
                    chord.name.toUpperCase().includes(byFilter.toUpperCase()));
                res.render("chords", {
                    chords,
                    title: "All chords",
                    'user': req.user
                })
            })
            .catch(err => res.status(500).send(err.toString()));
    } else {
        Chord.getChordsByPage(pageNumber)
            .then(chords => {
                if (byFilter) {
                    chords = chords.filter((chord) =>
                        chord.name.toUpperCase().includes(byFilter.toUpperCase()));
                }
                res.render('chords', {
                    chords,
                    nextPage: nextPage,
                    prevPage: prevPage,
                    pageNumber: pageNumber,
                    pages: pages,
                    items: items,
                    title: 'All chords',
                    'user': req.user
                });
            })
            .catch(err => {
                res.status(500)
                    .send('Server error');
                console.log(err);
            });
    }
});

// router.get('/', check.checkAuth, (req, res) => {
//     let page = parseInt(req.query.page);
//     if (!page) {
//         page = 1;
//     }
//     const byFilter = req.query.byFilter;
//     const chordsToDisplay = 4;
//     const startIndex = (page - 1) * chordsToDisplay;
//     const endIndex = page * chordsToDisplay;
//     Chord.getAll()
//         .then(chords => {
//             if (byFilter) {
//                 chords = chords.filter((chord) =>
//                     chord.name.toUpperCase().includes(byFilter.toUpperCase()));
//             }
//             chords = chords.slice(startIndex, endIndex);
//             res.render("chords", {
//                 chords,
//                 title: "All chords",
//                 'user': req.user
//             })
//         })
//         .catch(err => res.status(500).send(err.toString()));
// });

router.get('/new', check.checkAuth, (req, res) => {
    res.render("new", {
        title: "Insertion new chord",
        'user': req.user
    });
});

router.post('/:chordId/update', (req, res) => {
    let chordId = req.params.chordId;
    let name = req.body.name;
    let tonality = req.body.tonality;
    let notesQuantity = req.body.notesQuantity;
    if (req.files.image !== void 0) {
        const buffer = req.files.image[0].data;
        cloud.cloudUploader(buffer)
            .then(photo => {
                let chord = Chord.getById(chordId)
                    .then(chord => {
                        chord.imageUrl = photo.secure_url;
                        chord.imageId = photo.public_id;
                        return Chord.update(chordId, name, tonality, notesQuantity, chord.imageUrl, chord.imageId);
                    })
            })
            .then(() => res.redirect(`/chords/${chordId}`))
            .catch(err => {
                console.log(err);
                res.status(500).send(err.message)
            });
    }

});


router.get('/:chordId', check.checkAuth, (req, res) => {
    const chordId = req.params.chordId;
    Chord.getById(chordId)
        .then(chord => {
            if (typeof chord === 'undefined') {
                res.status(404).send(`Chord with id ${chordId} not found`);
            } else {
                res.render("chord", {
                    chord,
                    title: `Chord ${chord.name}`,
                    'user': req.user
                });
            }
        })
        .catch(err => res.status(500).send(err.toString()));
});


router.post('/:chordId/delete', check.checkAuth, (req, res) => {
    const chordId = req.params.chordId;
    Chord.delete(chordId)
        .then(chord => {
            if (typeof chord === 'undefined') {
                res.status(404).send(`Chord with id ${chordId} not found`);
            } else {
                res.redirect(`/chords`);
            }
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.post("/new", check.checkAuth, (req, res) => {
    let id = req.params.id;
    let name = req.body.name;
    let tonality = req.body.tonality;
    let notesQuantity = req.body.notesQuantity;
    const chord = new Chord(name, tonality, notesQuantity);
    if (req.files.image !== void 0) {
        const buffer = req.files.image[0].data;
        console.log(buffer);
        // cloudinary.uploader.upload("my_picture.jpg", function(result) { console.log(result) })
        cloud.cloudUploader(buffer)
            .then(photo => {
                chord.imageUrl = photo.secure_url;
                chord.imageId = photo.public_id;
                console.log(chord);
                return Chord.insert(chord);
            })
            .then(() => res.redirect(`/chords`))
            .catch(err => res.status(500).send(err.message));
    }
});
module.exports = router;