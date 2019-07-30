/*
 * File: user.js (__tests__/__integration__/src/api/routes/user.test.js)
 *
 * Description: Houses Integration Test cases for the User Routes.
 * 
 * Created by Jamie Corkhill on 07//2019 at 01:53 AM (Local), 06:53 AM (Zulu)
 */

const supertest = require('supertest');
const awilix = require('awilix');
const jwt = require('jsonwebtoken');

// Express Application
const appFactory = require('./../../../../../src/app');

// Custom Exceptions
const { 
    AuthenticationError,
    ValidationError 
} = require('./../../../../../src/custom-exceptions/index');

// Functions to configure server and database server connections.
let agent, server, connection;
const {
    configureServerAndDatabaseConnectionForJestSetup,
    tearDownServerAndDatabaseConnectionForJest
} = require('./../../../fixtures/database/connection');

// Awilix Dependency Injection Container
// eslint-disable-next-line import/newline-after-import
const containerFactory = require('./../../../../../src/container/container-factory');
const container = containerFactory();

// Models - User
const User = require('./../../../../../src/models/user');

// Database Fixtures
const {
    // Database Configuration Functions
    configureDatabase,
    cleanDatabaseResultObject,
    getDefaultProperties,
    // Fixture Data
    testUser,
    userOne
} = require('./../../../fixtures/database/setup');

// ---------- Mocks ---------- */

// #region Mocks
// #region BCrypt Mock
const bcryptMock = {
    hash: () => Promise.resolve('hashed-password')
};
// #endregion
// #endregion

/* ---------- Hooks ---------- */

// Hooks - Before All
beforeAll(async () => {
    // Configure server and database connections.
    // eslint-disable-next-line no-extra-semi
    ;({ agent, server, connection } = await configureServerAndDatabaseConnectionForJestSetup(appFactory(container), supertest));
});

// Hooks - Before Each
beforeEach(async () => {
    await configureDatabase();
});

// Hooks - After All
afterAll(async () => tearDownServerAndDatabaseConnectionForJest(connection, server));

/* ==================== Integration Test Cases ==================== */

describe('User Sign Up', () => {
    const ROUTE = '/api/v1/users';

    // #region Local Supertest/Server Setup for this Describe-Block
    let localAgent, localServer, localApp;

    beforeAll(done => {
        // Attain a clean container for the tests in this describe block.
        const localContainer = containerFactory();

        // Register mocks on this local container.
        localContainer.register({
            bcrypt: awilix.asValue(bcryptMock)
        });

        // Setup the Express App for this describe block only.
        localApp = appFactory(localContainer);
        localServer = localApp.listen(done);
        localAgent = supertest.agent(localServer);
    });

    afterAll(done => localServer.close(done));
    // #endregion

    // Test user body.
    const userBody = {
        name: 'Alan Turing',
        email: 'alan@domain.com',
        password: 'Turing-Completeness',
    };

    test('Should sign up a user correctly', async () => {
        // Assert HTTP Response Status 201 Created.
        const response = await localAgent
            .post(ROUTE)
            .send({ user: userBody })
            .expect(201);

        // Attempt to find the user in the database.
        const user = await User.findById(response.body.user._id);

        // Remove timestamp, version and token fields from user object.
        // eslint-disable-next-line no-unused-vars
        const { tokens, ...cleanUser } = cleanDatabaseResultObject(user.toJSON());

        // The expected user result object.
        const expectedUser = {
            ...getDefaultProperties(),
            ...userBody,
            _id: response.body.user._id,
            password: 'hashed-password',
        };

        // Assert that the user from the database contains the correct fields.
        expect(cleanUser).toEqual(expectedUser);

        // Assert that the user's token from the database decodes to have the correct data.
        expect(user.tokens.length).toBe(1);
        expect(jwt.verify(user.tokens[0].token, process.env.JWT_SECRET)).toMatchObject({ _id: response.body.user._id });

        // Assert that the response contains the correct data.
        delete expectedUser.password;
        expect(response.body).toEqual({
            user: expect.any(Object),
            token: tokens[0].token
        });
        expect(cleanDatabaseResultObject(response.body.user)).toEqual(expectedUser);
    });

    test('Should not sign up a user with invalid body data', async () => {
        // Assert HTTP Response Status 400 Bad Request
        const response = await agent
            .post(ROUTE)
            .send({
                user: {
                    ...userBody,
                    age: 'age'
                }
            })
            .expect(400);

        // Assert that no data was added to the database.
        const user = await User.findOne({ ...userBody });
        expect(user).toBe(null);

        // Assert that the response contains an error.
        expect(response.body).toEqual({
            error: new ValidationError().message
        });
    });

    test('Should not sign up a user if an email address already exists', async () => {
        // Assert HTTP Response Status 400 Bad Request
        const response = await agent
            .post(ROUTE)
            .send({
                user: {
                    ...userBody,
                    email: userOne.userOneBody.email
                }
            })
            .expect(400);

        // Assert that no data was added to the database.
        const user = await User.findOne({ ...userBody, email: userOne.userOneBody.email });
        expect(user).toBe(null);

        // Assert that the response contains an error.
        expect(response.body).toEqual({
            error: 'The provided email address is already in use.'
        });
    });

    test('Should not sign up a user with an invalid email', async () => {
        // Assert HTTP Response Status 400 Bad Request
        const response = await agent
            .post(ROUTE)
            .send({
                user: {
                    ...userBody,
                    email: 'userdomain.com' // missing @, should throw.
                }
            })
            .expect(400);

        // Assert that no data was added to the database.
        const user = await User.findOne({ ...userBody });
        expect(user).toBe(null);

        // Assert that the response contains an error.
        expect(response.body).toEqual({
            error: new ValidationError().message
        });
    });
});


describe('User Login', () => {
    const ROUTE = '/api/v1/users/login';
    test('Should login an existing user', async () => {
        // Assert HTTP Response Status 200 OK.
        const response = await agent
            .post(ROUTE)
            .send({
                credentials: {
                    email: userOne.userOneBody.email,
                    password: userOne.passwordPlain
                }
            })
            .expect(200);

        // Attempt to find the user in the database.
        const user = await User.findById(userOne.userOneBody._id);

        // Remove the timestamp and version from the user object.
        const cleanUser = cleanDatabaseResultObject(user.toJSON());

        // The expected result object.
        const expectedUser = {
            ...getDefaultProperties(),
            ...userOne.userOneBody,
            _id: userOne.userOneBody._id.toString(),
            password: userOne.passwordHashed,
            tokens: expect.any(Array)
        };

        // Assert that the user contains the correct data.
        expect(cleanUser).toEqual(expectedUser);

        // Assert that the tokens are correct.
        expect(cleanUser.tokens.length).toBe(2);
        expect(cleanUser.tokens[1].token).toEqual(expect.any(String));
        cleanUser.tokens.forEach(({ token }) => expect(jwt.verify(token, process.env.JWT_SECRET)).toMatchObject({ _id: cleanUser._id.toString() }));

        // Assert that the response contains the correct data.
        delete expectedUser.password;
        delete expectedUser.tokens;
        expect(response.body).toEqual({
            user: expect.any(Object),
            token: cleanUser.tokens[1].token
        });
        expect(cleanDatabaseResultObject(response.body.user)).toEqual(expectedUser);
    });
});