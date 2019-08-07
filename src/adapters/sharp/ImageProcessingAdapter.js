/*
 * File: ImageProcessingAdapter.js (src/adapters/sharp/ImageProcessingAdapter.js)
 *
 * Description: Wraps the API provided by Sharp into something the rest of the application can use without breaking DRY Principles.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 10:40 PM (Local), 07/29/2019 at 03:40 AM (Zulu)
 */

const { ImageProcessingError } = require('./../../custom-exceptions/index');

/**
 * @description An adapter for the Image Processing Dependency
 *
 * @class ImageProcessingAdapter
 */
class ImageProcessingAdapter {
    constructor({ sharp }) {
        // Dependency Injection
        this.sharp = sharp;
    }

    /**
     * @description Converts an image to a particular type with optional options, and resizes to a specified size, returning a buffer.
     *
     * @param {*} type       The image type/extension to convert to.
     * @param {*} extOptions Options for the extension conversion.
     * @param {*} size       An object containing a size and width property.
     * @returns The processed image as a buffer.
     * @memberof ImageProcessingAdapter
     */
    async resizeImageAndConvertToType(originalBuffer, type, extOptions, size) {
        try {
            return await this.sharp(originalBuffer)[type](extOptions).resize(size).toBuffer();
        } catch (err) {
            throw new ImageProcessingError(err);
        }
    }
}

module.exports = ImageProcessingAdapter;