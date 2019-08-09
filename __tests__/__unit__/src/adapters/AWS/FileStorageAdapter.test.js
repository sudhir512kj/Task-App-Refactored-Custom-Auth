/*
 * File: FileStorageAdapter.test.js (__tests__/__unit__/src/adapters/AWS/FileStorageAdapter.test.js)
 *
 * Description: Houses Unit test cases for functions within the FileStorageAdapter.
 * 
 * Created by Jamie Corkhill on 08/08/2017 at 11:11 PM (Local), 08/09/2019 at 04:11 AM (Zulu)
 */
const aws = require('mock-aws-s3');
const fs = require('fs');

// SUT:
const FileStorageAdapter = require('./../../../../../src/adapters/AWS/FileStorageAdapter');

const appConfig = require('./../../../../../src/config/application/config');
const { FilePurpose, FileAccess } = require('./../../../../../src/constants/file-storage');

aws.config.basePath = `${__dirname}/../../../../../tmp/buckets/unit-testing`;

// Spys
const spys = {
    upload: null,
    deleteObject: null
};

// AWS Mock
const mockFactory = (spyMaker) => ({
    // eslint-disable-next-line object-shorthand, func-names
    S3: function () {
        const mockInstance = aws.S3({
            params: { 
                Bucket: appConfig.cloudStorage.buckets.getMainBucket()
            }
        });

        if (!spyMaker) {
            spys.upload = jest.spyOn(mockInstance, 'upload');
            spys.deleteObject = jest.spyOn(mockInstance, 'deleteObject');
        } else {
            spyMaker(mockInstance);
        }
        
        return mockInstance;
    } 
});

describe('#constructor', () => {
    test('Properties on the FileStorageAdapter class instance should be correctly set in the constructor', () => {
        // eslint-disable-next-line object-shorthand, func-names
        const testAws = { S3: function () {} };

        // System Under Test
        const fileStorageAdapter = new FileStorageAdapter({ aws: testAws, appConfig });

        // Assert that properties were correctly set:
        expect(fileStorageAdapter.s3).toEqual(new testAws.S3());
        expect(fileStorageAdapter.appConfig).toEqual(appConfig);
        expect(fileStorageAdapter.partialFileURIPostfix).toEqual('s3.us-west-2.amazonaws.com');
        expect(fileStorageAdapter.bucketMap).toEqual([{
            bucket: appConfig.cloudStorage.buckets.getMainBucket(),
            filePurposes: [
                FilePurpose.AvatarImage, 
                FilePurpose.TaskImage
            ]
        }]);
    });
});

describe('#uploadFile', () => {
    test('Should resolve with the correct data and call the mock function', async () => {
        const fileStorageAdapter = new FileStorageAdapter({ aws: mockFactory(), appConfig });

        // System Under Test:
        const result = await fileStorageAdapter.uploadFile({
            content: Buffer.from('fake content'),
            filename: 'my-content.jpg',
            filePurpose: FilePurpose.AvatarImage,
            fileAccess: FileAccess.Public
        });

        // Assert that the mock was called correctly.
        expect(spys.upload).toHaveBeenCalledTimes(1);
        expect(spys.upload).toHaveBeenCalledWith({
            Key: 'my-content.jpg',
            Body: Buffer.from('fake content'),
            ACL: FileAccess.Public,
            Bucket: 'jamie-first-test-bucket',
            ContentType: 'image/jpeg'
        }, expect.any(Function)); // Second arg is the callback function.

        // Assert that the result contains the correct data.
        expect(result).toEqual({
            filename: 'my-content.jpg',
            contentType: 'image/jpeg',
            content: Buffer.from('fake content')
        });
    });

    test('Should reject and return correct err', async () => {
        const fileStorageAdapter = new FileStorageAdapter({ aws: mockFactory(mockInstance => {
               jest.spyOn(mockInstance, 'upload').mockImplementationOnce((obj, cb) => cb('err', null));
            }), 
            appConfig 
        });

        // System Under Test:
        await expect(fileStorageAdapter.uploadFile({
            content: 'content',
            filename: 'filename.txt',
            filePurpose: FilePurpose.AvatarImage,
            fileAccess: FileAccess.Private
        })).rejects.toEqual('err');
    });

    test('Should error out if no mimetype can be determined', async () => {
        await expect(new FileStorageAdapter({ aws, appConfig }).uploadFile({ 
            content: 'content', 
            filename: null, 
            filePurpose: FilePurpose.AvatarImage, 
            fileAccess: FileAccess.Public 
        })).rejects.toEqual(new Error(`${null} is not a valid file name!`));
    });

    test('Should error out if no bucket can be determined', async () => {
        await expect(new FileStorageAdapter({ aws, appConfig }).uploadFile({ 
            content: 'content', 
            filename: 'test.txt', 
            filePurpose: 'data', 
            fileAccess: FileAccess.Private 
        })).rejects.toEqual(new Error(`The purpose ${'data'} is not recognized as a valid file purpose!`));
    });

    test('Should error out if invalid content is provided.', async () => {
        await expect(new FileStorageAdapter({ aws, appConfig }).uploadFile({ 
            content: null, 
            filename: 'test.txt', 
            filePurpose: FilePurpose.TaskImage, 
            fileAccess: FileAccess.Private 
        })).rejects.toEqual(new Error('File content is required!'));
    });

    test('Should error out if an invalid file accessor is provided.', async () => {
        await expect(new FileStorageAdapter({ aws, appConfig }).uploadFile({ 
            content: 'content', 
            filename: 'test.txt', 
            filePurpose: FilePurpose.AvatarImage, 
            fileAccess: null 
        })).rejects.toEqual(new Error(`${null} is not a valid file accessor!`));
    });
});

describe('#deleteFile', () => {
    test('Should resolve with the correct data and call the mock function', async () => {
        const fileStorageAdapter = new FileStorageAdapter({ aws: mockFactory(), appConfig });

        // System Under Test:
        await fileStorageAdapter.deleteFile('filename', FilePurpose.AvatarImage);

        // Assert that the mock was called correctly.
        expect(spys.deleteObject).toHaveBeenCalledTimes(1);
        expect(spys.deleteObject).toHaveBeenCalledWith({
            Key: 'filename',
            Bucket: 'jamie-first-test-bucket',
        }, expect.any(Function)); // Second arg is the callback function.
    });

    test('Should error out if no bucket can be determined', async () => {
        await expect(new FileStorageAdapter({ aws, appConfig }).deleteFile('filename', 'data'))
            .rejects.toEqual(new Error(`The purpose ${'data'} is not recognized as a valid file purpose!`));
    });

    test('Should error out if no deleteObject fails', async () => {
        await expect(new FileStorageAdapter({ aws, appConfig }).deleteFile('filename', 'data'))
            .rejects.toEqual(new Error(`The purpose ${'data'} is not recognized as a valid file purpose!`));
    });

    test('Should reject and return correct err', async () => {
        const fileStorageAdapter = new FileStorageAdapter({ aws: mockFactory(mockInstance => {
               jest.spyOn(mockInstance, 'deleteObject').mockImplementationOnce((obj, cb) => cb('err', null));
            }), 
            appConfig 
        });

        // System Under Test:
        await expect(fileStorageAdapter.deleteFile('filename', FilePurpose.AvatarImage)).rejects.toEqual('err');
    });
});

describe('#_mapFilePurposeToBucket', () => {
    test('Should return the correct bucket for an AvatarImage purpose', () => {
        expect(new FileStorageAdapter({ aws, appConfig })._mapFilePurposeToBucket(FilePurpose.AvatarImage))
            .toEqual('jamie-first-test-bucket');
    });

    test('Should return the correct bucket for an TaskImage purpose', () => {
        expect(new FileStorageAdapter({ aws, appConfig })._mapFilePurposeToBucket(FilePurpose.TaskImage))
            .toEqual('jamie-first-test-bucket');
    });

    test('Should return the undefined for an invalid purpose', () => {
        expect(new FileStorageAdapter({ aws, appConfig })._mapFilePurposeToBucket('anything'))
            .toEqual(undefined);
    });
});

describe('#_getAbsoluteFileURI', () => {
    test('Should throw if a Purpose is invalid', () => {
        expect(() => new FileStorageAdapter({ aws, appConfig }).getAbsoluteFileURI('filename', null))
            .toThrow(`Could not attain an absolute URI from file purpose ${null}!`);
    });

    test('Should return a valid absolute URI for a valid filename and purpose', () => {
        const fileStorageAdapter = new FileStorageAdapter({ aws, appConfig });
        expect(fileStorageAdapter.getAbsoluteFileURI('filename', FilePurpose.AvatarImage))
            .toEqual(`http://jamie-first-test-bucket.${fileStorageAdapter.partialFileURIPostfix}/filename`);
    });
});