/*
 * File: TaskService.test.js (__tests__/__unit__/src/services/TaskService.test.js)
 *
 * Description: Houses unit test cases for the TaskService.
 * 
 * Created by Jamie Corkhill on 08/09/2019 at 06:39 PM (Local), 11:39 PM (Zulu)
 */

// SUT:
const TaskService = require('./../../../../src/services/TaskService');

// Dependencies
const TaskRepository = require('./../../../../src/repositories/TaskRepository');

// Instances of dependencies for spying.
const taskRepository = new TaskRepository();

// Mock dependencies.
jest.mock('./../../../../src/repositories/TaskRepository');

// Custom Exceptions:
const { ValidationError, ResourceNotFoundError } = require('./../../../../src/custom-exceptions/index');

const contextMock = {
    user: {
        _id: '123'
    }
};

// Service Factory
const taskServiceFactory = (contextOverride = {}) => new TaskService({
    taskRepository,
    context: {
        ...contextMock,
        ...contextOverride
    }
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe('#constructor', () => {
    test('Should correctly set instance variables in the constructor', () => {
        // Call the constructor of the System Under Test.
        const taskService = new TaskService({ taskRepository: 'data', context: 'data2' });
 
        // Assert that instance variables were set correctly.
        expect(taskService.taskRepository).toEqual('data');
        expect(taskService.context).toEqual('data2');
    });
});

describe('#createNewTask', () => {
    test('Should throw a ValidationError if no user data is provided', async () => {
        await expect(taskServiceFactory().createNewTask()).rejects.toEqual(new ValidationError());
    });
  
    test('Should all the correct mock functions for valid data', async () => {
        const createSpy = jest.spyOn(taskRepository, 'create').mockResolvedValueOnce('created');

        // Call the System Under Test.
        const createdTask = await taskServiceFactory().createNewTask({
            description: 'a task'
        });

        // Assert that the mocks were called correctly.
        expect(createSpy).toHaveBeenCalledTimes(1); 
        expect(createSpy).toHaveBeenCalledWith({
            description: 'a task',
            owner: contextMock.user._id
        }); 

        // Assert that the response contains the correct data.
        expect(createdTask).toEqual('created');
    });
});

describe('#retrieveTasksByQueryForUser', () => {
    test('Should call the mock correctly for a defined completed property on the query', async () => {
        const readByQuerySpy = jest.spyOn(taskRepository, 'readByQuery').mockResolvedValueOnce('read data');

        // System Under Test:
        const task = await taskServiceFactory().retrieveTasksByQueryForUser({ completed: true }, { limit: 10 });

        // Assert that the mocks were called correctly.
        expect(readByQuerySpy).toHaveBeenCalledTimes(1);
        expect(readByQuerySpy).toHaveBeenCalledWith({
            owner: contextMock.user._id,
            completed: true
        }, {
            limit: 10
        });

        // Assert that the function returns the read user.
        expect(task).toEqual('read data');
    });

    test('Should call the mock correctly for a defined query with an undefined completed property on the query', async () => {
        const readByQuerySpy = jest.spyOn(taskRepository, 'readByQuery').mockResolvedValueOnce('read data');

        // System Under Test:
        const task = await taskServiceFactory().retrieveTasksByQueryForUser({}, { limit: 10 });

        // Assert that the mocks were called correctly.
        expect(readByQuerySpy).toHaveBeenCalledTimes(1);
        expect(readByQuerySpy).toHaveBeenCalledWith({
            owner: contextMock.user._id,
        }, {
            limit: 10
        });

        // Assert that the function returns the read user.
        expect(task).toEqual('read data');
    });

    test('Should call the mock correctly when no query is provided', async () => {
        const readByQuerySpy = jest.spyOn(taskRepository, 'readByQuery').mockResolvedValueOnce('read data');

        // System Under Test:
        const task = await taskServiceFactory().retrieveTasksByQueryForUser(null, { limit: 10 });

        // Assert that the mocks were called correctly.
        expect(readByQuerySpy).toHaveBeenCalledTimes(1);
        expect(readByQuerySpy).toHaveBeenCalledWith({
            owner: contextMock.user._id,
        }, {
            limit: 10
        });

        // Assert that the function returns the read user.
        expect(task).toEqual('read data');
    });
});

describe('#retrieveTaskById', () => {
    test('Should throw a ResourceNotFoundError if no task is returned', async () => {
        jest.spyOn(taskRepository, 'readByIdWithQuery').mockResolvedValueOnce([]);
        await expect(taskServiceFactory().retrieveTaskById('id')).rejects.toEqual(new ResourceNotFoundError());
    });
    
    test('Should call the mock function correctly and return the correct data', async () => {
        const readByIdWithQuerySpy = jest.spyOn(taskRepository, 'readByIdWithQuery').mockResolvedValueOnce(['task']);

        const task = await taskServiceFactory().retrieveTaskById('id');

        // Assert that the mocks were called correctly.
        expect(readByIdWithQuerySpy).toHaveBeenCalledTimes(1);
        expect(readByIdWithQuerySpy).toHaveBeenCalledWith('id', { owner: contextMock.user._id });

        // Assert that the task is correct.
        expect(task).toBe('task');
    });
});

describe('#updateTaskById', () => {
    // No updated document -RNFE.
    // Mocks correct.

    test('Should throw a ValidationError if updates are invalid', async () => {
        await expect(taskServiceFactory().updateTaskById('id', { _id: 'new' })).rejects.toEqual(new ValidationError());
    });  
    
    test('Should throw a ValidationError if no updates are provided', async () => {
        await expect(taskServiceFactory().updateTaskById('id')).rejects.toEqual(new ValidationError());
    });

    test('Should throw a ResourceNotFoundError if no task is updated', async () => {
        jest.spyOn(taskRepository, 'updateByIdWithQuery').mockResolvedValueOnce(null);
        await expect(taskServiceFactory().updateTaskById('id', { completed: false })).rejects.toEqual(new ResourceNotFoundError());
    });

    test('Should call the mock functions correctly for valid data', async () => {
        const updateByIdWithQuerySpy = jest.spyOn(taskRepository, 'updateByIdWithQuery').mockResolvedValueOnce('task');
        const task = await taskServiceFactory().updateTaskById('id', { description: 'new' });

        // Assert that the mocks were called correctly.
        expect(updateByIdWithQuerySpy).toHaveBeenCalledTimes(1);
        expect(updateByIdWithQuerySpy).toHaveBeenCalledWith('id', { owner: contextMock.user._id }, { description: 'new' });

        // Assert that the task contains the correct data.
        expect(task).toBe('task');
    });
});

describe('#deleteTaskById', () => {
    test('Should correctly call the mock function', async () => {
        const deleteByIdWithQuerySpy = jest.spyOn(taskRepository, 'deleteByIdWithQuery').mockResolvedValueOnce('deleted');
        await taskServiceFactory().deleteTaskById('id');
        
        // Assert that the mock was called correctly.
        expect(deleteByIdWithQuerySpy).toHaveBeenCalledTimes(1);
        expect(deleteByIdWithQuerySpy).toHaveBeenCalledWith('id', { owner: contextMock.user._id });
    });
});