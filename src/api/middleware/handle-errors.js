/*
 * File: handle-errors.js (src/api/middleware/handle-errors.js)
 *
 * Description: Generally, Express Endpoints are filled with try/catch statements. To attempt to remove as much logic as possible from the endpoints, we
 * handle errors separately in this middleware function. The express-async-errors NPM Module will fire this function in the event that any errors are
 * thrown in an endpoint marked async.
 * 
 * This function receives that error and strips the HTTP Data from it, responding with the error message and status code. In the event that the error is not
 * a custom exception thrown by me, we respond with a 500. That is, each custom exception contains a few properties, namely, statusCode, data, and custom.
 * If the error object contains a custom property set to true, we know it's one of our errors. Otherwise, we didn't throw the error and we need to respond
 * with a 500 to the user.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 04:47 PM (Local), 09:47 PM (Zulu)
 */

const handleErrors = (err, req, res, next) => {
    // If the err object has an err.data.custom property, it's one of ours.
    if (err.data && err.data.custom && err.data.custom === true) {
        // The err object already contains the status code and message we want to respond with.
        res.status(err.data.statusCode).send({ error: err.data.message });
    } else {
        // This err is not one of ours.
        res.status(500).send({ error: 'An unexpected error occurred. Internal Server Error.' });
    }
};

module.exports = handleErrors;