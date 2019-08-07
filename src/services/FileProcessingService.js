/*
 * File: FileProcessingService.js (/src/services/FileProcessingService.js)
 *
 * Description: Houses business logic regarding file processing/pre-processing.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 10:35 PM (Local), 07/29/2019 at 03:35 AM (Zulu)
 */

class FileProcessingService {
    constructor({ imageProcessingAdapter }) {
        // Dependency Injection
        this.imageProcessingAdapter = imageProcessingAdapter;
    }

    /*
     * Description: 
     * 1.) Define an array to hold the future-pending pending promises, as well as an array of size and type information.
     * 2.) Iterate through the size types and perform resize-and-convert processing.
     * 3.) Await all promises to settle. We could error-out here if something goes wrong.
     * 4.) Iterate through the resolved promises (for which order is preserved), and push each new buffer onto the images array providing the type and extensions.
     * 5.) Return the array or catch error and re-throw.
     */
    /**
     * @description Processes avatar images as required for the application.
     *
     * @param    {Buffer} originalBuffer The original un-altered buffer of the avatar as sent up by the user.
     * @returns  An array of processed image objects.
     * @memberof FileProcessingService
     */
    async processAvatarImage(originalBuffer) {
        try {
            // The processed image array.
            const images = [{ buffer: originalBuffer, type: 'original', ext: 'jpg' }];

            // The sizes to which we'll be converting the images.
            const sizes = [{ w: 50, h: 50, type: 'small' }, { w: 100, h: 100, type: 'large' }];

            // Await all promises to settle.
            const processedImages = await Promise.all(sizes.map(size => this.imageProcessingAdapter.resizeImageAndConvertToJpeg(
                originalBuffer,
                'jpeg',
                { progressive: true, quality: 100 }, // extOptions
                { width: size.w, height: size.h } // size
            )));

            // Build the image objects from the resolved promises. Promise.all is strictly ordered.
            processedImages.forEach((imgBuffer, index) => {
                images.push({
                    buffer: imgBuffer,
                    type: sizes[index].type,
                    ext: 'jpg',
                });
            });

            return images;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = FileProcessingService;