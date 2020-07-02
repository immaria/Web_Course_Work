const express = require('express');
const User = require("../models/user");
const bodyParser = require('body-parser');
const path = require("path");
const busboyBodyParser = require('busboy-body-parser');
const fs = require("fs-promise");
const router = express.Router();
const passport = require('passport');
const session = require('express-session');
router.use(session({
    secret: 'secretnnnnoooooooo',
    resave: true,
    saveUninitialized: true,
}));
router.use(passport.initialize());
router.use(passport.session());
router.use(express.static("public"));
router.use(express.static("data/fs"));
const check = require('../check');
const cloudinary = require('cloudinary');
const cloud = require("../cloud");
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(busboyBodyParser({
    limit: '10mb',
    multi: true,
}));
const viewsPath = path.join(__dirname, 'views');

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
        User.getAll()
            .then(users => {
                if (byFilter) {
                    users = users.filter((user) =>
                        user.fullname.toUpperCase().includes(byFilter.toUpperCase()));
                }
                res.render("users", {
                    users,
                    title: "All users",
                    'user': req.user
                })
            })
            .catch(err => res.status(500).send(err.toString()));
    } else {
        User.getUsersByPage(pageNumber)
            .then(users => {
                res.render('users', {
                    users: users,
                    nextPage: nextPage,
                    prevPage: prevPage,
                    pageNumber: pageNumber,
                    pages: pages,
                    items: items,
                    title: 'All users',
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
// router.get('/', check.checkAdmin, (req, res) => {
//     let page = parseInt(req.query.page);
//     if (!page) {
//         page = 1;
//     }
//     const byFilter = req.query.byFilter;
//     const usersToDisplay = 4;
//     const startIndex = (page - 1) * usersToDisplay;
//     const endIndex = page * usersToDisplay;
//     User.getAll()
//         .then(users => {
//             if (byFilter) {
//                 users = users.filter((user) =>
//                     user.fullname.toUpperCase().includes(byFilter.toUpperCase()));
//             }
//             users = users.slice(startIndex, endIndex);
//             res.render("users", {
//                 users,
//                 title: "All users", 
//                 'user': req.user
//             })
//         })
//         .catch(err => res.status(500).send(err.toString()));
// });

// router.post("/new", check.checkAdmin, (req, res) => {
//     // const user = new User(req.body.login, req.body.fullname, req.body.role, req.body.ava);
//     // user.avaUrl = `/images/${user.login}.png`;
//     // const pict = req.files.ava;
//     // const image = pict[0];
//     // fs.writeFile((path.join(__dirname, `../data/fs/${user.login}.png`)), image.data, (err) => {
//     //     if (err) {
//     //         return console.log(err);
//     //     }
//     // });
//     // User.insert(user)
//     //     .then(user => {
//     //         const userId = (user._id).toString();
//     //         res.redirect(`/users/${userId}`);
//     //     })
//     //     .catch(err => res.status(500).send(err.toString()));

// });

// router.get('/new', (req, res) => {
//     res.render("newUser", {
//         title: "Insertion new user", 
//         'user': req.user
//     });
// });

router.get('/:userId', check.checkAdmin, (req, res) => {
    const userId = req.params.userId;
    User.getById(userId)
        .then(user => {
            if (typeof user === 'undefined') {
                res.status(404).send(`User with id ${userId} not found`);
            } else {
                res.render("user", {
                    "userRequired": user,
                    title: `User ${user.fullname}`,
                    'user': req.user
                })
            }
        })
});


router.post('/:userId/delete', check.checkAdmin, (req, res) => {
    const userId = req.params.userId;
    User.delete(userId)
        .then(user => {
            if (typeof user === 'undefined') {
                res.status(404).send(`User with id ${userId} not found`);
            } else {
                res.redirect(`/users`);
            }
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.get('/:userId/setAdmin', check.checkAdmin, (req, res) => {
    const userId = req.params.userId;
    User.setAdmin(userId)
        .then(() =>
            res.redirect('/users')
        )
        .catch(err => res.status(500).send(err.toString()));
    // .catch(err => console.log('SetAdmin error: '+err));
});

router.get('/:userId/viewUser', check.checkAuth, (req, res) => {
    const userId = req.params.userId;
    User.getById(userId)
        .then(user => {
            if (typeof user === 'undefined') {
                res.status(404).send(`User with id ${userId} not found`);
            } else {
                res.render("user", {
                    "userRequired": user,
                    title: `User ${user.fullname}`,
                    'user': req.user
                })
            }
        })
    // .catch(err => console.log('SetAdmin error: '+err));
});

router.post('/:userId/update', check.checkAdmin, (req, res) => {
    // const userId = req.params.userId;
    // const fullname = req.body.fullname;
    // const login = req.body.login;
    // User.update(userId, login, fullname)
    //     .then(res.redirect(`/profile/${userId}`))
    //     .catch(err => {
    //         console.log(err);
    //         res.status(500).send(err.toString())});
    let userId = req.params.userId;
    let fullname = req.body.fullname;
    let login = req.body.login;
    if (req.files.image !== void 0) {
        const buffer = req.files.image[0].data;
        cloud.cloudUploader(buffer)
            .then(photo => {
                let user = User.getById(userId)
                    .then(user => {
                        user.imageUrl = photo.secure_url;
                        user.imageId = photo.public_id;
                        return User.update(userId, login, fullname, user.imageUrl, user.imageId);
                    })
            })
            .then(() => res.redirect(`/users/${userId}`))
            .catch(err => {
                console.log(err);
                res.status(500).send(err.message)
            });
    } else {
        User.simpleUpdate(userId, login, fullname)
            .then(res.redirect(`/users/${userId}`))
            .catch(err => {
                console.log(err);
                res.status(500).send(err.toString())
            });
    }

});
/*router.put('/:userId/update', (req, res) => {
    const userId = req.params.userId;
    const updates = {
        fullname: req.body.fullname,
        login: req.body.login,
        role: req.body.role,
        pict: req.body.pict
    };
    console.log("TRying to update:::");
    User.update(userId, updates)
        .then(user => {
            res.redirect(`/users/${userId}`);
        })
        .catch(err => res.status(500).end(String(err)));
});*/



module.exports = router;