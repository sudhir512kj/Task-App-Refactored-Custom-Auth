/*
 * File: verify-auth.js (src/api/middleware/verify-auth.js)
 *
 * Description: Handles ensuring a user is authenticated to view a resource by checking if their data exists in the database. The exported function
 * additionally places the user on `req` and places it on the container context from Awilix.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 05:01 PM (Local), 10:01 PM (Zulu)
 */

// Dependency Injection
const { inject } = require('awilix-express');

// Custom Exceptions
const { AuthenticationError } = require('./../../custom-exceptions/index');

const verifyAuth = inject(({ authenticationService, userService }) => async (req, res, next) => {
    try {
        // Ensure that the Authorization Bearer Token is valid - if so, decode it.
        const decoded = authenticationService.verifyAuthToken(req.token);

        // Ensure that the user exists in the database by their ID and current token.
        // A ResourceNotFoundError will be thrown if the user does not exist, which will be caught below and an AuthenticationError will be thrown.
        const user = await userService.retrieveUserByQuery({ _id: decoded._id, 'tokens.token': req.token });

        // We have the user now, so register it on the request and in the container (so we can use it in services).
        req.user = user;
        req.container.resolve('context').user = user;

        // Proceed.
        next();
    } catch (err) {
        // Throw either a AuthenticationError (401) or a generic catch-all error (500).
        throw err.name === 'ResourceNotFoundError' ? new AuthenticationError(err) : Error(err);
    }
});

module.exports = verifyAuth;