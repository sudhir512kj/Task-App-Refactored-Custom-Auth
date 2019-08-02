/*
 * File: (__tests__/__unit__/src/repositories/UserRepository.test.js)
 *
 * Description: Houses test cases related to the user repository.
 * 
 * Created by Jamie Corkhill on 08/02/2019 at 12:53 PM (Local), 05:53 PM (Zulu)
 * 
 */

const UserRepository = require('../../../../src/repositories/UserRepository');

// Custom Exceptions
const {
    ValidationError
} = require('./../../../../src/custom-exceptions/index');

// Models - User
// eslint-disable-next-line import/newline-after-import
const User = require('./../../../../src/models/user');
jest.mock('./../../../../src/models/user');

// System Under Test
const userRepository = new UserRepository({ User });

// Factory to dynamically created named errors.
const errorFactory = name => {
    const error = new Error('Mocked Failure');
    error.name = name;
    return error;
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

describe('#create', () => {
    test('Should call the correct mock functions and return the correct data', async () => {
        // Spys
        const saveSpy = jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => Promise.resolve());
        const toJSONSpy = jest.spyOn(User.prototype, 'toJSON').mockImplementationOnce(() => 'json');
    
        const userData = {
            username: 'Bill Gates',
            password: 'Microsoft'
        };
    
        // userRepository.create expects a userData object. This is a minified version.
        const user = await userRepository.create(userData);
    
        // Assert that the model's constructor function was called correctly.
        expect(User).toHaveBeenCalledTimes(1);
        expect(User).toHaveBeenCalledWith(userData);
    
        // Assert that the save and toJSON functions were called once.
        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(toJSONSpy).toHaveBeenCalledTimes(1);
    
        // Assert that the return result contains the correct data.
        expect(user).toEqual('json');
    });

    test('Should throw a ValidationError if an error is thrown with that name by the User Model', async () => {
        jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => Promise.reject(errorFactory('ValidationError')));
        await expect(userRepository.create({ username: 'Jamie' })).rejects.toEqual(new ValidationError());
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err without name) by the User Model', async () => {
        jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userRepository.create({ username: 'Jamie' })).rejects.toEqual(new Error('Mocked Failure'));
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err with name) by the User Model', async () => {
        jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => Promise.reject(errorFactory('Name')));
        await expect(userRepository.create({ username: 'Jamie' })).rejects.toEqual(errorFactory('Name'));
    });
});

describe('#updateById', () => {
    test('Should call the correct mocks functions and return the correct data', async () => {
        // Spys
        const toJSONSpy = jest.spyOn(User.prototype, 'toJSON').mockImplementationOnce(() => 'json');
        const findByIdAndUpdateSpy = jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.resolve({ toJSON: toJSONSpy }));

        const id = '314';
        const updates = {
            username: 'Alan Touring'
        };

        // userRepository.updateById expects and id and an updates object.
        const user = await userRepository.updateById(id, updates);

        // Assert that the findByIdAndUpdate function was called correctly.
        expect(findByIdAndUpdateSpy).toHaveBeenCalledTimes(1);
        expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(id, updates, { new: true, runValidators: true });

        // Assert that the toJSON function was called once and that the user contains the correct data.
        expect(toJSONSpy).toHaveBeenCalledTimes(1);
        expect(user).toEqual('json');
    });

    test('Should throw a ValidationError if an error is thrown with that name by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(errorFactory('ValidationError')));
        await expect(userRepository.updateById('123', { username: 'Jamie' })).rejects.toEqual(new ValidationError());
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err without name) by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userRepository.updateById('123', { username: 'Jamie' })).rejects.toEqual(new Error('Mocked Failure'));
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err with name) by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(errorFactory('Name')));
        await expect(userRepository.updateById('123', { username: 'Jamie' })).rejects.toEqual(errorFactory('Name'));
    });
});

describe('#updateTokensById', () => {

});

describe('#removeTokensById', () => {

});

describe('#removeAllTokensById', () => {

});

describe('#updateAvatarById', () => {

});

describe('#readByQuery', () => {

});

describe('#readById', () => {

});

describe('#deleteById', () => {

});
