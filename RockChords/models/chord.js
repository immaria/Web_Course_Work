const fs = require('fs-promise');
const path = "./data/chords.json";
const mongoose = require('mongoose');

const busboyBodyParser = require('busboy-body-parser');

const ChordSchema = new mongoose.Schema({
    name: {
        type: String
    },
    tonality: {
        type: String
    },
    notesQuantity: {
        type: Number
    },
    //pictureUrl: { type: String },
    imageUrl: {
        type: String
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

const ChordModel = mongoose.model('Chord', ChordSchema);

class Chord {
    constructor(name, tonality, notesQuantity, imageUrl,  uploadDate) {
        this.name = name;
        this.tonality = tonality;
        this.notesQuantity = notesQuantity;
        this.imageUrl = imageUrl;
        this.uploadDate = uploadDate;
    }
    static getAll() {
        return ChordModel.find().sort({
            created: -1
        });
    }
    static getById(chordId) {
        return ChordModel.findById(chordId);
    }
    static insert(chord) {
        return new ChordModel(chord).save();
    }
    static update(chordId, chordName, tonality, notesQuantity, imageUrl, imageId) {
        return ChordModel.findByIdAndUpdate({
            _id: chordId
        }, {
            $set: {
                name: chordName,
                tonality: tonality,
                notesQuantity: notesQuantity,
                imageUrl: imageUrl,
                imageId: imageId
            }
        });
    }
    static delete(chordId) {
        return ChordModel.findByIdAndRemove(chordId);
    }
    static updatePhoto(chordId, imageUrl, imageId) {
        return ChordModel.findByIdAndUpdate({
            _id: chordId
        }, {
            $set: {
                imageUrl: imageUrl,
                imageId: imageId
            }
        });
    }
    static getCountPages(callback) {
        ChordModel.estimatedDocumentCount()
            .then(data => {
                let chordsNumberToDisplay = 4;
                let totalNumber = parseInt(data);
                let countPages = (totalNumber - totalNumber % chordsNumberToDisplay) / chordsNumberToDisplay;
                if (totalNumber % chordsNumberToDisplay) { // остаток != 0
                    countPages++; // add page for last messages
                }// calculate last page
                callback(null, countPages);
            });
    }
    static getChordsByPage(pageNumber) {
        let chordsNumberToDisplay = 4;
        pageNumber = parseInt(pageNumber);
        if (pageNumber < 1) {
            return Promise.rejected(new Error('Page not found'));
        }
        let _skp = chordsNumberToDisplay * (pageNumber - 1);
        return ChordModel.find({}, null, {
                skip: _skp,
                limit: chordsNumberToDisplay
            })
            .exec();
    }
}

module.exports = Chord;