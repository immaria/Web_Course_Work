const express = require('express');
const User = require("../models/user");
const Chord = require("../models/chord");
const Tabs = require("../models/tabs");
const bodyParser = require('body-parser');
const path = require("path");
const busboyBodyParser = require('busboy-body-parser');
const fs = require("fs-promise");
const router = express.Router();
const check = require('../check');
function getNumPages(req, res, next) {
    User.getCountPages((err, data) => {
        if (err) {
            res.status(500).send("Server error");
            console.log(err);
        }
        req.countPages = data;
        next();

    });
}
router.get('/users', (req, res) => {
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
    return User.getUsersByPage(pageNumber)
        .then(users => {
            res.json(users);
        })
        .catch(err => {
            res.status(500)
                .send('Server error');
            console.log(err);
        });
});

router.get('/users/:userId', (req, res) => {
    const userId = req.params.userId;
    return User.getById(userId)
        .then(user => {
            if (!user) {
                res.status(404).end(`No user with id: ${userId} found`);
                return;
            }
            res.json(user);
        })
        .catch(err => {
            console.log(err);
            res.status(500).send(err.toString());
        });
});

router.get('/tabs/:tabsId', (req, res) => {
    const tabsId = req.params.tabsId;
    Tabs.getById(tabsId)
        .populate("author")
        .populate("chords")
        .exec()
        .then(tab => {
            if (typeof tab === 'undefined') {
                res.status(404).send(`Tabs with id ${tabsId} not found`);
            } else {
                res.json(tab)
            }
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.get('/tabs', (req, res) => {
    Tabs.getAll()
        .find()
        .populate("author")
        .populate("chords.chord")
        .exec()
        .then(tabs => {
            res.render(tabs)
        })
        .catch(err => {
            res.status(500).send(err.toString())
        });
});

router.get('/chords/:chordId', (req, res) => {
    const chordId = req.params.chordId;
    Chord.getById(chordId)
        .then(chord => {
            if (typeof chord === 'undefined') {
                res.status(404).send(`Chord with id ${chordId} not found`);
            } else {
                res.json(chord)
            }
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.get('/chords',(req, res) => {
    Chord.getAll()
        .then(chords => {
            res.json(chords);
        })
        .catch(err => res.status(500).send(err.toString()));
});

module.exports = router;