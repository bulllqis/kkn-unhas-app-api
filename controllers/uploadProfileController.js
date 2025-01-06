const cloudinary = require('../config/cloudinary'); 

const uploadProfileToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        if (!file || !file._data) {
            reject(new Error('File atau buffer kosong'));
            return;
        }

        cloudinary.uploader.upload_stream(
            {
                folder: 'profile', 
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);  // Menyimpan result yang berupa URL foto
                }
            }
        ).end(file._data);  // Menggunakan stream untuk mengupload file ke Cloudinary
    });
};

module.exports = { uploadProfileToCloudinary };
