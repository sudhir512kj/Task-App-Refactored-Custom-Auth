/*
 * File: (__tests__/__unit__/src/services/UserService.test.js)
 *
 * Description: Houses test cases related to the user repository.
 * 
 * Created by Jamie Corkhill on 08/02/2019 at 05:08 PM (Local), 10:08 PM (Zulu)
 */

const UserService = require('../../../../src/services/UserService');

// Dependencies to the System Under Test.
const UserRepository = require('./../../../../src/repositories/UserRepository');
const AuthenticationService = require('./../../../../src/services/AuthenticationService');
const PasswordService = require('./../../../../src/services/PasswordService');
const FileStorageService = require('./../../../../src/services/FileStorageService');
const FileStorageAdapter = require('./../../../../src/adapters/AWS/FileStorageAdapter');
const appConfig = require('./../../../../src/config/application/config');

// Mock dependencies.
jest.mock('./../../../../src/repositories/UserRepository');
jest.mock('./../../../../src/services/AuthenticationService');
jest.mock('./../../../../src/services/PasswordService');
jest.mock('./../../../../src/services/FileStorageService');
jest.mock('./../../../../src/adapters/AWS/FileStorageAdapter');

// Access instance methods with constructor invocation.
const userRepository = new UserRepository();
const authenticationService = new AuthenticationService();
const passwordService = new PasswordService();
const fileStorageService = new FileStorageService();
const fileStorageAdapter = new FileStorageAdapter();

const ABSOLUTE_URL_PREFIX = `http://${appConfig.cloudStorage.buckets.getMainBucket()}.s3.us-west-2.amazonaws.com`;

// Custom Exceptions
const {
    ValidationError,
    ResourceNotFoundError,
    AuthenticationError
} = require('./../../../../src/custom-exceptions/index');

// System Under Test
const userService = new UserService({
    userRepository,
    authenticationService,
    passwordService,
    fileStorageService,
    fileStorageAdapter,
    appConfig,
    context: { user: { _id: '123' } }
});

// Factory to dynamically created named errors.
const errorFactory = (name, code) => {
    const error = new Error('Mocked Failure');
    error.name = name;
    error.code = code;
    return error;
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

describe('#signUpNewUser', () => {
    test('Should call the correct mock functions and return the correct data for a valid user object', async () => {
        // Spys
        const hashSpy = jest.spyOn(passwordService, 'hash').mockImplementationOnce(() => 'hashed');
        const createSpy = jest.spyOn(userRepository, 'create').mockImplementationOnce(() => ({ 
            _id: '314', 
            username: 'Jamie',
        }));
        const generateAuthTokenSpy = jest.spyOn(authenticationService, 'generateAuthToken').mockImplementationOnce(() => 'token');
        const updateTokensByIdSpy = jest.spyOn(userRepository, 'updateTokensById').mockImplementationOnce(() => ({ 
            _id: '314',
            username: 'Jamie', 
            avatarPaths: {
                original: 'no-profile',
                small: 'no-profile',
                large: 'no-profile',
            },
            tokens: [{
                _id: '0',
                token: 'token'
            }],
            password: 'hashed'
        }));

        const userData = {
            username: 'Grant Thompson - The King of Random', // RIP
            password: 'microwave-transformer',
            email: 'email@domain.com'
        };

        // userService.signUpNewUser expects a userData object. This is a minified version.
        const user = await userService.signUpNewUser(userData);

        // Assert that the password was hashed and the user was created with the expected data.
        expect(hashSpy).toHaveBeenCalledTimes(1);
        expect(hashSpy).toHaveBeenCalledWith(userData.password);
        expect(createSpy).toHaveBeenCalledTimes(1);
        expect(createSpy).toHaveBeenCalledWith({
            ...userData,
            avatarPaths: appConfig.cloudStorage.avatars.getDefaultAvatarPaths(),
            password: 'hashed'
        });

        // Assert that the token was created correctly and the user was updated with that token in the database.
        expect(generateAuthTokenSpy).toHaveBeenCalledTimes(1);
        expect(generateAuthTokenSpy).toHaveBeenCalledWith('314');
        expect(updateTokensByIdSpy).toHaveBeenCalledTimes(1);
        expect(updateTokensByIdSpy).toHaveBeenCalledWith('314', 'token');

        // Assert that the user contains the correct data.
        expect(user).toEqual({
            user: {
                _id: '314',
                username: 'Jamie',
                avatarPaths: {
                    original: 'no-profile',
                    small: 'no-profile',
                    large: 'no-profile'
                }
            },
            token: 'token'
        });
    });

    test('Should throw a ValidationError if no user data is provided', async () => {
        await expect(userService.signUpNewUser()).rejects.toEqual(new ValidationError());
    });

    test('Should throw a ValidationError if no user password is provided', async () => {
        await expect(userService.signUpNewUser({})).rejects.toEqual(new ValidationError());
    });

    test('Should throw a ValidationError with a message if an email exists', async () => {
        jest.spyOn(passwordService, 'hash').mockImplementationOnce(() => 'hashed');
        jest.spyOn(userRepository, 'create').mockImplementationOnce(() => Promise.reject(errorFactory(undefined, 11000)));
        await expect(userService.signUpNewUser({ password: 'data' })).rejects.toEqual(new ValidationError(null, 'The provided email address is already in use.'));
    });

    test('Should throw a generic catch-all error if an unexpected error occurs with a name', async () => {
        jest.spyOn(passwordService, 'hash').mockImplementationOnce(() => { throw new Error('Mocked Failure'); });
        await expect(userService.signUpNewUser({ password: 'data' })).rejects.toEqual(new Error('Mocked Failure'));
    });

    test('Should throw a generic catch-all error if an unexpected error occurs without a name', async () => {
        // eslint-disable-next-line prefer-promise-reject-errors
        jest.spyOn(passwordService, 'hash').mockImplementationOnce(() => Promise.reject('reject'));
        await expect(userService.signUpNewUser({ password: 'data' })).rejects.toEqual('reject');
    });
});

describe('#loginUser', () => {   
    // Correct return result.
    test('Should correctly log in a user and call the correct mock functions for a user with non-default avatar paths', async () => {
        const readByQuerySpy = jest.spyOn(userRepository, 'readByQuery').mockImplementationOnce(() => ({  
            _id: 'id',
            username: 'Jamie',
            password: 'some-hashed-password'
        }));
        const compareSpy = jest.spyOn(passwordService, 'compare').mockImplementationOnce(() => Promise.resolve(true));
        const generateAuthTokenSpy = jest.spyOn(authenticationService, 'generateAuthToken').mockImplementationOnce(() => 'token');
        const updateTokensByIdSpy = jest.spyOn(userRepository, 'updateTokensById').mockImplementationOnce(() => ({
            username: 'Jamie',
            password: 'some-hashed-password',
            tokens: [{ _id: '0', token: 'token' }],
            avatarPaths: {
                original: 'path/to/img1',
                small: 'path/to/img2',
                large: 'path/to/img3'
            }
        }));
        const getAbsoluteFileURISpy = jest.spyOn(fileStorageAdapter, 'getAbsoluteFileURI').mockImplementation(() => 'absolute'); // Not mocked once.

        // userRepository.loginUser expects an email and password.
        const user = await userService.loginUser('email', 'password');

        // Assert that the query and password comparison functions were called correctly.
        expect(readByQuerySpy).toHaveBeenCalledTimes(1);
        expect(readByQuerySpy).toHaveBeenCalledWith({ email: 'email' });
        expect(compareSpy).toHaveBeenCalledTimes(1);
        expect(compareSpy).toHaveBeenCalledWith('password', 'some-hashed-password');

        // Assert that the auth token was created and database was updated.
        expect(generateAuthTokenSpy).toHaveBeenCalledTimes(1);
        expect(generateAuthTokenSpy).toHaveBeenCalledWith('id');
        expect(updateTokensByIdSpy).toHaveBeenCalledTimes(1);
        expect(updateTokensByIdSpy).toHaveBeenCalledWith('id', 'token');

        // Assert that getAbsoluteFileURISpy was called correctly.
        expect(getAbsoluteFileURISpy).toHaveBeenCalledTimes(3);
        expect(getAbsoluteFileURISpy.mock.calls).toEqual([['path/to/img1'], ['path/to/img2'], ['path/to/img3']]);

        // Assert that the return value contains the correct data.
        expect(user).toEqual({
            user: {
                username: 'Jamie',
                avatarPaths: {
                    original: 'absolute',
                    small: 'absolute',
                    large: 'absolute'
                }
            },
            token: 'token'
        });
    });

    test('Should correctly log in a user and call the correct mock functions for a user with default avatar paths', async () => {
        const readByQuerySpy = jest.spyOn(userRepository, 'readByQuery').mockImplementationOnce(() => ({  
            _id: 'id',
            username: 'Jamie',
            password: 'some-hashed-password'
        }));
        const compareSpy = jest.spyOn(passwordService, 'compare').mockImplementationOnce(() => Promise.resolve(true));
        const generateAuthTokenSpy = jest.spyOn(authenticationService, 'generateAuthToken').mockImplementationOnce(() => 'token');
        const updateTokensByIdSpy = jest.spyOn(userRepository, 'updateTokensById').mockImplementationOnce(() => ({
            username: 'Jamie',
            password: 'some-hashed-password',
            tokens: [{ _id: '0', token: 'token' }],
            avatarPaths: appConfig.cloudStorage.avatars.getDefaultAvatarPaths()
        }));
        const getAbsoluteFileURISpy = jest.spyOn(fileStorageAdapter, 'getAbsoluteFileURI').mockImplementation(() => 'absolute'); // Not mocked once.

        // userRepository.loginUser expects an email and password.
        const user = await userService.loginUser('email', 'password');

        // Assert that the query and password comparison functions were called correctly.
        expect(readByQuerySpy).toHaveBeenCalledTimes(1);
        expect(readByQuerySpy).toHaveBeenCalledWith({ email: 'email' });
        expect(compareSpy).toHaveBeenCalledTimes(1);
        expect(compareSpy).toHaveBeenCalledWith('password', 'some-hashed-password');

        // Assert that the auth token was created and database was updated.
        expect(generateAuthTokenSpy).toHaveBeenCalledTimes(1);
        expect(generateAuthTokenSpy).toHaveBeenCalledWith('id');
        expect(updateTokensByIdSpy).toHaveBeenCalledTimes(1);
        expect(updateTokensByIdSpy).toHaveBeenCalledWith('id', 'token');

        // Assert that getAbsoluteFileURISpy was called correctly.
        expect(getAbsoluteFileURISpy).toHaveBeenCalledTimes(3);
        expect(getAbsoluteFileURISpy.mock.calls).toEqual([['original'], ['small'], ['large']]);

        // Assert that the return value contains the correct data.
        expect(user).toEqual({
            user: {
                username: 'Jamie',
                avatarPaths: {
                    original: 'absolute',
                    small: 'absolute',
                    large: 'absolute'
                }
            },
            token: 'token'
        });
    });

    // Validation Error - no email.
    test('Should throw a ValidationError if no email is provided', async () => {
        await expect(userService.loginUser(undefined, 'password')).rejects.toEqual(new ValidationError());
    });

    // Validation Error - no password.
    test('Should throw a ValidationError if no password is provided', async () => {
        await expect(userService.loginUser('email', undefined)).rejects.toEqual(new ValidationError());
    });

    // Authentication Error - null user
    test('Should throw an AuthenticationError if no user is found by the provided email', async () => {
        jest.spyOn(userRepository, 'readByQuery').mockImplementation(() => Promise.resolve(null));
        await expect(userService.loginUser('an email', 'a password')).rejects.toEqual(new AuthenticationError());
    });

    // Authentication Error - password comparison.
    test('Should throw an AuthenticationError if the password does not match the hash on file', async () => {
        jest.spyOn(userRepository, 'readByQuery').mockImplementation(() => Promise.resolve({ password: 'hashed-db-value' }));
        jest.spyOn(passwordService, 'compare').mockImplementationOnce(() => Promise.resolve(false));
        await expect(userService.loginUser('an email', 'a password')).rejects.toEqual(new AuthenticationError());
    }); 
});

describe('#logoutUser', () => {
    test('Should call the mock functions correctly and return the correct data for a user with non-default avatars', async () => {
        // Spys
        const removeTokenByIdSpy = jest.spyOn(userRepository, 'removeTokenById').mockImplementationOnce(() => Promise.resolve({
            username: 'Jamie',
            avatarPaths: {
                original: 'path/to/img1',
                small: 'path/to/img2',
                large: 'path/to/img3'
            }
        }));
        const getAbsoluteFileURISpy = jest.spyOn(fileStorageAdapter, 'getAbsoluteFileURI').mockImplementation(() => 'absolute'); // Not mocked once.

        // userService.logoutUser expects a token.
        const user = await userService.logoutUser('token');

        // Assert that the mocks were called correctly.
        expect(removeTokenByIdSpy).toHaveBeenCalledTimes(1);
        expect(removeTokenByIdSpy).toHaveBeenCalledWith('123', 'token');

        // Assert that getAbsoluteFileURISpy was called correctly.
        expect(getAbsoluteFileURISpy).toHaveBeenCalledTimes(3);
        expect(getAbsoluteFileURISpy.mock.calls).toEqual([['path/to/img1'], ['path/to/img2'], ['path/to/img3']]);

        // Assert that the return result contains the correct data.
        expect(user).toEqual({
            username: 'Jamie',
            avatarPaths: {
                original: 'absolute',
                small: 'absolute',
                large: 'absolute'
            }
        });
    });

    test('Should call the mock functions correctly and return the correct data for a user with default avatars', async () => {
        // Spys
        const removeTokenByIdSpy = jest.spyOn(userRepository, 'removeTokenById').mockImplementationOnce(() => Promise.resolve({
            username: 'Jamie',
            avatarPaths: appConfig.cloudStorage.avatars.getDefaultAvatarPaths()
        }));
        const getAbsoluteFileURISpy = jest.spyOn(fileStorageAdapter, 'getAbsoluteFileURI').mockImplementation(() => 'absolute'); // Not mocked once.

        // userService.logoutUser expects a token.
        const user = await userService.logoutUser('token');

        // Assert that the mocks were called correctly.
        expect(removeTokenByIdSpy).toHaveBeenCalledTimes(1);
        expect(removeTokenByIdSpy).toHaveBeenCalledWith('123', 'token');

        // Assert that getAbsoluteFileURISpy was called correctly.
        expect(getAbsoluteFileURISpy).toHaveBeenCalledTimes(3);
        expect(getAbsoluteFileURISpy.mock.calls).toEqual([['original'], ['small'], ['large']]);

        // Assert that the return result contains the correct data.
        expect(user).toEqual({
            username: 'Jamie',
            avatarPaths: {
                original: 'absolute',
                small: 'absolute',
                large: 'absolute'
            }
        });
    });

    test('Should re-throw errors thrown by the dependencies', async () => {
        jest.spyOn(userRepository, 'removeTokenById').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userService.logoutUser('token')).rejects.toEqual(new Error('Mocked Failure'));
    });
});

describe('#logoutUserAll', () => {
    test('Should call the mock functions correctly and return the correct data for a user with non-default avatars', async () => {
        // Spys
        const removeAllTokensByIdSpy = jest.spyOn(userRepository, 'removeAllTokensById').mockImplementationOnce(() => Promise.resolve({
            username: 'Jamie',
            avatarPaths: {
                original: 'path/to/img1',
                small: 'path/to/img2',
                large: 'path/to/img3'
            }
        }));
        const getAbsoluteFileURISpy = jest.spyOn(fileStorageAdapter, 'getAbsoluteFileURI').mockImplementation(() => 'absolute'); // Not mocked once.

        // userService.logoutUser expects a token.
        const user = await userService.logoutUserAll();

        // Assert that the mocks were called correctly.
        expect(removeAllTokensByIdSpy).toHaveBeenCalledTimes(1);
        expect(removeAllTokensByIdSpy).toHaveBeenCalledWith('123');

        // Assert that getAbsoluteFileURISpy was called correctly.
        expect(getAbsoluteFileURISpy).toHaveBeenCalledTimes(3);
        expect(getAbsoluteFileURISpy.mock.calls).toEqual([['path/to/img1'], ['path/to/img2'], ['path/to/img3']]);

        // Assert that the return result contains the correct data.
        expect(user).toEqual({
            username: 'Jamie',
            avatarPaths: {
                original: 'absolute',
                small: 'absolute',
                large: 'absolute'
            }
        });
    });

    test('Should call the mock functions correctly and return the correct data for a user with default avatars', async () => {
        // Spys
        const removeAllTokensByIdSpy = jest.spyOn(userRepository, 'removeAllTokensById').mockImplementationOnce(() => Promise.resolve({
            username: 'Jamie',
            avatarPaths: appConfig.cloudStorage.avatars.getDefaultAvatarPaths()
        }));
        const getAbsoluteFileURISpy = jest.spyOn(fileStorageAdapter, 'getAbsoluteFileURI').mockImplementation(() => 'absolute'); // Not mocked once.

        // userService.logoutUser expects a token.
        const user = await userService.logoutUserAll('token');

        // Assert that the mocks were called correctly.
        expect(removeAllTokensByIdSpy).toHaveBeenCalledTimes(1);
        expect(removeAllTokensByIdSpy).toHaveBeenCalledWith('123');

        // Assert that getAbsoluteFileURISpy was called correctly.
        expect(getAbsoluteFileURISpy).toHaveBeenCalledTimes(3);
        expect(getAbsoluteFileURISpy.mock.calls).toEqual([['original'], ['small'], ['large']]);

        // Assert that the return result contains the correct data.
        expect(user).toEqual({
            username: 'Jamie',
            avatarPaths: {
                original: 'absolute',
                small: 'absolute',
                large: 'absolute'
            }
        });
    });

    test('Should re-throw errors thrown by the dependencies', async () => {
        jest.spyOn(userRepository, 'removeAllTokensById').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userService.logoutUserAll('token')).rejects.toEqual(new Error('Mocked Failure'));
    });
});

describe('#retrieveUserByQuery', () => {
    // Return correct data non-default avatar.
    test('Should call the mock functions correctly and return the correct data for a user with non-default avatars', async () => {
        // Spys
        const readByQuerySpy = jest.spyOn(userRepository, 'readByQuery').mockImplementationOnce(() => Promise.resolve({
            username: 'Jamie',
            avatarPaths: {
                original: 'path/to/img1',
                small: 'path/to/img2',
                large: 'path/to/img3'
            }
        }));
        const getAbsoluteFileURISpy = jest.spyOn(fileStorageAdapter, 'getAbsoluteFileURI').mockImplementation(() => 'absolute'); // Not mocked once.

        // userService.logoutUser expects a token.
        const user = await userService.retrieveUserByQuery({ email: 'email' });

        // Assert that the mocks were called correctly.
        expect(readByQuerySpy).toHaveBeenCalledTimes(1);
        expect(readByQuerySpy).toHaveBeenCalledWith({ email: 'email' });

        // Assert that getAbsoluteFileURISpy was called correctly.
        expect(getAbsoluteFileURISpy).toHaveBeenCalledTimes(3);
        expect(getAbsoluteFileURISpy.mock.calls).toEqual([['path/to/img1'], ['path/to/img2'], ['path/to/img3']]);

        // Assert that the return result contains the correct data.
        expect(user).toEqual({
            username: 'Jamie',
            avatarPaths: {
                original: 'absolute',
                small: 'absolute',
                large: 'absolute'
            }
        });
    });

    // Return correct data default avatar.
    test('Should call the mock functions correctly and return the correct data for a user with default avatars', async () => {
        // Spys
        const readByQuerySpy = jest.spyOn(userRepository, 'readByQuery').mockImplementationOnce(() => Promise.resolve({
            username: 'Jamie',
            avatarPaths: appConfig.cloudStorage.avatars.getDefaultAvatarPaths()
        }));
        const getAbsoluteFileURISpy = jest.spyOn(fileStorageAdapter, 'getAbsoluteFileURI').mockImplementation(() => 'absolute'); // Not mocked once.

        // userService.logoutUser expects a token.
        const user = await userService.retrieveUserByQuery({ email: 'email' });

        // Assert that the mocks were called correctly.
        expect(readByQuerySpy).toHaveBeenCalledTimes(1);
        expect(readByQuerySpy).toHaveBeenCalledWith({ email: 'email' });

        // Assert that getAbsoluteFileURISpy was called correctly.
        expect(getAbsoluteFileURISpy).toHaveBeenCalledTimes(3);
        expect(getAbsoluteFileURISpy.mock.calls).toEqual([['original'], ['small'], ['large']]);

        // Assert that the return result contains the correct data.
        expect(user).toEqual({
            username: 'Jamie',
            avatarPaths: {
                original: 'absolute',
                small: 'absolute',
                large: 'absolute'
            }
        });
    });

    // Throw for null error.
    test('Should throw a ResourceNotFoundError for a user who is null', async () => {
        jest.spyOn(userRepository, 'readByQuery').mockImplementationOnce(() => Promise.resolve(null));
        await expect(userService.retrieveUserByQuery('query')).rejects.toEqual(new ResourceNotFoundError());
    });

    // Re-throw errors.
    test('Should re-throw errors thrown by the UserRepository', async () => {
        jest.spyOn(userRepository, 'readByQuery').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userService.retrieveUserByQuery('query')).rejects.toEqual(new Error('Mocked Failure'));
    });
});

describe('#updateUser', () => {
    test('Should call the mock functions correctly and return the correct data if updates are valid (and should hash password)', async () => {
        // Spys
        const hashSpy = jest.spyOn(passwordService, 'hash').mockImplementationOnce(() => Promise.resolve('hashed'));
        const updateByIdSpy = jest.spyOn(userRepository, 'updateById').mockImplementationOnce(() => ({
            username: 'Jamie',
            avatarPaths: appConfig.cloudStorage.avatars.getDefaultAvatarPaths()
        }));
        const getAbsoluteFileURISpy = jest.spyOn(fileStorageAdapter, 'getAbsoluteFileURI').mockImplementation(() => 'absolute'); // Not mocked once.

        const requestedUpdates = {
            name: 'John Reese',
            email: 'john@domain.com',
            password: 'a-new-password',
            age: 40
        };

        // userService.updateUser expects a requested updates object.
        const user = await userService.updateUser(requestedUpdates);

        // Assert that the mock functions were called correctly.
        expect(hashSpy).toHaveBeenCalledTimes(1);
        expect(hashSpy).toHaveBeenCalledWith(requestedUpdates.password);
        expect(updateByIdSpy).toHaveBeenCalledTimes(1);
        expect(updateByIdSpy).toHaveBeenCalledWith('123', { ...requestedUpdates, password: 'hashed' });

        // Assert that getAbsoluteFileURISpy was called correctly.
        expect(getAbsoluteFileURISpy).toHaveBeenCalledTimes(3);
        expect(getAbsoluteFileURISpy.mock.calls).toEqual([['original'], ['small'], ['large']]);

        // Assert that the return result contains the correct data.
        expect(user).toEqual({
            username: 'Jamie',
            avatarPaths: {
                original: 'absolute',
                small: 'absolute',
                large: 'absolute'
            }
        });
    });

    test('Should return the same user if no updates are provided', async () => {
        await expect(await userService.updateUser()).toEqual({ _id: '123' });
    });

    test('Should throw a ValidationError if invalid updates are provided', async () => {
        await expect(userService.updateUser({ _id: '456' })).rejects.toEqual(new ValidationError());
    });

    test('Should re-throw errors thrown by the dependencies', async () => {
        jest.spyOn(userRepository, 'updateById').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userService.updateUser({ email: 'email' })).rejects.toEqual(new Error('Mocked Failure'));
    });
});

describe('#deleteUser', () => {
    test('Should call the mock functions correctly', async () => {
        // Spys
        const deleteByIdSpy = jest.spyOn(userRepository, 'deleteById').mockImplementation(() => Promise.resolve('user'));

        const user = await userService.deleteUser();

        // Assert that the mock function was called correctly.
        expect(deleteByIdSpy).toHaveBeenCalledTimes(1);
        expect(deleteByIdSpy).toHaveBeenCalledWith('123');

        // Assert that the user contains the correct data.
        expect(user).toEqual('user');

    });

    test('Should re-throw errors thrown by dependencies', async () => {
        jest.spyOn(userRepository, 'deleteById').mockImplementation(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userService.deleteUser()).rejects.toEqual(new Error('Mocked Failure'));
    });
});

describe('#uploadUserAvatar', () => {
    // Return correct data.
    test('Should return the correct data for a non-null buffer', async () => {
        // Spys
        const processAndUploadAvatarImageSpy = jest.spyOn(fileStorageService, 'processAndUploadAvatarImage').mockImplementationOnce(() => [{
            Key: 'path/to/avatar_original.jpg'
        }, {
            Key: 'path/to/avatar_small.jpg'
        }, {    
            Key: 'path/to/avatar_large.jpg'
        }]);
        const updateAvatarByIdSpy = jest.spyOn(userRepository, 'updateAvatarById').mockImplementationOnce(() => ({
            username: 'Jamie',
            avatarPaths: {
                original: 'path/to/img1',
                small: 'path/to/img2',
                large: 'path/to/img3'
            }
        }));
        const getAbsoluteFileURISpy = jest.spyOn(fileStorageAdapter, 'getAbsoluteFileURI').mockImplementation(() => 'absolute'); // Not mocked once.

        // userService.uploadUserAvatar expects a buffer.
        const user = await userService.uploadUserAvatar(Buffer.from('avatar'));

        // Assert that the mocks were called correctly.
        expect(processAndUploadAvatarImageSpy).toHaveBeenCalledTimes(1);
        expect(processAndUploadAvatarImageSpy).toHaveBeenCalledWith(Buffer.from('avatar'), '123');
        expect(updateAvatarByIdSpy).toHaveBeenCalledTimes(1);
        expect(updateAvatarByIdSpy).toHaveBeenCalledWith('123', {
            original: 'path/to/avatar_original.jpg',
            small: 'path/to/avatar_small.jpg',
            large: 'path/to/avatar_large.jpg'
        });

                // Assert that getAbsoluteFileURISpy was called correctly.
                expect(getAbsoluteFileURISpy).toHaveBeenCalledTimes(3);
                expect(getAbsoluteFileURISpy.mock.calls).toEqual([['path/to/img1'], ['path/to/img2'], ['path/to/img3']]);

        // Assert that the user contains the correct data.
        expect(user).toEqual({
            username: 'Jamie',
            avatarPaths: {
                original: 'absolute',
                small: 'absolute',
                large: 'absolute'
            }
        });
    });

    // null buffer - call uR with default, return correct data.
    test('Should use default avatars and return the correct data for a null buffer', async () => {
        // Spys
        const updateAvatarByIdSpy = jest.spyOn(userRepository, 'updateAvatarById').mockImplementationOnce(() => ({
            username: 'Jamie',
            avatarPaths: appConfig.cloudStorage.avatars.getDefaultAvatarPaths()
        }));
        const getAbsoluteFileURISpy = jest.spyOn(fileStorageAdapter, 'getAbsoluteFileURI').mockImplementation(() => 'absolute'); // Not mocked once.

        const user = await userService.uploadUserAvatar();

        // Assert that the mocks were called correctly.
        expect(updateAvatarByIdSpy).toHaveBeenCalledTimes(1);
        expect(updateAvatarByIdSpy).toHaveBeenCalledWith('123', appConfig.cloudStorage.avatars.getDefaultAvatarPaths());

        // Assert that getAbsoluteFileURISpy was called correctly.
        expect(getAbsoluteFileURISpy).toHaveBeenCalledTimes(3);
        expect(getAbsoluteFileURISpy.mock.calls).toEqual([['original'], ['small'], ['large']]);
                
        // Assert that the user contains the correct data.
        expect(user).toEqual({
            username: 'Jamie',
            avatarPaths: {
                original: 'absolute',
                small: 'absolute',
                large: 'absolute'
            }
        });
    });
    // re-throw errors.
});

describe('#deleteUserAvatar', () => {

});

describe('#retrieveUserAvatarURLById', () => {

});

describe('#_stripSensitiveData', () => {

});

describe('#_transformUser', () => {

});

describe('#_mapRelativeAvatarPathsToAbsoluteAvatarURIs', () => {

});