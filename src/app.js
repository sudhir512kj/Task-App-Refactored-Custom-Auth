/*
 * File: app.js (src/app.js)
 *
 * Description: This file handles the main operations of the server. It sets up Express and its middleware and handles all data. Additionally, it defines
 * CRUD Routes and configures Dependency Injection into each route.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 04:18 PM (Local), 09:18 PM (Zulu)
 */

const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');

// Dependency Injection
const { scopePerRequest } = require('awilix-express');

// Middleware
const handleErrors = require('./api/middleware/handle-errors');

// Delegate errors in async endpoints to be handled by middleware.
require('express-async-errors');

// Routes - User & Task
const userRoutes = require('./api/routes/user');
const taskRoutes = require('./api/routes/task');

// Application Factory to ease Dependency Injection in tests.
module.exports = container => {
    // Create the Express Application.
    const app = express();

    // Express Middleware.
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(mongoSanitize());

    // Awilix Dependency Injection.
    app.use(scopePerRequest(container));

    // Routes - Users & Task
    app.use('/api/v1/users', userRoutes);
    app.use('/api/v1/tasks', taskRoutes);

    // This needs to come last to handle errors.
    app.use(handleErrors);

    return app;
};