/*
 * File: (src/models/user.js)
 *
 * Description: This file contains the Schema, Model Definition, and custom middleware for the User Model. This represents the schema of data
 * relating to users as they exist in the database.
 * 
 * Created by Jamie Corkhill 07/28/2019 at 04:26 PM (Local), 07/28/2019 at 09:26 PM (Zulu)
 */

const mongoose = require('mongoose');
const validator = require('validator');

// Define the schema.
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid');
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Don\'t be stupid.');
            }
        }
    },
    avatarPaths: {
        original: { type: String, default: 'no-profile' },
        small: { type: String, default: 'no-profile' },
        large: { type: String, default: 'no-profile' }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    // Keep track of last updates and the Unix Timestamp when the profile was created.
    timestamps: true
});

// Create the model.
const User = mongoose.model('User', userSchema);

module.exports = User;