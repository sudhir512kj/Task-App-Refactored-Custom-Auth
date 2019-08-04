/*
 * File: (__tests__/__unit__/src/repositories/UserRepository.test.js)
 *
 * Description: Houses test cases related to the user repository.
 * 
 * Created by Jamie Corkhill on 08/02/2019 at 12:53 PM (Local), 05:53 PM (Zulu)
 */

const UserRepository = require('../../../../src/repositories/UserRepository');

// Custom Exceptions
const {
    ValidationError,
    ResourceNotFoundError
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
        // eslint-disable-next-line prefer-promise-reject-errors
        jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => Promise.reject({ data: 'rejection' }));
        await expect(userRepository.create({ username: 'Jamie' })).rejects.toEqual({ data: 'rejection' });
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
        // eslint-disable-next-line prefer-promise-reject-errors
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject({ data: 'rejection' }));
        await expect(userRepository.updateById('123', { username: 'Jamie' })).rejects.toEqual({ data: 'rejection' });
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err with name) by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(errorFactory('Name')));
        await expect(userRepository.updateById('123', { username: 'Jamie' })).rejects.toEqual(errorFactory('Name'));
    });
});

describe('#updateTokensById', () => {
    test('Should call the correct mock functions and return the correct data', async () => {
        // Spys
        const toJSONSpy = jest.spyOn(User.prototype, 'toJSON').mockImplementationOnce(() => 'json');
        const findByIdAndUpdateSpy = jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.resolve({ toJSON: toJSONSpy }));

        const id = '271828';
        const token = 'abc.def.ghy';

        // userRepository.updateTokensById expects an ID and a token.
        const user = await userRepository.updateTokensById(id, token);

        // Assert that the findByIdAndUpdate function was called correctly.
        expect(findByIdAndUpdateSpy).toHaveBeenCalledTimes(1);
        expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(id, { $push: { tokens: { token } } }, { new: true, runValidators: true });

        // Assert that the toJSON function was called once and that the user contains the correct data.
        expect(toJSONSpy).toHaveBeenCalledTimes(1);
        expect(user).toEqual('json');
    });

    test('Should throw a ValidationError if an error is thrown with that name by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(errorFactory('ValidationError')));
        await expect(userRepository.updateTokensById('123', 'token')).rejects.toEqual(new ValidationError());
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err without name) by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userRepository.updateTokensById('123', 'token')).rejects.toEqual(new Error('Mocked Failure'));
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err with name) by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(errorFactory('Name')));
        await expect(userRepository.updateTokensById('123', 'token')).rejects.toEqual(errorFactory('Name'));
    });
});

describe('#removeTokensById', () => {
    test('Should call the correct mock functions and return the correct data', async () => {
        // Spys
        const toJSONSpy = jest.spyOn(User.prototype, 'toJSON').mockImplementationOnce(() => 'json');
        const findByIdAndUpdateSpy = jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.resolve({ toJSON: toJSONSpy }));

        const id = '271828';
        const token = 'abc.def.ghy';

        // userRepository.removeTokenById expects an ID and a token.
        const user = await userRepository.removeTokenById(id, token);

        // Assert that the findByIdAndUpdate function was called correctly.
        expect(findByIdAndUpdateSpy).toHaveBeenCalledTimes(1);
        expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(id, { $pull: { tokens: { token } } }, { new: true, runValidators: true });

        // Assert that the toJSON function was called once and that the user contains the correct data.
        expect(toJSONSpy).toHaveBeenCalledTimes(1);
        expect(user).toEqual('json');
    });

    test('Should throw a ValidationError if an error is thrown with that name by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(errorFactory('ValidationError')));
        await expect(userRepository.removeTokenById('123', 'token')).rejects.toEqual(new ValidationError());
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err without name) by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userRepository.removeTokenById('123', 'token')).rejects.toEqual(new Error('Mocked Failure'));
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err with name) by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(errorFactory('Name')));
        await expect(userRepository.removeTokenById('123', 'token')).rejects.toEqual(errorFactory('Name'));
    });
});

describe('#removeAllTokensById', () => {
    test('Should call the correct mock functions and return the correct data', async () => {
        // Spys
        const toJSONSpy = jest.spyOn(User.prototype, 'toJSON').mockImplementationOnce(() => 'json');
        const findByIdAndUpdateSpy = jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.resolve({ toJSON: toJSONSpy }));

        const id = '271828';

        // userRepository.removeAllTokensById expects an ID.
        const user = await userRepository.removeAllTokensById(id);

        // Assert that the findByIdAndUpdate function was called correctly.
        expect(findByIdAndUpdateSpy).toHaveBeenCalledTimes(1);
        expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(id, { $set: { tokens: [] } }, { new: true, runValidators: true });

        // Assert that the toJSON function was called once and that the user contains the correct data.
        expect(toJSONSpy).toHaveBeenCalledTimes(1);
        expect(user).toEqual('json');
    });

    test('Should throw a ValidationError if an error is thrown with that name by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(errorFactory('ValidationError')));
        await expect(userRepository.removeAllTokensById('123')).rejects.toEqual(new ValidationError());
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err without name) by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userRepository.removeAllTokensById('123')).rejects.toEqual(new Error('Mocked Failure'));
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err with name) by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(errorFactory('Name')));
        await expect(userRepository.removeAllTokensById('123')).rejects.toEqual(errorFactory('Name'));
    });
});

describe('#updateAvatarById', () => {
    test('Should call the correct mock functions and return the correct data', async () => {
        // Spys
        const toJSONSpy = jest.spyOn(User.prototype, 'toJSON').mockImplementationOnce(() => 'json');
        const findByIdAndUpdateSpy = jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.resolve({ toJSON: toJSONSpy }));

        const id = '271828';
        const avatarPaths = {
            original: 'original',
            small: 'small',
            large: 'large'
        };

        // userRepository.updateAvatarById expects an ID and new avatarPaths.
        const user = await userRepository.updateAvatarById(id, avatarPaths);

        // Assert that the findByIdAndUpdate function was called correctly.
        expect(findByIdAndUpdateSpy).toHaveBeenCalledTimes(1);
        expect(findByIdAndUpdateSpy).toHaveBeenCalledWith(id, { avatarPaths }, { new: true, runValidators: true });

        // Assert that the toJSON function was called once and that the user contains the correct data.
        expect(toJSONSpy).toHaveBeenCalledTimes(1);
        expect(user).toEqual('json');
    });

    test('Should throw a ValidationError if an error is thrown with that name by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(errorFactory('ValidationError')));
        await expect(userRepository.updateAvatarById('123', {})).rejects.toEqual(new ValidationError());
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err without name) by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userRepository.updateAvatarById('123', {})).rejects.toEqual(new Error('Mocked Failure'));
    });

    test('Should throw a generic error if a non-ValidationError is thrown (err with name) by the User Model', async () => {
        jest.spyOn(User, 'findByIdAndUpdate').mockImplementationOnce(() => Promise.reject(errorFactory('Name')));
        await expect(userRepository.updateAvatarById('123', {})).rejects.toEqual(errorFactory('Name'));
    });
});

describe('#readByQuery', () => {
    test('Should call the correct mock functions and return the correct data for a non-null result', async () => {
        // Spys
        const toJSONSpy = jest.spyOn(User.prototype, 'toJSON').mockImplementationOnce(() => 'json');
        const findOneSpy = jest.spyOn(User, 'findOne').mockImplementationOnce(() => Promise.resolve({ toJSON: toJSONSpy }));

        const query = { username: 'Grant Thompson - The King of Random' }; // RIP

        // userRepository.readByQuery expects a query object.
        const user = await userRepository.readByQuery(query);

        // Assert that the findOne function was called correctly.
        expect(findOneSpy).toHaveBeenCalledTimes(1);
        expect(findOneSpy).toHaveBeenCalledWith(query);

        // Assert that the toJSON function was called once and that the user contains the correct data.
        expect(toJSONSpy).toHaveBeenCalledTimes(1);
        expect(user).toEqual('json');
    });

    test('Should call the correct mock functions and return the correct data for a null result', async () => {
        // Spys
        const findOneSpy = jest.spyOn(User, 'findOne').mockImplementationOnce(() => Promise.resolve(null));

        const query = { username: 'Grant Thompson - The King of Random' }; // RIP

        // userRepository.readByQuery expects a query object.
        const user = await userRepository.readByQuery(query);

        // Assert that the findOne function was called correctly.
        expect(findOneSpy).toHaveBeenCalledTimes(1);
        expect(findOneSpy).toHaveBeenCalledWith(query);

        // Assert that the user is null.
        expect(user).toBe(null);
    });

    test('Should re-throw any errors thrown by the User Repository', async () => {
        jest.spyOn(User, 'findOne').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userRepository.readByQuery({ username: 'Jamie' })).rejects.toEqual(new Error('Mocked Failure'));
    });
});

describe('#readById', () => {
    test('Should call the correct mock functions and return the correct data for a non-null result', async () => {
        // Spys
        const toJSONSpy = jest.spyOn(User.prototype, 'toJSON').mockImplementationOnce(() => 'json');
        const findByIdSpy = jest.spyOn(User, 'findById').mockImplementationOnce(() => Promise.resolve({ toJSON: toJSONSpy }));

        const id = '01032010814'; 

        // userRepository.readById expects an ID.
        const user = await userRepository.readById(id);

        // Assert that the findById function was called correctly.
        expect(findByIdSpy).toHaveBeenCalledTimes(1);
        expect(findByIdSpy).toHaveBeenCalledWith(id);

        // Assert that the toJSON function was called once and that the user contains the correct data.
        expect(toJSONSpy).toHaveBeenCalledTimes(1);
        expect(user).toEqual('json');
    });

    test('Should call the correct mock functions and return the correct data for a null result', async () => {
        // Spys
        const findByIdSpy = jest.spyOn(User, 'findById').mockImplementationOnce(() => Promise.resolve(null));

        const id = '01032010814'; 

        // userRepository.readById expects an ID.
        const user = await userRepository.readById(id);

        // Assert that the findOne function was called correctly.
        expect(findByIdSpy).toHaveBeenCalledTimes(1);
        expect(findByIdSpy).toHaveBeenCalledWith(id);

        // Assert that the user is null.
        expect(user).toBe(null);
    });

    test('Should re-throw any errors thrown by the User Repository', async () => {
        jest.spyOn(User, 'findById').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userRepository.readById('123')).rejects.toEqual(new Error('Mocked Failure'));
    });
});

describe('#deleteById', () => {
    test('Should call the correct mock functions and return the correct data for a non-null result', async () => {
        // Spys
        const toJSONSpy = jest.spyOn(User.prototype, 'toJSON').mockImplementationOnce(() => 'json');
        const removeSpy = jest.spyOn(User.prototype, 'remove').mockImplementationOnce(() => 'removed');
        const findByIdSpy = jest.spyOn(User, 'findById').mockImplementationOnce(() => Promise.resolve({ toJSON: toJSONSpy, remove: removeSpy }));

        const id = '01032010814'; 

        // userRepository.deleteById expects an ID.
        const user = await userRepository.deleteById(id);

        // Assert that the findById function was called correctly.
        expect(findByIdSpy).toHaveBeenCalledTimes(1);
        expect(findByIdSpy).toHaveBeenCalledWith(id);

        // Assert that the remove and toJSON functions were called once and that the user contains the correct data.
        expect(removeSpy).toHaveBeenCalledTimes(1);
        expect(toJSONSpy).toHaveBeenCalledTimes(1);
        expect(user).toEqual('json');
    });

    test('Should throw a ResourceNotFoundError if there is a null result from the User Model', async () => {
        // Spys
        jest.spyOn(User, 'findById').mockImplementationOnce(() => Promise.resolve(null));
        await expect(userRepository.deleteById('123')).rejects.toEqual(new ResourceNotFoundError());
    });

    test('Should re-throw any errors thrown by the User Repository', async () => {
        jest.spyOn(User, 'findById').mockImplementationOnce(() => Promise.reject(new Error('Mocked Failure')));
        await expect(userRepository.deleteById('123')).rejects.toEqual(new Error('Mocked Failure'));
    });
});
