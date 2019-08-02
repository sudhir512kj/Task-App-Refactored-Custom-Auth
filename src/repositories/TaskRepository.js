
// Custom Errors
const { ValidationError, ResourceNotFoundError } = require('../custom-exceptions/index');

class TaskRepository {
    constructor({ Task }) {
        // Dependency Injection
        this.Task = Task;
    }

    async create(taskData) {
        try {
            // Create the new User Document and attempt to save.
            const task = new this.Task(taskData);
            await task.save();

            return task.toJSON();
        } catch (err) {
            throw err.name === 'ValidationError' ? new ValidationError(err) : err;
        }
    }

    async readByIdWithQuery(id, query, options = {}) {
        try {
            const tasks = await this.Task.find({ _id: id, ...query }, null, options);
            return tasks.map(task => task ? task.toJSON() : null);
        } catch (err) {
            throw err;
        }
    }

    async readByQuery(query, options = {}) {
        try {
            const tasks = await this.Task.find(query, null, options);
            return tasks.map(task => task ? task.toJSON() : null);
        } catch (err) {
            throw err;
        }
    }

    async updateByIdWithQuery(id, query, updates) {
        try {
            // Update and attempt to save. MongoDB won't validate if runValidators is not set to true.
            const task = await this.Task.findOneAndUpdate({ _id: id, ...query }, updates, { new: true, runValidators: true });
            return task ? task.toJSON() : null;
        } catch (err) {
            throw err.name === 'ValidationError' ? new ValidationError(err) : err;
        }
    }

     /**
     * @description Attempts to delete a task by its ID, throwing an error if none is found.
     *
     * @param    {String} id The ID of the task Document to delete.
     * @returns  {Object} The JSON version of the found task.
     * @memberof UserRepository
     */
    async deleteByIdWithQuery(id, query) {
        try {
            // Call the task model.
            const task = await this.Task.findOne({ _id: id, ...query });

            // Throwing if there is no user.
            if (!task) throw new ResourceNotFoundError();

            // Delete the user.
            await task.remove();

            return task.toJSON();
        } catch (err) {
            throw err;
        }
    }
}

module.exports = TaskRepository;