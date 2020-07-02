const express = require('express');
const Tabs = require("../models/tabs");
const User = require("../models/user");
const Chord = require("../models/chord");
const router = express.Router();
const passport = require('passport');
const check = require('../check');
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
// router.get('/', check.checkAuth, (req, res) => {
//     let page = parseInt(req.query.page);
//     if (!page) {
//         page = 1;
//     }
//     const byFilter = req.query.byFilter;
//     const tabsToDisplay = 4;
//     const startIndex = (page - 1) * tabsToDisplay;
//     const endIndex = page * tabsToDisplay;
//     Tabs.getAll()
//         .find()
//         .populate("author")
//         .populate("chords.chord")
//         .exec()
//         .then(tabs => {
//             if (byFilter) {
//                 tabs = tabs.filter((tab) =>
//                     tab.name.toUpperCase().includes(byFilter.toUpperCase()));
//             }
//             tabs = tabs.slice(startIndex, endIndex);
//             res.render("tabs", {
//                 tabs,
//                 title: "All tabs",
//                 'user': req.user
//             })
//         })
//         .catch(err => {
//             res.status(500).send(err.toString())
//         });
// });
function getNumPages(req, res, next) {
    Tabs.getCountPages((err, data) => {
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
        Tabs.getAll()
            .find()
            .populate("author")
            .populate("chords.chord")
            .exec()
            .then(tabs => {
                if (byFilter) {
                    tabs = tabs.filter((tab) =>
                        tab.name.toUpperCase().includes(byFilter.toUpperCase()));
                }
                res.render("tabs", {
                    tabs,
                    title: "All tabs",
                    'user': req.user
                })
            })
            .catch(err => {
                res.status(500).send(err.toString())
            });
    } else {
        Tabs.getTabsByPage(pageNumber)
            .then(tabs => {
                res.render('tabs', {
                    tabs: tabs,
                    nextPage: nextPage,
                    prevPage: prevPage,
                    pageNumber: pageNumber,
                    pages: pages,
                    items: items,
                    title: 'All tabs',
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


router.get("/new", check.checkAuth, (req, res) => {
    const users = User.getAll()
        .then(users => {
            const chords = Chord.getAll()
                .then(chords => {
                    res.render("newTab", {
                        users,
                        chords,
                        title: "Insertion new tab",
                        'user': req.user
                    })
                })
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.post("/new", check.checkAuth, (req, res) => {
    // const author = req.body.method_select;
    // let selectedChords = req.body.chords_list;

    // console.log(selectedChords);
    // const tab = new Tabs(req.body.name, selectedChords, author);
    // Tabs.insert(tab)
    //     .then(tab => {
    //         const tabId = (tab._id).toString();
    //         res.redirect(`/tabs/${tabId}`)
    //     })
    //     .catch(err => res.status(500).send(err.toString()));
    let name = req.body.name;
    let chords = req.body.chords_list;
    let author = req.user;
   // console.log(author);
    const tab = new Tabs(name, chords, author);
    if (req.files.image !== void 0) {
        const buffer = req.files.image[0].data;
        cloud.cloudUploader(buffer)
            .then(photo => {
                tab.imageUrl = photo.secure_url;
                tab.imageId = photo.public_id;
                console.log(tab);
                return Tabs.insert(tab);
            })
            .then(() => res.redirect('/tabs'))
            .catch(err => res.status(500).send(err.message));
    }
});

router.get('/:tabsId', check.checkAuth, (req, res) => {
    const tabsId = req.params.tabsId;
    Tabs.getById(tabsId)
        .populate("author")
        .populate("chords")
        .exec()
        .then(tab => {
            if (typeof tab === 'undefined') {
                res.status(404).send(`Tabs with id ${tabsId} not found`);
            } else {
                res.render("tab", {
                    tab,
                    title: `Tabs ${tab.name}`,
                    'user': req.user
                });
            }
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.post('/:tabsId/delete', check.checkAuth, (req, res) => {
    const tabsId = req.params.tabsId;
    Tabs.delete(tabsId)
        .then(tab => {
            if (typeof tab === 'undefined') {
                res.status(404).send(`Tab with id ${tabsId} not found`);
            } else {
                res.redirect(`/tabs`);
            }
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.post('/insert', check.checkAuth, (req, res) => {
    const tab = new Tabs({
        'name': req.body.name,
        'autor': req.user.id,
    });
    if (req.files.image !== void 0) {
        const buffer = req.files.image.data;
        cloudUploader(buffer)
            .then(photo => {
                tab.imageUrl = photo.secure_url;
                tab.imageId = photo.public_id;
                console.log(tab);
                return Tabs.insert(tab);
            })
            .then(() => res.redirect('/tabs'))
            .catch(err => res.status(500).send(err.message));
    }
    // } else {
    //     messages.insert(msg)
    //         .then(() => res.redirect('/messages'))
    //         .catch(err => res.status(500).send(err.message));
    // }
});

module.exports = router;