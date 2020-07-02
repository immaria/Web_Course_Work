const fs = require('fs-promise');
const path = "./data/users.json";
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    login: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    fullname: {
        type: String,
        required: true
    },
    role: {
        type: Number,
        default: 0
    },
    //avaUrl : {type: String, required: false},
    imageUrl: {
        type: String
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
});


const UserModel = mongoose.model('User', UserSchema);

class User {
    constructor(login, password, fullname, role, imageUrl, registrationDate) {
        this.login = login;
        this.password = password;
        this.fullname = fullname;
        this.role = role;
        this.imageUrl = imageUrl;
        this.registrationDate = registrationDate;
    }
    static getAll() {
        return UserModel.find().sort({
            created: -1
        });
    }
    static getById(userId) {
        return UserModel.findById(userId);
    }
    static insert(user) {
        return new UserModel(user).save();
    }
    static delete(userId) {
        return UserModel.findByIdAndRemove(userId);
    }
    static findByLogin(login, callback) {
        return UserModel.findOne({
            login: login
        }, callback);
    }
    static findByLogin1(login) {
        if (UserModel.findOne({
                login: login
            })) {
            return true;
        }
        return false;
    }
    static findById(id, callback) {
        return UserModel.findOne({
            _id: id
        }, callback);
    }
    static setAdmin(userId) {
        return UserModel.updateOne({
            _id: userId
        }, {
            $set: {
                role: 1
            }
        });
        // $set -- for update some field(s)
    }
    static update(userId, login, fullname, imageUrl, imageId) {
        return UserModel.findByIdAndUpdate({
            _id: userId
        }, {
            $set: {
                login: login,
                fullname: fullname,
                imageUrl: imageUrl,
                imageId: imageId
            }
        });
    }
    static simpleUpdate(userId, login, fullname){
        return UserModel.findByIdAndUpdate({
            _id: userId
        }, {
            $set: {
                login: login,
                fullname: fullname
            }
        });
    }
    // static insert(login, password, fullname, avaUrl){
    //     let currentUser = new User( {
    //         login: login, fullname: fullname, password: password, avaUrl: avaUrl
    //     } );
    //     if (!currentUser) {
    //         return Promise.rejected(new Error('Bad params'));
    //     } else {
    //         return UserModel(currentUser).save();
    //     } 
    // }
    static getCountPages(callback) {
        UserModel.estimatedDocumentCount()
            .then(data => {
                let usersNumberToDisplay = 4;
                let totalNumber = parseInt(data);
                let countPages = (totalNumber - totalNumber % usersNumberToDisplay) / usersNumberToDisplay;
                if (totalNumber % usersNumberToDisplay) { // остаток != 0
                    countPages++; // add page for last messages
                }// calculate last page
                callback(null, countPages);
            });
    }
    static getUsersByPage(pageNumber) {
        let usersNumberToDisplay = 4;
        pageNumber = parseInt(pageNumber);
        if (pageNumber < 1) {
            return Promise.rejected(new Error('Page not found'));
        }
        let _skp = usersNumberToDisplay * (pageNumber - 1);
        return UserModel.find({}, null, {
                skip: _skp,
                limit: usersNumberToDisplay
            })
            .exec();
    }
}

module.exports = User;