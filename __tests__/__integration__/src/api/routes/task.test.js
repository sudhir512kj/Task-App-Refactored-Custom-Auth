/*
 * File: task.test.js (__tests__/__integration__/src/api/routes/task.test.js)
 *
 * Description: Houses Integration Test cases for the Task Routes.
 * 
 * Created by Jamie Corkhill on 08/02/2019 at 12:29 AM (Local), 05:29 AM (Zulu)
 */

const supertest = require('supertest');

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
const Task = require('./../../../../../src/models/task');

// Data Fixtures
const {
    // Configuration Functions
    configureDatabase,
    cleanDatabaseResultObject,
    // Fixture Data
    userOne,
    userTwo,
    taskOne,
    taskTwo,
    taskThree
    // Other
} = require('./../../../fixtures/database/setup');

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
afterAll(async () => {
    await tearDownServerAndDatabaseConnectionForJest(connection, server);
});

/* ==================== Integration Test Cases ==================== */

// POST /api/v1/tasks
describe('Create Task', () => {
    const ROUTE = '/api/v1/tasks';
    test('Should correctly create a task for an authenticated user posting valid data', async () => {
        // Assert HTTP Response Status 201 Created.
        const response = await agent
            .post(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send({
                task: {
                    description: 'A task'
                }
            })
            .expect(201);

        // Attempt to find the task object in the database.
        const task = await Task.findById(response.body.task._id);

        // Remove the timestamp and version fields from the task object.
        const cleanTask = cleanDatabaseResultObject(task.toJSON());

        // The expected result.
        const expectedTask = {
            description: 'A task',
            completed: false,
            owner: userOne.userOneBody._id.toString(),
            _id: expect.any(String)
        };

        // Assert that the task contains the correct data.
        expect(cleanTask).toEqual(expectedTask);

        // Assert that the response body contains the correct data.
        expect(response.body).toEqual({ task: expect.any(Object) });
        expect(cleanDatabaseResultObject(response.body.task)).toEqual(expectedTask);
    });

    test('Should return an HTTP 400 for invalid task data if a user is authenticated', async () => {
        // Assert HTTP Response Status 400 Bad Request.
        const response = await agent
            .post(ROUTE)
            .set('Authorization', `Bearer ${userTwo.userTwoBody.tokens[0].token}`)
            .send()
            .expect(400);

        // Assert that there is no task in the database.
        const task = await Task.findOne({ owner: userTwo.userTwoBody._id });
        expect(task).toBe(null);

        // Assert that the response body contains the correct error.
        expect(response.body).toEqual({
            error: new ValidationError().message
        });
    });

    test('Should not upload a task for an unauthenticated user', async () => {
        // Assert HTTP Response Status 401 Unauthorized.
        const response = await agent
            .post(ROUTE)
            .send({
                task: {
                    description: 'A task'
                }
            })
            .expect(401);

        // Assert that the response body contains the correct error.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });
    });
});

describe('Read Tasks', () => {
    test('Should return an array of tasks in the correct order and with the correct fields for an authenticated user who owns the tasks', async () => {
        // Assert HTTP Response Status 200 OK
        const response = await agent
            .get('/api/v1/tasks')
            .query({ completed: 'true', sortBy: 'createdAt_desc' })
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send()
            .expect(200);
        
        // Assert that the response tasks are correct.
        const cleanTasks = response.body.tasks.map(task => cleanDatabaseResultObject(task));
        expect(cleanTasks).toEqual([{
            ...taskThree,
            _id: taskThree._id.toString(),
            owner: taskThree.owner.toString()
        }, {
            ...taskTwo,
            _id: taskTwo._id.toString(),
            owner: taskTwo.owner.toString()
        }]);
    });

    test('Should not return any tasks for an unauthenticated user', async () => {
        // Assert HTTP Response Status 401 Unauthorized.
        const response = await agent
            .get('/api/v1/tasks')
            .send()
            .expect(401);

        // Assert that the response contains the correct error.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });
    });

    test('Should return a task by ID if a user is authenticated and if the user owns the task', async () => {
        // Assert HTTP Response Status 200 OK
        const response = await agent
            .get(`/api/v1/tasks/${taskOne._id.toString()}`)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send()
            .expect(200);

        // Assert that the response contains the correct data.
        expect(cleanDatabaseResultObject(response.body.task)).toEqual({
            ...taskOne,
            _id: taskOne._id.toString(),
            owner: taskOne.owner.toString()
        });
    });

    test('Should not return a task that the requester does not own', async () => {
        // Assert HTTP Response Status 404 Not Found
        const response = await agent
            .get(`/api/v1/tasks/${taskOne._id.toString()}`)
            .set('Authorization', `Bearer ${userTwo.userTwoBody.tokens[0].token}`)
            .send()
            .expect(404);

        // Assert that the response body contains the correct error.
        expect(response.body).toEqual({
            error: new ResourceNotFoundError().message
        });
    });

    test('Should not return a task for an unauthenticated user', async () => {
        // Assert HTTP Response Status 401 Unauthorized.
        const response = await agent
            .get(`/api/v1/tasks/${taskOne._id.toString()}`)
            .send({
                task: {
                    description: 'A task'
                }
            })
            .expect(401);

        // Assert that the response body contains the correct error.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });
    });
});

// PATCH /api/v1/tasks/:id
describe('Update Task', () => {
    const ROUTE = `/api/v1/tasks/${taskOne._id}`;
    test('Should update task with valid updates for an authenticated user who owns the task', async () => {
        // Assert HTTP Response Status 200 OK
        const response = await agent
            .patch(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send({
                updates: {
                    completed: true
                }
            })
            .expect(200);

        // Attempt to find the task in the database.
        const task = await Task.findById(taskOne._id);

        // Remove the timestamp and version fields.
        const cleanTask = cleanDatabaseResultObject(task.toJSON());

        // The expected result object.
        const expectedTask = {
            ...taskOne,
            completed: true,
            _id: taskOne._id.toString(),
            owner: taskOne.owner.toString()
        };

        // Assert that the database contains the correct data.
        expect(cleanTask).toEqual(expectedTask);

        // Assert that the response contains the correct daa.
        expect(cleanDatabaseResultObject(response.body.task)).toEqual(expectedTask);
    });

    test('Should not update a task with valid updates for an authenticated user who does not own the task', async () => {
        // Assert HTTP Response Status 404 Resource Not Found
        const response = await agent
            .patch(ROUTE)
            .set('Authorization', `Bearer ${userTwo.userTwoBody.tokens[0].token}`)
            .send({
                updates: {
                    completed: true
                }
            })
            .expect(404);
        
        // Attempt to find the task in the database.
        const task = await Task.findById(taskOne._id);

        // Remove the timestamp and version fields.
        const cleanTask = cleanDatabaseResultObject(task.toJSON());

        // The expected result object.
        const expectedTask = {
            ...taskOne,
            completed: false,
            _id: taskOne._id.toString(),
            owner: taskOne.owner.toString()
        };

        // Assert that the database remains unchanged.
        expect(cleanTask).toEqual(expectedTask);

        // Assert that the response body contains the correct error message.
        expect(response.body).toEqual({
            error: new ResourceNotFoundError().message
        });
    });

    test('Should not update a task with invalid updates for an authenticated user', async () => {
        // Assert HTTP Response Status 400 Bad Request
        const response = await agent
            .patch(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send({
                updates: {
                    completed: true,
                    _id: 'bad-id'
                }
            })
            .expect(400);
        
        // Attempt to find the task in the database.
        const task = await Task.findById(taskOne._id);

        // Remove the timestamp and version fields.
        const cleanTask = cleanDatabaseResultObject(task.toJSON());

        // The expected result object.
        const expectedTask = {
            ...taskOne,
            completed: false,
            _id: taskOne._id.toString(),
            owner: taskOne.owner.toString()
        };

        // Assert that the database remains unchanged.
        expect(cleanTask).toEqual(expectedTask);

        // Assert that the response body contains the correct error message.
        expect(response.body).toEqual({
            error: new ValidationError().message
        });
    });

    test('Should throw a ValidationError for an authenticated user who does not sound updates', async () => {
        // Assert HTTP Response Status 400 Bad Request
        const response = await agent
            .patch(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send()
            .expect(400);
        
        // Attempt to find the task in the database.
        const task = await Task.findById(taskOne._id);

        // Remove the timestamp and version fields.
        const cleanTask = cleanDatabaseResultObject(task.toJSON());

        // The expected result object.
        const expectedTask = {
            ...taskOne,
            completed: false,
            _id: taskOne._id.toString(),
            owner: taskOne.owner.toString()
        };

        // Assert that the database remains unchanged.
        expect(cleanTask).toEqual(expectedTask);

        // Assert that the response body contains the correct error message.
        expect(response.body).toEqual({
            error: new ValidationError().message
        });
    });

    test('Should not update a task for an unauthenticated user', async () => {
        // Assert HTTP Response Status 401 Unauthorized.
        const response = await agent
            .patch(`/api/v1/tasks/${taskOne._id.toString()}`)
            .send({
                task: {
                    description: 'A task'
                }
            })
            .expect(401);

        // Assert that the response body contains the correct error.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });
    });
});

// DELETE /api/v1/tasks/:id
describe('Delete Task', () => {
    const ROUTE = `/api/v1/tasks/${taskOne._id}`;
    test('Should correctly delete a task for an authenticated user who owns the task', async () => {
        // Assert HTTP Response Status 200 OK
        await agent
            .delete(ROUTE)
            .set('Authorization', `Bearer ${userOne.userOneBody.tokens[0].token}`)
            .send()
            .expect(200);

        // Assert that the task no longer exists in the database.
        const task = await Task.findById(taskOne._id);
        expect(task).toBe(null);
    });

    test('Should not delete a task for an authenticated user who does not own the task', async () => {
        // Assert HTTP Response Status 404 Resource Not Found
        const response = await agent
            .delete(ROUTE)
            .set('Authorization', `Bearer ${userTwo.userTwoBody.tokens[0].token}`)
            .send()
            .expect(404);

        // Assert that the task no longer exists in the database.
        const task = await Task.findById(taskOne._id);
        expect(task).not.toBe(null);

        // Assert that the response body contains the correct error.
        expect(response.body).toEqual({
            error: new ResourceNotFoundError().message
        });
    });

    test('Should not delete a task for an unauthenticated user', async () => {
        // Assert HTTP Response Status 401 Unauthorized.
        const response = await agent
            .delete(ROUTE)
            .send()
            .expect(401);

        // Assert that the task no longer exists in the database.
        const task = await Task.findById(taskOne._id);
        expect(task).not.toBe(null);

        // Assert that the response body contains the correct error.
        expect(response.body).toEqual({
            error: new AuthenticationError().message
        });
    });
});