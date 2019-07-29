/*
 * File: mongoose.js (src/db/mongoose.js)
 *
 * Description: Exports a connection factory to open a connection (socket) to the database.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 04:51 PM (Local), 09:51 PM (Zulu)
 */

const mongoose = require('mongoose');

// Export a factory function (connectionFactory) Called once at app start to create a connection. Should not be called multiple times.
module.exports = () => mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
});