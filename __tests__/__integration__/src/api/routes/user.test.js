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
const bcrypt = require('bcrypt');

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

const setupLocalContainerAndServer = registrations => {
    // #region Local Supertest/Server Setup for the Describe-Block
    let localAgent, localServer, localApp;

    const beforeAllSetup = done => {
        // Attain a clean container for the tests in the describe block.
        const localContainer = containerFactory();

        // Register mocks on this local container.
        localContainer.register(registrations);

        // Setup the Express App for this describe block only.
        localApp = appFactory(localContainer);
        localServer = localApp.listen(done);
        localAgent = supertest.agent(localServer);

        return localAgent;
    };

    const afterAllTeardown = (done) => {
        localServer.close(done);
    };
    // #endregion

    return { beforeAllSetup, afterAllTeardown };
};

/* ==================== Integration Test Cases ==================== */

// POST /api/vv1/users
describe('User Sign Up', () => {
    const ROUTE = '/api/v1/users';

    let localAgent;
    const { beforeAllSetup, afterAllTeardown } = setupLocalContainerAndServer({
        bcrypt: awilix.asValue(bcryptMock)
    });

    // eslint-disable-next-line no-return-assign
    beforeAll(done => localAgent = beforeAllSetup(done));
    afterAll(done => afterAllTeardown(done));

    // Test user body.
    const userBody = {
        name: 'Alan Turing',
        email: 'alan@domain.com',
        password: 'Turing-Completeness',
    };

    test('Should sign up a user correctly', async () => {
        // Assert HTTP Response Status 201 Created.
        const response = await localAgent // localAgent for access to the container with mocked dependencies.
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
        // It's safe mutate the expectedUser object here.
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


// POST /api/v1/users/login
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
        // It's safe mutate the expectedUser object here.
        delete expectedUser.password;
        delete expectedUser.tokens;
        expect(response.body).toEqual({
            user: expect.any(Object),
            token: cleanUser.tokens[1].token
        });
        expect(cleanDatabaseResultObject(response.body.user)).toEqual(expectedUser);
    });

    test('Should not login an nonexistent user', async () => {
        // The fake credentials.
        const credentials = {
            email: 'arbitrary@domain.com',
            password: 'not-a-password'
        };

        // Assert HTTP Response 401 Unauthorized.
        const response = await agent
            .post(ROUTE)
            .send({ credentials })
            .expect(401);

        // Assert that no user was added to the database.
        const user = await User.findOne(credentials);
        expect(user).toBe(null);

        // Assert that the response contains the correct data.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });
    });

    test('Should return an HTTP 400 if incorrect data is sent', async () => {
        // Assert HTTP Response Status 400 Bad Request.
        const response = await agent
            .post(ROUTE)
            .send()
            .expect(400);

        // Assert that the response contains the correct data.
        expect(response.body).toEqual({
            error: new ValidationError().message
        });
    });
});

// POST /api/v1/users/logout
describe('User Logout of Session', () => {
    const ROUTE = '/api/v1/users/logout';
    test('Should correctly log out a user of a single session', async () => {
        // Assert HTTP Response Status 200 OK.
        await agent
            .post(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send()
            .expect(200);

        // Attempt to find the user in the database.
        const user = await User.findById(userOne.userOneBody._id);

        // Remove the timestamp and version fields from the user object.
        const cleanUser = cleanDatabaseResultObject(user.toJSON());

        // Assert that the user contains the correct data. (i.e, not the token we were signed in with, evident by the Auth Bearer Token above.)
        expect(cleanUser).toEqual({
            ...getDefaultProperties(),
            ...userOne.userOneBody,
            _id: userOne.userOneBody._id.toString(),
            tokens: expect.not.arrayContaining([userOne.userOneBody.tokens[0]])
        });
    });

    test('Should not log out a user if that user does not have a valid Bearer Token', async () => {
        // Assert HTTP Response Status 401 Unauthorized.
        const response = await agent
            .post(ROUTE)
            .set('Authorization', 'Bearer 123')
            .send()
            .expect(401);

        // Assert that the response contains the correct error.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });
    });
});

// POST /api/v1/users/logoutAll
describe('User Logout of all Sessions', () => {
    const ROUTE = '/api/v1/users/logoutAll';
    test('Should correctly log out a user of all sessions', async () => {
        // Assert HTTP Response Status 200 OK.
        await agent
            .post(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send()
            .expect(200);

        // Attempt to find the user in the database.
        const user = await User.findById(userOne.userOneBody._id);

        // Remove the timestamp and version fields from the user object.
        const cleanUser = cleanDatabaseResultObject(user.toJSON());

        // Assert that the user contains the correct data. (i.e, not the token we were signed in with, evident by the Auth Bearer Token above.)
        expect(cleanUser).toEqual({
            ...getDefaultProperties(),
            ...userOne.userOneBody,
            _id: userOne.userOneBody._id.toString(),
            tokens: []
        });
    });

    test('Should not log out a user if that user does not have a valid Bearer Token', async () => {
        // Assert HTTP Response Status 401 Unauthorized.
        const response = await agent
            .post(ROUTE)
            .set('Authorization', 'Bearer 123')
            .send()
            .expect(401);

        // Assert that the response contains the correct error.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });
    });
});

// GET /api/v1/users/me
describe('Read User Profile', () => {
    const ROUTE = '/api/v1/users/me';
    test('Should correctly return user profile information for an authenticated user', async () => {
        // Assert HTTP Response Status 200 OK
        const response = await agent
            .get(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send()
            .expect(200);

        // Assert that the response contains the correct data.
        expect(response.body).toEqual({ user: expect.any(Object) });
        expect(cleanDatabaseResultObject(response.body.user)).toEqual({
            ...getDefaultProperties(),
            ...Object.keys(userOne.userOneBody) // It's ugly but it works, so I'll take it. - Jamie.
                .filter(key => key !== 'tokens' && key !== 'password')
                .reduce((obj, key) => ({ ...obj, [key]: userOne.userOneBody[key] }), {}),
            _id: userOne.userOneBody._id.toString(),
        });
    });

    test('Should not return profile information for an unauthenticated user', async () => {
        // Assert HTTP Response Status 401 Unauthorized
        const response = await agent
            .get(ROUTE)
            .send()
            .expect(401);

        // Assert that the response contains the correct error.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });
    });
});

describe('Update User Profile', () => {
    const ROUTE = '/api/v1/users/me';

    let localAgent;
    const { beforeAllSetup, afterAllTeardown } = setupLocalContainerAndServer({
        bcrypt: awilix.asValue(bcryptMock)
    });

    // eslint-disable-next-line no-return-assign
    beforeAll(done => localAgent = beforeAllSetup(done));
    afterAll(done => afterAllTeardown(done));

    test('Should update a user profile if the updates are valid and the user is authenticated', async () => {
        // Requested valid updates.
        const updates = {
            name: 'New Name',
            email: 'newemail@domain.com',
            age: 18,
        };
        
        // Assert HTTP Response Status 200 OK.
        const response = await agent
            .patch(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send({ updates })
            .expect(200);

        // Attempt to find the user in the database.
        const user = await User.findById(userOne.userOneBody._id);

        // Remove the version and timestamp fields from the database result object.
        const cleanUser = cleanDatabaseResultObject(user.toJSON());

        // The expected result object.
        const expectedUser = {
            ...getDefaultProperties(),
            ...userOne.userOneBody,
            ...updates,
            _id: userOne.userOneBody._id.toString(),
            tokens: [{
                _id: expect.any(String),
                token: userOne.userOneBody.tokens[0].token
            }]
        };

        // Assert that the user contains the correct data.
        expect(cleanUser).toEqual(expectedUser);

        // Assert that the result contains the correct data.
        // It's safe mutate the expectedUser object here.
        delete expectedUser.tokens;
        delete expectedUser.password;
        expect(response.body).toEqual({ user: expect.any(Object) });
        expect(cleanDatabaseResultObject(response.body.user)).toEqual(expectedUser);
    });

    test('Should rehash an updated user\'s password if other updates are valid and if the user is authenticated', async () => {
        // Requested valid updates.
        const updates = {
            name: 'A new name',
            password: 'a new password'
        };
        
        // Assert HTTP Response Status 200 OK.
        const response = await localAgent
            .patch(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send({ updates })
            .expect(200);

            // Attempt to find the user in the database.
            const user = await User.findById(userOne.userOneBody._id);
    
            // Remove the version and timestamp fields from the database result object.
            const cleanUser = cleanDatabaseResultObject(user.toJSON());
    
            // The expected result object.
            const expectedUser = {
                ...getDefaultProperties(),
                ...userOne.userOneBody,
                ...updates,
                _id: userOne.userOneBody._id.toString(),
                password: 'hashed-password',
                tokens: [{
                    _id: expect.any(String),
                    token: userOne.userOneBody.tokens[0].token
                }]
            };
    
            // Assert that the user contains the correct data.
            expect(cleanUser).toEqual(expectedUser);
    
            // Assert that the result contains the correct data.
            // It's safe mutate the expectedUser object here.
            delete expectedUser.tokens;
            delete expectedUser.password;
            expect(response.body).toEqual({ user: expect.any(Object) });
            expect(cleanDatabaseResultObject(response.body.user)).toEqual(expectedUser);
    });

    test('Should throw a ValidationError if a user with a valid Bearer Token attempts to update invalid fields', async () => {
        // Assert HTTP Response Bad Request
        const response = await agent
            .patch(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send({
                updates: {
                    _id: 'a new id',
                    password: 'a new password'
                }
            })
            .expect(400);

        // Assert that the database remains unchanged.
        const user = await User.findById(userOne.userOneBody._id);
        expect(cleanDatabaseResultObject(user.toJSON())).toEqual({
            ...getDefaultProperties(),
            ...userOne.userOneBody,
            _id: userOne.userOneBody._id.toString(),
            tokens: [{
                _id: expect.any(String),
                token: userOne.userOneBody.tokens[0].token
            }]
        });

        // Assert that the response contains the correct error.
        expect(response.body).toEqual({
            error: new ValidationError().message
        });
    });

    test('Should return an AuthenticationError if a user does not have a valid Bearer Token', async () => {
        // Assert HTTP Response Status 401 Unauthorized.
        const response = await agent
            .patch(ROUTE)
            .send()
            // Not a 400 because the AuthenticationError should be thrown before a ValidationError due to middleware ordering of Express.
            .expect(401);
        
        // Assert that the response contains the correct data.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });        
    }); 
});