/*
 * File: TaskService.js (src/services/TaskService.js)
 *
 * Description: This class encapsulates all primary business logic as it pertains to performing task related operations, namely those that require the
 * manipulation of a database, but there are others involved as well. We also extend the EventEmitter class, thus creating a Pub/Sub Architecture, and
 * permitting other files/functions, called subscribers, to watch (subscribe to) for events emitted from this class. 
 * 
 * Notice that the TaskRepository is injected into this class from the Injected Service Locator via Dependency Injection as a method by which to attain
 * Inversion of Control. In this way, and for the purposes of Test Driven Development, it becomes easier to mock individual required dependencies.
 * 
 * Emitted Events and Purpose:
 * -
 * -
 * -
 * 
 * Created by Jamie Corkhill on 08/01/2019 at 06:25 PM (Local), 08/02/2019 at 12:25 PM (Zulu)
 */

const EventEmitter = require('events');
const { ValidationError, ResourceNotFoundError } = require('./../custom-exceptions/index');

class TaskService extends EventEmitter {
    constructor({ taskRepository, context }) {
         // Extending EventEmitter, call the super class.
         super();
         // Dependency Injection
         this.taskRepository = taskRepository;
         this.context = context;
    }

    /*
     * Description:
     * 1.) If task data is not provided, throw a ValidationError.
     * 2.) Return the newly created task.
     */
    /**
     * @description - Performs the required operations to create a new task.
     *
     * @param   {Object} taskData The task object containing properties for the task.
     * @returns {Object} The created task.
     * @memberof TaskService
     */
    async createNewTask(taskData) {
        try {
            if (!taskData) throw new ValidationError();

            // Call the repository to create a new task.
            return await this.taskRepository.create({ ...taskData, owner: this.context.user._id });
        } catch (err) {
            throw err;
        }
    }

    /*
     * Description:
     * 1.) Assign the `completed` value to `match` if there is one.
     * 2.) Return the found tasks.
     */
    /**
     * @description - Performs the required operations to to attain an array of tasks by a query.
     *
     * @param   {Object} query   The search query.
     * @param   {Object} options Formatting, sorting, and pagination options.
     * @returns {Array} The found tasks.
     * @memberof TaskService
     */
    async retrieveTasksByQueryForUser(query, options) {
        try {
            // A temporary object of match constraints.
            const match = {};

            if (query) {
                // Match by completed if there is an existing completed value.
                if (typeof query.completed !== 'undefined') {
                    match.completed = query.completed;
                }
            }

            // Call the repository to attain all tasks by the provided options.
            return await this.taskRepository.readByQuery({
                owner: this.context.user._id,
                ...match
            }, options);
        } catch (err) {
            throw err;
        }
    }

    /*
     * Description:
     * 1.) Call the Repository to find the task by its ID, throwing a ResourceNotFoundError if there is not one.
     * 2.) Return the result.
     */
    /**
     * @description - Attempts to find a task by its ID, returning a ResourceNotFoundError if there is not one.
     *
     * @param    {String} id The ID of the task to find.
     * @returns  {Object} The found task.
     * @memberof TaskService
     */
    async retrieveTaskById(id) {
        try {
            const tasks = await this.taskRepository.readByIdWithQuery(id, { owner: this.context.user._id });

            if (tasks.length === 0) throw new ResourceNotFoundError();

            return tasks[0];
        } catch (err) {
            throw err;
        }
    }

    async updateTaskById(id, requestedUpdates = {}) {
        try {
            // Create an empty allowed updates object and enumerate `requestedUpdates` keys.
            const validUpdates = {};
            const updateKeys = Object.keys(requestedUpdates);

            // Abort if no updates have been provided.
            if (updateKeys.length === 0) throw new ValidationError();
            
            // Verify that the requested updates are valid.
            const allowedUpdates = ['description', 'completed'];
            const isValidOperation = updateKeys.every(update => allowedUpdates.includes(update));

            if (!isValidOperation) throw new ValidationError();

            // Note: `validUpdates` could contain a plain-text password at this point. This is resolved below.
            // eslint-disable-next-line no-return-assign
            updateKeys.forEach(updateKey => validUpdates[updateKey] = requestedUpdates[updateKey]);

            const updatedTask = await this.taskRepository.updateByIdWithQuery(id, {
                owner: this.context.user._id,
            }, validUpdates);

            if (!updatedTask) throw new ResourceNotFoundError();

            return updatedTask;
        } catch (err) {
            throw err;
        }
    }

    async deleteTaskById(id) {
        try {
            await this.taskRepository.deleteByIdWithQuery(id, { owner: this.context.user._id });
        } catch (err) {
            throw err;
        }
    }
}
module.exports = TaskService;