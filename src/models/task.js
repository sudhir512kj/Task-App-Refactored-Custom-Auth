/*
 * File: (src/models/user.js)
 *
 * Description: This file contains the Schema, Model Definition, and custom middleware for the User Model. This represents the schema of data
 * relating to tasks as they exist in the database.
 * 
 * Created by Jamie Corkhill on 08/01/2019 at 06:14 PM (Local), 08/02/2019 at 12:14 PM (Zulu)
 */

const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;