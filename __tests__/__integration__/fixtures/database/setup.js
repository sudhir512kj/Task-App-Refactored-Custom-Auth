/*
 * File: setup.js (__tests__/__integration__/fixtures/database/setup.js)
 *
 * Description: This file exports particular fixtures and sets up seed data for DB-related integration tests.
 * 
 * Created by Jamie Corkhill on 07/30/2019 at 01:44 AM (Local), 06:44 AM (Zulu)
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
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
const userOne = {
    _id: userOneID,
    name: 'Richard P. Feynman',
    email: 'richard@domain.com',
    password: 'a hashed password (user one)',
    tokens: [{
        token: jwt.sign({ _id: userOneID }, process.env.JWT_SECRET)
    }]
};

/* -------------------- Configuration Functions -------------------- */

const configureDatabase = async () => {
    await User.deleteMany();
    await new User(userOne).save();
};

const cleanDatabaseResultObject = user => {
    // eslint-disable-next-line no-unused-vars
    const { __v, createdAt, updatedAt, ...rest } = user;
    return rest;
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
    userOne,
    // Configuration
    configureDatabase,
    cleanDatabaseResultObject,
    getDefaultProperties
};