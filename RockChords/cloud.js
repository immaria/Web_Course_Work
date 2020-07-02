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
                    folder: "rockchords/collections/",
                    public_id: "chordId"
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

module.exports = {
    cloudUploader,
    cloudRemover
}