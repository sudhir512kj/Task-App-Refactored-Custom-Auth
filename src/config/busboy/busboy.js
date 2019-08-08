/*
 * File: Configuration for Multer.
 *
 * Description: Houses configuration for Multer for multipart/form-data image uploads.
 * 
 * Created by Jamie Corkhill 08/07/19 at 04:31 PM (Local), 07/05/2019 at 09:31 PM (Zulu)
 */
const Busboy = require('busboy');

const { ValidationError } = require('./../../custom-exceptions/index');

/**
 * @description - Permit the upload of a single file stream from the client.
 */
module.exports = req => new Promise((resolve, reject) => {
    const busboy = new Busboy({
        headers: req.headers,
        limits: {
            files: 1, // Only one file may be uploaded at a time.
            fileSize: 3 * 1000000 // In bytes, so 3 MB.
        },
        abortOnLimit: true,
    });

    // Keep track of an execution context.
    const context = {
        _cleanUp() {
            busboy.removeListener('file', this._onFile);
            busboy.removeListener('error', this._onError);
        },
        _onFile(fieldName, file, filename, encoding, mimetype) {
            this._cleanUp();

            const allowedMimetypes = ['image/jpeg', 'image/png'];
            
            // Ensure the mimetype is correct.
            if (allowedMimetypes.includes(mimetype)) return resolve({ file, filename });

            return reject(new ValidationError(null, `The mimetype ${mimetype} is invalid for this upload!`));
        },
        _onError(err) {
            this._cleanUp();
            reject(err);
        }
    };
    
    // Register handlers.
    busboy.once('file', context._onFile.bind(context));
    busboy.once('error', context._onError.bind(context));

    // Pipe the `req` ReadableStream to the `busboy` WritableStream.
    req.pipe(busboy);
});
