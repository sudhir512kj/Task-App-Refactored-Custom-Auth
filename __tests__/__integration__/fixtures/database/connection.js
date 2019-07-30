/*
 * File: connection.js (__tests__/__integration__/fixtures/database/connection.js)
 *
 * Description: This file contains global Jest setup and teardown operations for integration tests as to patch memory leaks.
 * 
 * Created by Jamie Corkhill on 07/30/2019 at 01:44 AM (Local), 06:44 AM (Zulu)
 * 
 */

// This factory function will create a new database connection.
const connectionFactory = require('./../../../../src/db/mongoose');

/**
 * @description This higher-order-function (HOF) performs the initial boilerplate setup and custom configuration for the database upon 
 *     which a test suite is being coded against. It will create a Mongoose connection object on port 4000 and a disposable web server
 *     for testing, to which a request agent is bound, by default. Optionally, it takes a function that allows you to futher customize the
 *     database setup, such as adding or removing document/record fixtures, etc.
 *
 * @param   {Object}   app               Express Application
 * @param   {Object}   request           request object from Supertest
 * @param   {Function} configureDatabase Optional setup callback function for the test suite
 * @returns {Object}   An object containing the Supertest Agent, the disposable web server, and the Mongoose connection object.
 */
const configureServerAndDatabaseConnectionForJestSetup = async (app, request, configureDatabase) => {
    // An arbitrary Express Server.
    let server;

    // Create the connection and call the configureDatabase function to configure test data if not null.
    const connection = await connectionFactory();
    if (configureDatabase) configureDatabase();

    // Create a disposable web server for testing.
    await new Promise((resolve, reject) => {
        server = app.listen(4000, err => {
            if (err) return reject(err);
            return resolve();
        });
    });

    // Bind the server to the agent.
    const agent = request.agent(server);

    return { agent, server, connection };
};

/**
 * @description This function will tear down the Jest testing environment, meaning that if there is an open connection to the database (an open socket),
 *     the connection will be closed. If the temporary web server is open and bound to a port, the web server will be disposed. This tear down function
 *     servers to free allocated memory from the heap and prevent testing related memory leaks.
 *
 * @param {Object} connection The Mongoose connection object.
 * @param {Object} server     The disposable web server.
 */
const tearDownServerAndDatabaseConnectionForJest = async (connection, server) => {
    // If there is an open connection (an open socket), then disconnect from it to free allocated memory on the heap.
    if (connection) await connection.disconnect();

    // Dispose (close) of the temporary web server.
    await new Promise((resolve, reject) => server.close(err => {
        if (err) return reject(err);
        return resolve();
    }));
};

module.exports = {
    configureServerAndDatabaseConnectionForJestSetup,
    tearDownServerAndDatabaseConnectionForJest
};