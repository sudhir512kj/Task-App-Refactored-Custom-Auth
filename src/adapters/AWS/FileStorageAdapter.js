/*
 * File: FileStorageAdapter.js (src/adapters/AWS/FileStorageAdapter.js)
 *
 * Description: Implements an adapter interface to wrap the AWS S3 API.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 10:42 PM (Local), 07/29/2019 at 03:42 AM (Zulu)
 */

/**
 * @description Adapter interface to wrap the AWS S3 API.
 *
 * @class FileStorageAdapter
 */

const mime = require('mime-types');

class FileStorageAdapter {
    constructor({ aws, appConfig }) {
        // Dependency Injection
        this.s3 = new aws.S3();
        this.appConfig = appConfig;
        this.partialFileURIPostfix = 's3.us-west-2.amazonaws.com';

        // Maps file types to AWS S3 Bucket. 
        // This is equivalent to a type Dictionary<string, FilePurpose[]> in C#, where the key is the bucket, and the value is a string array of corresponding
        // file purposes that match that bucket.
        this.bucketMap = [{
            bucket: appConfig.cloudStorage.buckets.getMainBucket(),
            filePurposes: [
                FileStorageAdapter.prototype.FilePurpose.AvatarImage, 
                FileStorageAdapter.prototype.FilePurpose.TaskImage
            ]
        }];
    }

    /**
     * @description Provides a promisified interface for file upload to the cloud storage solution.
     *
     * @param   {Object}                  uploadFileParams The required parameters to upload the BLOB to cloud storage.
     * @returns {Promise<{Object}|Error>} A promise to the token.
     * @memberof FileStorageAdapter
     */
    uploadFile(uploadFileParams) {
        // eslint-disable-next-line consistent-return
        return new Promise((resolve, reject) => {   
            const { content, filename, filePurpose, fileAccess } = uploadFileParams;

            // Attempt to ascertain the bucket from the provided file purpose.  
            const bucket = this._mapFilePurposeToBucket(filePurpose);

            // Attempt to ascertain the mimeType from the filename.
            const mimeType = mime.lookup(filename);

            // mime.lookup will return false if a mime-type can't be identified.
            if (!mimeType) return reject(new Error(`${filename} is not a valid file name!`));

            // bucket is undefined if the provided type could not be matched.
            if (!bucket) return reject(new Error(`The purpose ${filePurpose} is not recognized as a valid file purpose!`));

            // Performing the upload process.
            this.s3.upload({
                Key: filename,
                Body: content,
                ACL: fileAccess,
                Bucket: bucket,
                ContentType: mimeType
            }, (err, data) => {
                if (err) return reject(err);
                return resolve({
                    filename: data.Key,
                    contentType: mimeType,
                    content
                });
            });          
        });
    }

    /**
     * @description Provides a promisified interface for file deletion from cloud storage.
     *
     * @param    {String} filename    The name of the file to delete.
     * @param    {String} filePurpose The purpose associated with the file. 
     * @returns  Promise settling with data from the response to the cloud storage service.
     * @memberof FileStorageAdapter
     */
    deleteFile(filename, filePurpose) {
        // eslint-disable-next-line consistent-return
        return new Promise((resolve, reject) => {
            const bucket = this._mapFilePurposeToBucket(filePurpose);

            if (!bucket) return reject(new Error(`The purpose ${filePurpose} is not recognized as a valid file purpose!`));

            this.s3.deleteObject({
                bucket,
                Key: filename
            }, (err, data) => {
                if (err) return reject(err);
                return resolve();
            });
        });
    }

    /**
     * @description - Internal private member that performs logic to map a file type to a bucket name.
     *
     * @param    {String} filePurpose The purpose of the file for which to map to a bucket name.
     * @returns  {String} The name of the bucket.
     * @memberof FileStorageAdapter
     */
    _mapFilePurposeToBucket(filePurpose) {
        let bucket;

        // Attempt to map;
        this.bucketMap.forEach(obj => {
            if (obj.filePurposes.includes(filePurpose)) {
                // eslint-disable-next-line prefer-destructuring
                bucket = obj.bucket;
            }
        });

        return bucket;
    }

    /**
     * @description Returns the absolute file URI based on its object name..
     *
     * @param    {String} filename    The name of the file for which to attain ab absolute URI.
     * @param    {String} filePurpose The purpose associated with the file.
     * @returns  {String} The absolute file URI.
     * @memberof FileStorageAdapter
     */
    getAbsoluteFileURI(filename, filePurpose) {
        const bucket = this._mapFilePurposeToBucket(filePurpose);

        if (!bucket) throw new Error(`Could not attain an absolute URI from file purpose ${filePurpose}!`);

        return `http://${bucket}.${this.partialFileURIPostfix}/${filename}`;
    }

    /**
     * @description Returns the relative file URI based on it's absolute URI.
     *
     * @param   {String} absoluteURI The absolute URI (filename within URL).
     * @returns {String} The filename.
     * @memberof FileStorageAdapter
     */
    getFilename(absoluteURI) {
        return absoluteURI.replace(absoluteURI.substring(0, absoluteURI.lastIndexOf(this.partialFileURIPostfix) + this.partialFileURIPostfix.length), '');
    }
}

// Enumerations - File Access.
FileStorageAdapter.prototype.FileAccess = Object.freeze({
    Public: 'public-read',
    Private: 'private'
});

// Enumerations - File Purpose.
FileStorageAdapter.prototype.FilePurpose = Object.freeze({ // Don't really care for indices/values. Emulate zero based index.
    AvatarImage: 'avatar-image', 
    TaskImage: 'task-image'
});

module.exports = FileStorageAdapter;