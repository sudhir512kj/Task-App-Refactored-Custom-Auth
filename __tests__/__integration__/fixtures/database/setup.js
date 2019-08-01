/*
 * File: setup.js (__tests__/__integration__/fixtures/database/setup.js)
 *
 * Description: This file exports particular fixtures and sets up seed data for DB-related integration tests.
 * 
 * Created by Jamie Corkhill on 07/30/2019 at 01:44 AM (Local), 06:44 AM (Zulu)
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sharp = require('sharp');
const awsMock = require('mock-aws-s3');
const fs = require('fs-extra');
const User = require('./../../../../src/models/user');

const appConfig = require('./../../../../src/config/application/config');

/* -------------------- Fixture Data - Users -------------------- */

// Test User
const testUserID = new mongoose.Types.ObjectId();
const testUser = {
    name: 'Alan Turing',
    email: 'alan@domain.com',
    password: 'a hashed password (test user)',
};

// User One
const userOneID = new mongoose.Types.ObjectId();
const passwordPlain = 'useronepassword';
const passwordHashed = bcrypt.hashSync(passwordPlain, 8);
const userOneBody = {
    _id: userOneID,
    name: 'Richard P. Feynman',
    email: 'richard@domain.com',
    password: passwordHashed,
    tokens: [{
        token: jwt.sign({ _id: userOneID }, process.env.JWT_SECRET)
    }]
};

// User Two
const userTwoID = new mongoose.Types.ObjectId();
const passwordPlainUserTwo = 'usertwopassword';
const passwordHashedUserTwo = bcrypt.hashSync(passwordPlainUserTwo, 8);
const userTwoBody = {
    _id: userTwoID,
    name: 'A name',
    email: 'name@domain.com',
    password: passwordHashedUserTwo,
    avatarPaths: {
        original: `users/${userTwoID}/profile/avatar/avatar_original.jpg`,
        small: `users/${userTwoID}/profile/avatar/avatar_small.jpg`,
        large: `users/${userTwoID}/profile/avatar/avatar_large.jpg`,
    },
    tokens: [{
        token: jwt.sign({ _id: userTwoID }, process.env.JWT_SECRET)
    }]
};

/* -------------------- Fixture Data - Files    -------------------- */
const basePath = `${__dirname}/../../../../tmp/buckets`;
const avatarBuffer = fs.readFileSync(`${__dirname}/../../fixtures/files/images/avatar/avatar.jpg`);

const resizeAvatar = async () => {
    // This could be cleaner with iteration on the width and height, but it'll suffice.
    const smallBuffer = await sharp(avatarBuffer).jpeg().resize({ width: 50, height: 50 }).toBuffer();
    const largeBuffer = await sharp(avatarBuffer).jpeg().resize({ width: 100, height: 100 }).toBuffer();

    return {
        smallBuffer,
        largeBuffer
    };
};

const makeUploadParams = (buffer, uid, nameSuffix) => ({
    Body: buffer,
    Key: `users/${uid}/profile/avatar/avatar_${nameSuffix}.jpg`,
    Bucket: appConfig.cloudStorage.buckets.getMainBucket(),
    ContentType: 'image/jpeg',
    ACL: 'public-read'
});

const promisifiedS3PutObject = params => new Promise((resolve, reject) => {
        awsMock.config.basePath = basePath;
        const s3 = awsMock.S3({ params: appConfig.cloudStorage.buckets.getMainBucket() });
        s3.putObject(params, (err, data) => {
            if (err) return reject(err);
            return resolve(data);
        });
    });


/* -------------------- Configuration Functions -------------------- */

const configureDatabase = async () => {
    await User.deleteMany();
    await new User(userOneBody).save();
    await new User(userTwoBody).save();
};

const configureBucket = async () => {
    const { smallBuffer, largeBuffer } = await resizeAvatar();

    await fs.remove(basePath);

    // User Two Avatar Upload
    await promisifiedS3PutObject(makeUploadParams(avatarBuffer, userTwoID, 'original'));
    await promisifiedS3PutObject(makeUploadParams(smallBuffer, userTwoID, 'small'));
    await promisifiedS3PutObject(makeUploadParams(largeBuffer, userTwoID, 'large'));
};

const cleanDatabaseResultObject = user => {
    // eslint-disable-next-line no-unused-vars
    const { __v, createdAt, updatedAt, ...rest } = user;
    // Despite calling toJSON, the MongoDB ObjectID is not cast to a string, which requires this workaround.
    return JSON.parse(JSON.stringify(rest));
};

const getDefaultProperties = () => ({
    avatarPaths: {
        original: 'no-profile',
        small: 'no-profile',
        large: 'no-profile'
    },
    age: 0,
});

module.exports = {
    // Users
    testUser,
    userOne: {
        userOneBody,
        passwordPlain,
        passwordHashed
    },
    userTwo: {
        userTwoBody,
        passwordPlain: passwordPlainUserTwo,
        passwordHashed: passwordHashedUserTwo
    },
    // Images
    avatar: {
        buffer: avatarBuffer
    },
    // Configuration
    configureDatabase,
    configureBucket,
    cleanDatabaseResultObject,
    getDefaultProperties,
    // Other
};