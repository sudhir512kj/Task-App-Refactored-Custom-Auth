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
        this.bucketMap = [{
            bucket: appConfig.cloudStorage.buckets.getMainBucket(),
            types: ['avatar']
        }];
    }

    static _decodeNamespace(namespace) {
        // Attempt to match the namespace.
        if (/^(public|private|null):([a-z]+):([\w/]+).([a-z]+)$/.test(namespace) === false) {
            throw new Error(`${namespace} is not a valid namespace!`);
        }

        // Break down the namespace into its components.
        const separator = ':';
        const accessModifier = namespace.substring(0, namespace.indexOf(separator));
        const fileType = namespace.substring(namespace.indexOf(separator) + 1, namespace.lastIndexOf(separator));
        const objectName = namespace.substring(namespace.lastIndexOf(separator) + 1, namespace.length);

        return {
            accessModifier,
            fileType,
            objectName
        };
    }

    /**
     * @description Provides a promisified interface for file upload to the cloud storage.
     *
     * @param    {Object} params Upload params.
     * @returns  Promise settling with data from the response to the cloud storage service.
     * @memberof FileStorageAdapter
     */
    uploadFile(namespace, buffer) {
        // eslint-disable-next-line consistent-return
        return new Promise((resolve, reject) => {
            const { accessModifier, fileType, objectName } = FileStorageAdapter._decodeNamespace(namespace);
            
            const bucket = this._mapFileTypeToBucket(fileType);

            // Attempt to attain the mimeType from the file.
            const mimeType = mime.lookup(objectName);

            // mime.lookup will return false if a mime-type can't be identified.
            if (mimeType === false) return reject(new Error(`${objectName} is not a valid object name!`));

            // bucket is undefined if the provided type could not be matched.
            if (!bucket) return reject(new Error(`The type ${fileType} is not recognized as a valid file type!`));

            if (accessModifier === 'null') return reject(new Error('The access modifier can not be null for file uploads!'));

            // Performing the upload process.
            this.s3.upload({
                Key: objectName,
                Body: buffer,
                ACL: (accessModifier === 'public' && 'public-read') || (accessModifier === 'private' && 'private'),
                Bucket: bucket,
                ContentType: mimeType
            }, (err, data) => {
                if (err) return reject(err);
                return resolve(data);
            });          
        });
    }

    /**
     * @description Provides a promisified interface for file deletion from cloud storage.
     *
     * @param    {Object} params Deletion params - filename and bucket.
     * @returns  Promise settling with data from the response to the cloud storage service.
     * @memberof FileStorageAdapter
     */
    deleteFile(namespace) {
        // eslint-disable-next-line consistent-return
        return new Promise((resolve, reject) => {
            const { fileType, objectName } = FileStorageAdapter._decodeNamespace(namespace);

            const bucket = this._mapFileTypeToBucket(fileType);

            if (!bucket) return reject(new Error(`The type ${fileType} is not recognized as a valid file type!`));

            this.s3.deleteObject({
                bucket,
                Key: objectName
            }, (err, data) => {
                if (err) return reject(err);
                return resolve(data);
            });
        });
    }

    _mapFileTypeToBucket(type) {
        let bucket;

        // Attempt to map;
        this.bucketMap.forEach(obj => {
            if (obj.types.includes(type)) {
                // eslint-disable-next-line prefer-destructuring
                bucket = obj.bucket;
            }
        });

        return bucket;
    }

    /**
     * @description Returns the absolute file URI based on its relative key.
     *
     * @param    {String} type The file type.
     * @param    {String} objectName The full name of the file.
     * @returns  {String} The absolute file URI.
     * @memberof FileStorageAdapter
     */
    getAbsoluteFileURI(objectName, type) {
        const bucket = this._mapFileTypeToBucket(type);

        if (!bucket) throw new Error(`Could not attain an absolute URI from file type ${type}!`);

        return `http://${bucket}.${this.partialFileURIPostfix}/${objectName}`;
    }

    /**
     * @description Returns the relative file URI based on it's absolute URI.
     *
     * @param   {String} absoluteURI The absolute URI.
     * @returns {String} The relative URI.
     * @memberof FileStorageAdapter
     */
    getRelativeFileURI(absoluteURI) {
        return absoluteURI.replace(absoluteURI.substring(0, absoluteURI.lastIndexOf(this.partialFileURIPostfix) + this.partialFileURIPostfix.length), '');
    }
}

module.exports = FileStorageAdapter;