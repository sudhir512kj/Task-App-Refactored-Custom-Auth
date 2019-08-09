/*
 * File: ImageProcessingAdapter.test.js (__tests__/__unit__/src/adapters/sharp/ImageProcessingAdapter.test.js)
 *
 * Description: Houses unit test cases for the ImageProcessingAdapter.
 * 
 * Created by Jamie Corkhill on 08/09/2019 at 12:10 PM (Local), 05:10 PM (Zulu)
 */

// SUT:
const ImageProcessingAdapter = require('./../../../../../src/adapters/sharp/ImageProcessingAdapter');

// Custom Exceptions
const { ImageProcessingError } = require('./../../../../../src/custom-exceptions');

const streamMock = {
    pipe: jest.fn(args => args)
};

describe('#constructor', () => {
    test('Should correctly set the instance properties in the constructor', () => {
        const imageProcessingAdapter = new ImageProcessingAdapter({ sharp: 'sharp' });

        // Assert that the correct properties were set.
        expect(imageProcessingAdapter.sharp).toEqual('sharp');
    });
});

describe('#resizeImageAndCovertToType', () => {
    test('Should correctly call the mocks', async () => {
        // Correct return result mock.
        const mockImpl = {
            jpeg: jest.fn().mockReturnThis(),
            resize: jest.fn().mockReturnThis()
        };
        const sharpMock = jest.fn(() => mockImpl);

        // System Under Test.
        const imageProcessingAdapter = new ImageProcessingAdapter({ sharp: sharpMock });
        const processedStream = await imageProcessingAdapter.resizeImageAndConvertToType(streamMock, 'jpeg', { quality: 100 }, { width: 10, height: 10 });

        // Assert that the mocks were called correctly.
        expect(sharpMock).toHaveBeenCalledTimes(1);
        expect(mockImpl.jpeg).toHaveBeenCalledTimes(1);
        expect(mockImpl.jpeg).toHaveBeenCalledWith({ quality: 100 });
        expect(mockImpl.resize).toHaveBeenCalledTimes(1);
        expect(mockImpl.resize).toHaveBeenCalledWith({ width: 10, height: 10 });
        expect(streamMock.pipe).toHaveBeenCalledWith(sharpMock().jpeg().resize());
        expect(processedStream).toEqual(sharpMock().jpeg().resize());
    });

    test('Should throw an ImageProcessingError if resizing rejects', async () => {
        // Correct return result mock.
        const mockImpl = {
            jpeg: jest.fn(() => new Error()),
            resize: jest.fn().mockReturnThis()
        };
        const sharpMock = jest.fn(() => mockImpl);

        // System Under Test.
        const imageProcessingAdapter = new ImageProcessingAdapter({ sharp: sharpMock });

        await expect(imageProcessingAdapter
            .resizeImageAndConvertToType(streamMock, 'jpeg', { quality: 100 }, { width: 10, height: 10 }))
            .rejects.toEqual(new ImageProcessingError());
    });
});
