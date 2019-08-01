/*
 * File: Configuration for Multer.
 *
 * Description: Houses configuration for Multer for multipart/form-data image uploads.
 * 
 * Created by Jamie Corkhill 07/05/19 at 12:38 PM (Local), 07/05/2019 at 05:39 PM (Zulu)
 */

const multer = require('multer');

const { ValidationError } = require('./../../custom-exceptions/index');

module.exports = multer({
    limits: {
        fileSize: 3000000 // In bytes, so 3 MB. 1 MB = 1_000_000 bytes (That's a new C# 7 feature to format Numeric Types!)
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new ValidationError('Please only upload an image file'));
        }
        return cb(undefined, true); // Accepting the upload.
    }
});