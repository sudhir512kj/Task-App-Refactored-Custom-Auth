/*
 * File: user.js (src/api/routes/user.js)
 *
 * Description: This file contains all endpoints for different routes. Note that each endpoint contains an inject middleware function which is used by
 * awilix to inject the scoped container fields into the endpoint.
 * 
 * Here is how this works. These endpoints use different middleware functions, namely, `stripBearerToken`, `verifyAuth`, and `inject`. `stripBearerToken`
 * simply attempts to pull an Authorization Bearer Token off the header of the request and sticks it on `req.token`. `auth` takes that `req.token` and
 * attempts to verify that it is valid. Finally, `inject` is used from `awilix-express` to perform Dependency Injection and this achieve Inversion of Control.
 * 
 * Created by Jamie Corkhill on 08/01/2019 at 06:14 PM (Local), 08/02/2019 at 12:14 PM (Zulu)
 */

const express = require('express');
const { inject } = require('awilix-express');

// Middleware
const { stripBearerToken, verifyAuth } = require('./../middleware/index');
 
// Router 
const router = new express.Router();

// POST /api/v1/tasks
/*
 * Description:
 * 1.) Call the TaskService to create a new task.
 * 2.) Return HTTP 201 with the new task.
 */
router.post('/', stripBearerToken, verifyAuth, inject(({ taskService }) => async (req, res) => {
    const task = await taskService.createNewTask(req.body.task);
    return res.status(201).send({ task });
}));

// GET /api/v1/tasks?completed=true/false
// GET /api/v1/tasks?limit=10&skip=20
// GET /api/v1/tasks?sortBy=createdAt_asc
/*
 * Description:
 * 1.) Destructure the fields from req.query.
 * 2.) Create a temporary sort object filled with the sort parameters.
 * 3.) Call the Service passing into it query and options data.
 * 4.) Return the new tasks to the client.
 */
router.get('/', stripBearerToken, verifyAuth, inject(({ taskService }) => async (req, res) => {
    const { completed, sortBy, limit, skip } = req.query;

    // Temporary sort object.
    const sort = {};

    // Strip HTTP Specific data and build a new sort object.
    if (sortBy) {
        const parts = req.query.sortBy.split('_');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    // Attain all tasks based on query data.
    const tasks = await taskService.retrieveTasksByQueryForUser({ 
        completed: typeof completed !== 'undefined' ? completed === 'true' : undefined, 
    }, {
        limit: parseInt(limit, 10), 
        skip: parseInt(skip, 10),
        sort 
    });

    return res.send({ tasks });
}));

// POST /api/v1/tasks
/*
 * Description:
 * 1.) Call the Service to find a task by its ID.
 * 2.) Respond with the task to the client.
 */
router.get('/:id', stripBearerToken, verifyAuth, inject(({ taskService }) => async (req, res) => {
    const task = await taskService.retrieveTaskById(req.params.id);
    return res.send({ task });
}));

// POST /api/v1/tasks
/*
 * Description:
 * 1.) Call the Service to update a task via an updates object.
 * 2.) Respond with the updated task.
 */
router.patch('/:id', stripBearerToken, verifyAuth, inject(({ taskService }) => async (req, res) => {
    const updatedTask = await taskService.updateTaskById(req.params.id, req.body.updates);
    return res.send({ user: updatedTask });
}));

// POST /api/v1/tasks
/*
 * Description:
 * 1.) Call the Service to delete a task by its ID.
 */
router.delete('/:id', stripBearerToken, verifyAuth, inject(({ taskService }) => async (req, res) => {
    await taskService.deleteTaskById(req.params.id);
    return res.send();
}));

module.exports = router;