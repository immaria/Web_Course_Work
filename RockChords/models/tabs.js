const fs = require('fs-promise');

const path = "./data/tabs.json";
const mongoose = require('mongoose');

const TabsSchema = new mongoose.Schema({
    name: { type: String },
    chords: [{ type: mongoose.Schema.ObjectId, ref: "Chord"}],
    author: { type: mongoose.mongo.ObjectId, ref: "User" },
    imageUrl: {type: String},
    created: { type: Date, default: Date.now }
 });
 
 const TabsModel = mongoose.model('Tabs', TabsSchema);
 

class Tabs {
    constructor(name, chords, author, imageUrl,  created) {
        this.name = name;
        this.chords = chords;
        this.author = author;
        this.imageUrl = imageUrl;
        this.created = created;
    }
    static getAll() {
        return TabsModel.find().sort({created: -1});
    }
    static getById(tabsId) {
        return TabsModel.findById(tabsId);
    }
    static insert(tabs) {
        return new TabsModel(tabs).save();
    }
    static update(tabsId) {
        return TabsModel.findByIdAndUpdate(tabsId);
    }
    static delete(tabsId) {
        return TabsModel.findByIdAndRemove(tabsId);
    }

    static getCountPages(callback) {
        TabsModel.estimatedDocumentCount()
            .then(data => {
                let tabsNumberToDisplay = 4;
                let totalNumber = parseInt(data);
                let countPages = (totalNumber - totalNumber % tabsNumberToDisplay) / tabsNumberToDisplay;
                if (totalNumber % tabsNumberToDisplay) { // остаток != 0
                    countPages++; // add page for last messages
                }// calculate last page
                callback(null, countPages);
            });
    }
    static getTabsByPage(pageNumber) {
        let tabsNumberToDisplay = 4;
        pageNumber = parseInt(pageNumber);
        if (pageNumber < 1) {
            return Promise.rejected(new Error('Page not found'));
        }
        let _skp = tabsNumberToDisplay * (pageNumber - 1);
        return TabsModel.find({}, null, {
                skip: _skp,
                limit: tabsNumberToDisplay
            })
            .populate("author")
            .populate("chords.chord")
            .exec();
    }
}

module.exports = Tabs;
