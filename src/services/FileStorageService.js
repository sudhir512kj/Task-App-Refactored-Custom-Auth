/*
 * File: fileStorageService.js (src/services/fileStorageService.js)
 *
 * Description: Contains service functions to handle the uploading of various files to the cloud storage solution.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 10:32 PM (Local), 07/29/2019 at 03:32 AM (Zulu)
 */

class FileStorageService {
    constructor({ fileProcessingService, fileStorageAdapter }) {
        // Dependency Injection
        this.fileProcessingService = fileProcessingService;
        this.fileStorageAdapter = fileStorageAdapter;
    }

    /*
     * Description: 
     * 1.) Processes the images via the FileProcessingService.
     * 2.) Performs the upload via the FileStorageAdapter.
     */
    /**
     * @description Performs processing and uploading of images.
     *
     * @param    {Buffer} originalAvatarBuffer The avatar image buffer from the client.
     * @param    {String} uid                  The user's ID (UID - User ID, or UUID - Unique User ID)
     * @returns  {Object} Result information from the FileStorageAdapter.
     * @memberof fileStorageService
     */
    async processAndUploadAvatarImage(originalAvatarBuffer, uid) {
        // Attain an array of processed images.
        const processedImages = await this.fileProcessingService.processAvatarImage(originalAvatarBuffer);

        // Upload each image and return with the response array.
        return Promise.all(processedImages.map(({ buffer, type, ext }) => this.fileStorageAdapter
            .uploadFile(`public:avatar:users/${uid}/profile/avatar/avatar_${type}.${ext}`, buffer)));
    }
}

module.exports = FileStorageService;