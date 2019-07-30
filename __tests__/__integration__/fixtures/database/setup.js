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
const User = require('./../../../../src/models/user');

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

/* -------------------- Configuration Functions -------------------- */

const configureDatabase = async () => {
    await User.deleteMany();
    await new User(userOneBody).save();
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
    // Configuration
    configureDatabase,
    cleanDatabaseResultObject,
    getDefaultProperties
};