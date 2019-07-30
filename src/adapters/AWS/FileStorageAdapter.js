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
class FileStorageAdapter {
    constructor({ aws, appConfig }) {
        // Dependency Injection
        this.s3 = new aws.S3();
        this.appConfig = appConfig;
        this.partialFileURI = `http://${this.appConfig.cloudStorage.buckets.getMainBucket()}.s3.us-west-2.amazonaws.com`;
    }

    /**
     * @description Provides a promisified interface for file upload to the cloud storage.
     *
     * @param    {Object} params Upload params.
     * @returns  Promise settling with data from the response to the cloud storage service.
     * @memberof FileStorageAdapter
     */
    uploadFile(params) {
        return new Promise((resolve, reject) => {
            this.s3.upload(params, (err, data) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }

    /**
     * @description Provides a promisified interface for file upload to the cloud storage.
     *
     * @param    {Object} params Upload params.
     * @returns  Promise settling with data from the response to the cloud storage service.
     * @memberof FileStorageAdapter
     */
    deleteFile(params) {
        return new Promise((resolve, reject) => {
            this.s3.deleteObject(params, (err, data) => {
                if (err) return reject(err);
                return resolve(data);
            });
        });
    }

    /**
     * @description Returns the absolute file URI based on its relative key.
     *
     * @param    {String} key Relative key.
     * @returns  {String} The absolute file URI.
     * @memberof FileStorageAdapter
     */
    getAbsoluteFileURI(key) {
        return `${this.partialFileURI}/${key}`;
    }

    /**
     * @description Returns the relative file URI based on it's absolute URI.
     *
     * @param   {String} absoluteURI The absolute URI.
     * @returns {String} The relative URI.
     * @memberof FileStorageAdapter
     */
    getRelativeFileURI(absoluteURI) {
        return absoluteURI.replace(`${this.partialFileURI}/`, '');
    }
}

module.exports = FileStorageAdapter;