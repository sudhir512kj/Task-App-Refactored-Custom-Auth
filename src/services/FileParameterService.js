/*
 * File: FileParameterService.js (src/services/FileParameterService.js)
 *
 * Description: Performs the required processes to generate upload parameters for all files.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 10:50 PM (Local), 07/29/2019 at 03:50 AM (Zulu)
 */


/**
 * @description Handles file parameter generation for the cloud storage solution.
 *
 * @class FileParameterService
 */
class FileParameterService {
    constructor({ appConfig }) {
        this.appConfig = appConfig;
    }

    /**
     * @description Generates a plain JavaScript object consisting of upload params.
     *
     * @param {String} Bucket      The Bucket in which to store the Body.
     * @param {*}      Body        The data to store.
     * @param {String} Key         A relative path where the Body will be stored in the Bucket.
     * @param {String} ContentType The type of data being
     * @param {String} ACL         Access Control
     * @returns A param object.
     * @memberof FileParameterService
     */
    // eslint-disable-next-line class-methods-use-this
    _generateParamObject(Bucket, Body, Key, ContentType, ACL) {
        return {
            Bucket,
            Body,
            Key,
            ContentType,
            ACL
        };
    }

    /*
     * Description:
     * 1.) Map through processed images and return an array of param objects.
     */  
    /**
     * @description Maps through processed images and returns tailored param objects for each.
     *
     * @param   {Array}  processedImages Array of processed images.
     * @param   {String} uid             Unique User ID
     * @returns Array of parameter images.
     * @memberof FileParameterService
     */
    generateAvatarImageParameters(processedImages, uid) {
        // Iterate through the processedImages and generate upload params.
        return processedImages.map(({ buffer, type, ext, mimeType }) => this._generateParamObject(
            this.generateAvatarImageLocaleData(undefined, type, ext, uid).Bucket,
            buffer,
            this.generateAvatarImageLocaleData(undefined, type, ext, uid).Key,
            mimeType,
            'public-read'
        ));
    }

    /**
     * @description - Generates locale data for an avatar iamge.
     *
     * @param    {String} [key=undefined] (required without `type`, `ext`, and `uid`)
     * @param    {String} type            (required without key) The image type (original, small, large).
     * @param    {String} ext             (required without key) The image extension (e.g, .jpg)
     * @param    {String} uid             (required without key) The user's UID.
     * @returns  {Object} Partial param data including `Key` and `Bucket`.
     * @memberof FileParameterService
     */
    generateAvatarImageLocaleData(key = undefined, type, ext, uid) {
        return {
            Key: key !== undefined ? key : `users/${uid}/profile/avatar/avatar_${type}${ext}`,
            Bucket: this.appConfig.cloudStorage.buckets.getMainBucket()
        };
    }
}

module.exports = FileParameterService;