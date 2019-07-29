/*
 * File: server.js (src/server.js - entry)
 *
 * Description: This file imports the Express application and binds it to a port. It is done this way to permit Unit/Integration Testing via the Supertest
 * library, which requires an Express Application and not an operating web server. We also start the database connection here.
 *
 * Created by Jamie Corkhill on 07/28/2019 at 04:21 PM (Local), 09:21 PM (Zulu)
 */

// Import the database connection factory and fire it.
require('./db/mongoose')();

// Import the Express Application.
const appFactory = require('./app');

// Awilix Dependency Injection Container
const container = require('./container/container-factory')();

// Bind the server to the development port or whatever is available in production.
appFactory(container).listen(process.env.PORT, () => console.log(`Server is up on port ${process.env.PORT}`));