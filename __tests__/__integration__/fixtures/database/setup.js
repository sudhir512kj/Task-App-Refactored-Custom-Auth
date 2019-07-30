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
    _id: testUserID,
    name: 'Alan Turing',
    email: 'alan@domain.com',
    password: 'a hashed password (test user)',
    tokens: [{
        token: jwt.sign({ _id: testUserID }, process.env.JWT_SECRET)
    }]
};

/* -------------------- Configuration Functions -------------------- */

const configureDatabase = async () => {
    await User.deleteMany();
};

module.exports = {
    // Users
    testUser,
    // Configuration
    configureDatabase
};