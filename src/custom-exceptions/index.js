/*
 * File: index.js (src/custom-exceptions/index.js)
 *
 * Description: Throughout the application's layers, different errors can occur in different places. The Controller at POST /users, for example, is going to
 * to have to do two things - it'll call the Admin Adapter and verify the Auth Bearer Token. Then, it'll call the UserService function for signing up new
 * users, and pass it to the correct ID and User Body. This UserService function is going to call the UserRepository to actually perform the database CRUD
 * operations. 
 * 
 * In the event that, say, Mongoose throws an error due to validation, the repository has to catch that error. When it does, it'll make a determination
 * about what needs to happen from there - more than likely, it'll throw a custom ValidationError (defined in this file) up. That will get caught and
 * re-thrown by the Service Layer, and that thrown error will be handled by Controller/Express Middleware. Additionally, when validating the Authorization
 * Bearer Token in the Controller, the Admin Adapter could throw an AuthenticationError, which, again, would be caught by Express Middleware.
 * 
 * Here, we have an ApplicationError that extends Error, does some simple work, and provides custom properties. All other errors extend our custom
 * ApplicationError, so they inherit from Error too.
 * 
 * I intentionally don't include an InternalServerError (which would be 500) because I want the Exception Middleware for Express to return a 500 catch-all
 * if error.data.custom exists and is equal to true. With the Error Classes created in this way, the Exception Middleware can simply look at the error
 * object, check if error.data.custom && error.data.custom === true, and then respond with an error to the client by just pulling message and statusCode off
 * the class objects. Otherwise, if !error.data.custom, then we can just respond with 500 to the client.
 * 
 * Created by Jamie Corkhill on 07/28/2019 at [unknown]
 */

/**
 * @description The main parent class for all of our custom errors.
 *
 * @class   ApplicationError
 * @extends {Error}
 */
class ApplicationError extends Error {
    constructor(err, message) {
        super(message);

        // Log the error. // TODO: Logging needs to happen right here.

        // We'll need the message to be global.
        this.message = message;

        // Housekeeping procedures (errors need a name) and clip this constructor invocation from the stack trace.
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * @description Generates the properties used on all of our custom errors.
     *
     * @returns An object containing properties used by all errors that extend this class.
     * @memberof ApplicationError
     */
    getGlobalProperties() {
        // We'll use custom in our route/controller middleware to decide what to return to the user.
        return { custom: true, message: this.message }; // This is why message is global on `this`.
    }
}

/**
 * @description Handles errors relating to Authentication with status code 401.
 *
 * @class   AuthenticationError
 * @extends {ApplicationError}
 */
class AuthenticationError extends ApplicationError {
    constructor(err, message) {
        // An AuthenticationError does not have to be extremely detailed - in most cases, it won't be.
        const msg = message !== undefined ? message : 'Please authenticate!';
        super(err, msg);

        // Provide the error details, we have 401.
        this.data = { type: 'Auth', statusCode: 401, ...super.getGlobalProperties() };
    }
}

/**
 * @description Handles errors having to do with Validation with status code 400.
 *
 * @class   ValidationError
 * @extends {ApplicationError}
 */
class ValidationError extends ApplicationError {
    constructor(err, msg) {
        super(err, !msg ? 'A field is missing or invalid, or updates are invalid, or a file is invalid! The action can not be completed with the data or request body provided.' : msg);

        // Provide the error details, we have 400.
        this.data = { type: 'Validation', statusCode: 400, ...super.getGlobalProperties() };
    }
}

/**
 * @description Handles errors having to do with Resources Not Found with status code 404.
 *
 * @class   ResourceNotFoundError
 * @extends {ApplicationError}
 */
class ResourceNotFoundError extends ApplicationError {
    constructor(err, resource) {
        const msg = resource ? `Resource "${resource}" was not found.` : 'Resource not found.';
        super(err, msg);

        // Provide the error details, we have 404.
        this.data = { type: 'Resource Not Found', statusCode: 404, ...super.getGlobalProperties() };
    }
}

/**
 * @description Handles errors having to do with Resources Not Found with status code 404.
 *
 * @class   ResourceNotFoundError
 * @extends {ApplicationError}
 */
class ImageProcessingError extends ApplicationError {
    constructor(err) {
        super(err, 'Could not upload image.');

        // Provide the error details, we have 500.
        this.data = { type: 'Image Processing', statusCode: 500, ...super.getGlobalProperties() };
    }
}

module.exports = {
    ApplicationError,
    AuthenticationError,
    ValidationError,
    ResourceNotFoundError,
    ImageProcessingError,
};
