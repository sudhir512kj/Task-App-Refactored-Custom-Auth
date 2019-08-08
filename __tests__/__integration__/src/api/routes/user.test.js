/*
 * File: user.test.js (__tests__/__integration__/src/api/routes/user.test.js)
 *
 * Description: Houses Integration Test cases for the User Routes.
 * 
 * Created by Jamie Corkhill on 07//2019 at 01:53 AM (Local), 06:53 AM (Zulu)
 */

const supertest = require('supertest');
const awilix = require('awilix');
const jwt = require('jsonwebtoken');
const awsMock = require('mock-aws-s3');
const sizeOf = require('buffer-image-size');
const fs = require('fs-extra');
const appConfig = require('./../../../../../src/config/application/config');

const ABSOLUTE_URL_PREFIX = `http://${appConfig.cloudStorage.buckets.getMainBucket()}.s3.us-west-2.amazonaws.com`;

// Express Application
const appFactory = require('./../../../../../src/app');

// Custom Exceptions
const { 
    AuthenticationError,
    ValidationError,
    ResourceNotFoundError 
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

// Data Fixtures
const {
    // Configuration Functions
    configureDatabase,
    configureBucket,
    cleanDatabaseResultObject,
    getDefaultProperties,
    // Fixture Data
    testUser,
    userOne,
    userTwo,
    avatar
    // Other
} = require('./../../../fixtures/database/setup');

// ---------- Mocks ---------- */

const spys = {
    upload: null,
    deleteObject: null
};

// #region Mocks
// #region BCrypt Mock
const bcryptMock = {
    hash: () => Promise.resolve('hashed-password')
};
// #endregion
// #endregion

const basePath = `${__dirname}/../../../../../tmp/buckets`;

/* ---------- Hooks ---------- */

// Hooks - Before All
beforeAll(async () => {
    // AWS
    awsMock.config.basePath = basePath;

    container.register({
        // Registering the AWS Mock
        // eslint-disable-next-line func-names, object-shorthand
        aws: awilix.asValue({ S3: function () {
            const mockInstance = awsMock.S3({
                params: { 
                    Bucket: appConfig.cloudStorage.buckets.getMainBucket()
                }
            });

            spys.upload = jest.spyOn(mockInstance, 'upload');
            spys.deleteObject = jest.spyOn(mockInstance, 'deleteObject');

            return mockInstance;
        } })
    });

    // Configure server and database connections.
    // eslint-disable-next-line no-extra-semi
    ;({ agent, server, connection } = await configureServerAndDatabaseConnectionForJestSetup(appFactory(container), supertest));
});

// Hooks - Before Each
beforeEach(async () => {
    await configureDatabase();
    jest.clearAllMocks();
});

// Hooks - After All
afterAll(async () => {
    await tearDownServerAndDatabaseConnectionForJest(connection, server);
});

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

    const afterAllTeardown = (done) => localServer.close(done);
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
            avatarPaths: appConfig.cloudStorage.avatars.getDefaultAvatarPaths(),
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
        expect(cleanDatabaseResultObject(response.body.user)).toEqual({
            ...expectedUser,
            avatarPaths: Object.assign({}, ...Object.keys(expectedUser.avatarPaths)
                .map(key => ({ [key]: `${ABSOLUTE_URL_PREFIX}/${expectedUser.avatarPaths[key]}` })))
        });
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

    test('Avatar paths should be formatted for a user that logs in correctly and does have an uploaded avatar', async () => {
         // Assert HTTP Response Status 200 OK.
         const response = await agent
         .post(ROUTE)
         .send({
             credentials: {
                 email: userTwo.userTwoBody.email,
                 password: userTwo.passwordPlain
             }
         })
         .expect(200);

        // Attempt to find the user in the database.
        const user = await User.findById(userTwo.userTwoBody._id);

        // Remove the timestamp and version from the user object.
        const cleanUser = cleanDatabaseResultObject(user.toJSON());

        // The expected result object.
        const expectedUser = {
            ...getDefaultProperties(),
            ...userTwo.userTwoBody,
            _id: userTwo.userTwoBody._id.toString(),
            password: userTwo.passwordHashed,
            tokens: expect.any(Array),
            avatarPaths: {
                original: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_original.jpg`,
                small: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_small.jpg`,
                large: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_large.jpg`,
            }
        };

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

    test('Avatar paths should be formatted for a user with a valid Bearer Token that does have an uploaded avatar', async () => {
        // Assert HTTP Response Status 200 OK.
            const response = await agent
            .get(ROUTE)
            .set('Authorization', `Bearer ${userTwo.userTwoBody.tokens[0].token}`)
            .send()
            .expect(200);

        // The expected result object.
        const expectedUser = {
            ...getDefaultProperties(),
            ...userTwo.userTwoBody,
            _id: userTwo.userTwoBody._id.toString(),
            password: userTwo.passwordHashed,
            tokens: expect.any(Array),
            avatarPaths: {
                original: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_original.jpg`,
                small: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_small.jpg`,
                large: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_large.jpg`,
            }
        };

        // Assert that the response contains the correct data.
        // It's safe mutate the expectedUser object here.
        delete expectedUser.password;
        delete expectedUser.tokens;
        expect(response.body).toEqual({
            user: expect.any(Object)
        });
        expect(cleanDatabaseResultObject(response.body.user)).toEqual(expectedUser);
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

    test('Avatar paths should be formatted for a user with a valid Bearer Token that does have an uploaded avatar if no updates are provided', async () => {
        // Assert HTTP Response Status 200 OK.
        const response = await agent
            .patch(ROUTE)
            .set('Authorization', `Bearer ${userTwo.userTwoBody.tokens[0].token}`)
            .send()
            .expect(200);

        // The expected result object.
        const expectedUser = {
            ...getDefaultProperties(),
            ...userTwo.userTwoBody,
            _id: userTwo.userTwoBody._id.toString(),
            password: userTwo.passwordHashed,
            tokens: expect.any(Array),
            avatarPaths: {
                original: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_original.jpg`,
                small: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_small.jpg`,
                large: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_large.jpg`,
            }
        };

        // Assert that the response contains the correct data.
        // It's safe mutate the expectedUser object here.
        delete expectedUser.password;
        delete expectedUser.tokens;
        expect(response.body).toEqual({
            user: expect.any(Object)
        });
        expect(cleanDatabaseResultObject(response.body.user)).toEqual(expectedUser);
    });

    test('Avatar paths should be formatted for a user with a valid Bearer Token that does have an uploaded avatar if valid updates are provided.', async () => {
        // Assert HTTP Response Status 200 OK.
            const response = await agent
            .patch(ROUTE)
            .set('Authorization', `Bearer ${userTwo.userTwoBody.tokens[0].token}`)
            .send({
                updates: {
                    name: 'Grant'
                }
            })
            .expect(200);

        // The expected result object.
        const expectedUser = {
            ...getDefaultProperties(),
            ...userTwo.userTwoBody,
            name: 'Grant',
            _id: userTwo.userTwoBody._id.toString(),
            password: userTwo.passwordHashed,
            tokens: expect.any(Array),
            avatarPaths: {
                original: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_original.jpg`,
                small: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_small.jpg`,
                large: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_large.jpg`,
            }
        };

        // Assert that the response contains the correct data.
        // It's safe mutate the expectedUser object here.
        delete expectedUser.password;
        delete expectedUser.tokens;
        expect(response.body).toEqual({
            user: expect.any(Object)
        });
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

// DELETE /api/v1/users/me
describe('Delete User', () => {
    const ROUTE = '/api/v1/users/me';
    test('Should correctly delete a user with a valid Bearer Token', async () => {
        // Assert HTTP Response Status 200 OK
        await agent
            .delete(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send()
            .expect(200);

        // Assert that the user no longer exists within the database.
        const user = await User.findById(userOne.userOneBody._id);
        expect(user).toBe(null);
    });

    test('Should not delete a user if the requester does not have a valid Bearer Token', async () => {
        // Assert HTTP Response Status 400 Bad Request.
        const response = await agent
            .delete(ROUTE)
            .send()
            .expect(401);

        // Assert that the response contains the correct error.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });
    });
});

describe('User Avatar', () => {
    const ROUTE = '/api/v1/users/me/avatar';

    beforeEach(async () => configureBucket());


    const path = `${__dirname}/../../../../../tmp/buckets/${appConfig.cloudStorage.buckets.getMainBucket()}/users/${userOne.userOneBody._id}/profile/avatar`;
    const imageData = [
        { nameSuffix: 'original', width: sizeOf(avatar.buffer).width, height: sizeOf(avatar.buffer).height }, 
        { nameSuffix: 'small', width: 50, height: 50 }, 
        { nameSuffix: 'large', width: 100, height: 100 }
    ];

    // POST /api/v1/users/me
    test('Should upload a user avatar, mutate the DB, and return the correct data for a user with a valid Bearer Token', async (done) => {
        // Assert HTTP Response Status 201 Created
        const response = await agent
            .post(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .attach('avatar', `${__dirname}/../../../fixtures/files/images/avatar/avatar.jpg`)
            .expect(201);

        // Assert that the correct images have been created.
        imageData.forEach(({ nameSuffix, width, height }) => {
            fs.readFile(`${path}/avatar_${nameSuffix}.jpg`, (err, data) => {
                if (err) throw err;
                
                // Assert that the buffers have the correct size and represent the correct type.
                expect(data).toEqual(expect.any(Buffer));
                expect(sizeOf(data)).toEqual({ width, height, type: 'jpg' });

                if (nameSuffix === imageData[imageData.length - 1].nameSuffix) done();
            });
        });

        // Attempt to find the user object in the database.
        const user = await User.findById(userOne.userOneBody._id);

        // Remove the version and timestamp fields from the database result object.
        const cleanUser = cleanDatabaseResultObject(user.toJSON());

        const avatarPathPrefix = `users/${userOne.userOneBody._id}/profile/avatar`;

        // The expected database result object.
        const expectedUser = {
            ...getDefaultProperties(),
            ...userOne.userOneBody,
            _id: userOne.userOneBody._id.toString(),
            tokens: [{
                _id: expect.any(String),
                token: userOne.userOneBody.tokens[0].token
            }],
            avatarPaths: {
                original: `${avatarPathPrefix}/avatar_original.jpg`,
                small: `${avatarPathPrefix}/avatar_small.jpg`,
                large: `${avatarPathPrefix}/avatar_large.jpg`,
            }
        };

        // Assert that the user contains the correct fields.
        expect(cleanUser).toEqual(expectedUser);

        // Assert that the response body contains the correct data.
        delete expectedUser.password;
        delete expectedUser.tokens;
        expect(response.body).toEqual({ user: expect.any(Object) });
        expect(cleanDatabaseResultObject(response.body.user)).toEqual({
            ...expectedUser,
            avatarPaths: Object.assign({}, ...Object.keys(expectedUser.avatarPaths)
                .map(key => ({ [key]: `${ABSOLUTE_URL_PREFIX}/${expectedUser.avatarPaths[key]}` })))
        });
    });

    // TODO: POST /me/avatar 400 Bad Request
    test('Should not update avatar if bad data is supplied despite a valid Bearer Token', async () => {
        // Assert HTTP Response Status 400 Bad Request.
        const response = await agent
            .post(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .attach('avatar', `${__dirname}/../../../fixtures/files/webrtc_internals_dump.txt`)
            .expect(400);

        // Assert that the AWS Spy for upload was never called.
        expect(spys.upload).toHaveBeenCalledTimes(0);

        // Attempt to find User One in the database.
        const user = await User.findById(userOne.userOneBody._id);

        // Remove timestamp and version fields from the user object.
        const cleanUser = cleanDatabaseResultObject(user.toJSON());

        // The expected result.
        const expected = {
            ...getDefaultProperties(),
            ...userOne.userOneBody,
            _id: userOne.userOneBody._id.toString(),
            tokens: [{
                _id: expect.any(String),
                token: userOne.userOneBody.tokens[0].token
            }]
        };

        // Assert that the user contains the correct data.
        expect(cleanUser).toEqual(expected);

        // Assert that the response body contains the correct data.
        expect(response.body).toEqual({
            error: 'The mimetype text/plain is invalid for this upload!'
        });
    });

    test('Should not upload an avatar for a user with an invalid Bearer Token', async () => {
        // Assert HTTP Response Status 401 Unauthorized.
        const response = await agent
            .post(ROUTE)
            .expect(401);

        expect(spys.upload).toHaveBeenCalledTimes(0);

        // Assert that the response contains the correct data.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });
    });

    // DELETE /api/v1/users/me/avatar
    test('Should delete an avatar for a user with a valid Bearer Token if they have an avatar uploaded', async (done) => {
        // Assert HTTP Response Status 200 OK.
        const response = await agent
            .delete(ROUTE)
            .set('Authorization', `Bearer ${userTwo.userTwoBody.tokens[0].token}`)
            .send()
            .expect(200);

        // Assert that the response contains the correct data.
        expect(response.body).toEqual({});

        // Assert that no avatar was uploaded.
        imageData.forEach(({ nameSuffix }) => {
            fs.readFile(`${path}/avatar_${nameSuffix}`, (err, data) => {
                expect(err).not.toBe(undefined);
                if (nameSuffix === imageData[imageData.length - 1].nameSuffix) done();
            });
        });
    });

    test('Should not delete an avatar if a user does not have an uploaded avatar', async () => {
        // Assert HTTP Response Status 200 OK.
        const response = await agent
            .delete(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send()
            .expect(200);

        // Assert that the spy was not called.
        expect(spys.deleteObject).toHaveBeenCalledTimes(0);

        // Assert that the response contains no data.
        expect(response.body).toEqual({});
    });

    // DELETE /api/v1/users/me/avatar
    test('Should not delete an avatar for a user without a Bearer Token if they have an avatar uploaded', async () => {
        // Assert HTTP Response Status 401 Unauthorized.
        const response = await agent
            .delete(ROUTE)
            .send()
            .expect(401);

        // Assert that the response contains the correct data.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });

        // Assert that no avatar was deleted.
       expect(spys.deleteObject).toHaveBeenCalledTimes(0);
    });

    // GET /api/v1/users/:id/avatar
    test('Avatar paths should be formatted for a user that does have an uploaded avatar', async () => {
        // Assert HTTP Response Status 200 OK.
        const response = await agent
            .get(`/api/v1/users/${userTwo.userTwoBody._id}/avatar`)
            .send()
            .expect(200);

        expect(response.body).toEqual({
            avatar: {
                original: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_original.jpg`,
                small: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_small.jpg`,
                large: `${ABSOLUTE_URL_PREFIX}/users/${userTwo.userTwoBody._id}/profile/avatar/avatar_large.jpg`,
            }
        });
    });

    // GET /api/v1/users/:id/avatar
    test('Avatar paths should be default for a user that does not have an uploaded avatar', async () => {
        // Assert HTTP Response Status 200 OK.
        const response = await agent
            .get(`/api/v1/users/${userOne.userOneBody._id}/avatar`)
            .send()
            .expect(200);

        expect(response.body).toEqual({
            avatar: {
                original: `${ABSOLUTE_URL_PREFIX}/${appConfig.cloudStorage.avatars.getDefaultAvatarPaths().original}`,
                small: `${ABSOLUTE_URL_PREFIX}/${appConfig.cloudStorage.avatars.getDefaultAvatarPaths().small}`,
                large: `${ABSOLUTE_URL_PREFIX}/${appConfig.cloudStorage.avatars.getDefaultAvatarPaths().large}`,
            }
        });
    });

    // GET /api/v1/users/:id/avatar
    test('Should return 404 if no user by the specified ID exists.', async () => {
        // Assert HTTP Response Status 404 Resource Not Found.
        const response = await agent
            .get('/api/v1/users/anything/avatar')
            .send()
            .expect(404);

        expect(response.body).toEqual({
            error: new ResourceNotFoundError().message
        });
    });
});