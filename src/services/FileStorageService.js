/*
 * File: fileStorageService.js (src/services/fileStorageService.js)
 *
 * Description: Performs service functions to handle the uploading of various files to the cloud storage solution.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 10:32 PM (Local), 07/29/2019 at 03:32 AM (Zulu)
 */

class FileStorageService {
    constructor({ fileProcessingService, fileParameterService, fileStorageAdapter }) {
        // Dependency Injection
        this.fileProcessingService = fileProcessingService;
        this.fileParameterService = fileParameterService;
        this.fileStorageAdapter = fileStorageAdapter;
    }

    /*
     * Description:
     * 1.)
     */
    /**
     * @description
     *
     * @param {*} originalAvatarBuffer
     * @param {*} uid
     * @returns
     * @memberof fileStorageService
     */
    async processAndUploadAvatarImage(originalAvatarBuffer, uid) {
        try {
            // Attain an array of processed images.
            const processedImages = await this.fileProcessingService.processAvatarImage(originalAvatarBuffer);

            // Generate the correct parameters for the processed image objects.
            const uploadParams = await this.fileParameterService.generateAvatarImageParameters(processedImages, uid);
            
            // Upload each image and return with the response array.
            return await Promise.all(uploadParams.map(paramObject => this.fileStorageAdapter.uploadFile(paramObject)));
        } catch (err) {
            throw err;
        }
    }

    /**
     * @description
     *
     * @param {*} key
     * @returns
     * @memberof FileStorageService
     */
    async deleteAvatarImage(key) {
        return this.fileStorageAdapter.deleteFile(this.fileParameterService.generateAvatarImageLocaleData(key));
    }
}

module.exports = FileStorageService;