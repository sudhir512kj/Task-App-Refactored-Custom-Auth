
// Custom Errors
const { ValidationError, ResourceNotFoundError } = require('../custom-exceptions/index');

/**
 * @description - The UserRepository class handles CRUD-related operations on the database.
 *
 * @class UserRepository
 */
class UserRepository {
    constructor({ User }) {
        // Dependency Injection
        this.User = User;
    }

    /*
     * Description:
     * 1.) Create a new user object.
     * 2.) Attempt to save the user (Mongoose Validation error occurs here)
     * 3.) Return the new user, handle any errors.
     */
    /**
     * @description C in CRUD. This function will attempt to create a new user document for the provided `userData` object.
     *
     * @param    {Object} userData An object containing all user fields and an optional ID.
     * @returns  The created user object.
     * @memberof UserRepository
     */
    async create(userData) {
        try {
            // Create the new User Document and attempt to save.
            const user = new this.User(userData);

            await user.save();

            return user.toJSON();
        } catch (err) {
            if (!err.name) throw err;
            throw err.name === 'ValidationError' ? new ValidationError(err) : err;
        }
    }

    /**
     * @description - Updates a user by their ID, validating the updates, and converting to JSON.
     *
     * @param    {String} id      The ID of the user to update.
     * @param    {String} updates The updates object.
     * @returns  The JSON version of the updated user.
     * @memberof UserRepository
     */
    async updateById(id, updates) {
        try {
            // Update and attempt to save. MongoDB won't validate if runValidators is not set to true.
            const user = await this.User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
            return user.toJSON();
        } catch (err) {
            if (!err.name) throw err;
            throw err.name === 'ValidationError' ? new ValidationError(err) : err;
        }
    }

    /**
     * @description Updates a user's tokens array.
     *
     * @param    {String} id    The UD of the user to update.
     * @param    {String} token The new token.
     * @returns  The JSON version of the updated user.
     * @memberof UserRepository
     */
    async updateTokensById(id, token) {
        try {
            // Push the new item into the array. toJSON already called in member method.
            return await this.updateById(id, {
                $push: { tokens: { token } }
            });
        } catch (err) {
            // Not determining error here for it will be caught and thrown by `this.updateById` and then re-thrown here.
            throw err;
        }
    }

    /**
     * @description Updates a user's tokens array.
     *
     * @param    {String} id    The UD of the user to update.
     * @param    {String} token The new token.
     * @returns  The JSON version of the updated user.
     * @memberof UserRepository
     */
    async removeTokenById(id, token) {
        try {
            // Pull the provided token from the array. toJSON already called in member method.
            return await this.updateById(id, {
                $pull: { tokens: { token } }
            });
        } catch (err) {
            // Not determining error here for it will be caught and thrown by `this.updateById` and then re-thrown here.
            throw err;
        }
    }

    /**
     * @description Removes all tokens from the database for a user.
     *
     * @param    {String} id The ID of the user for whom to remove the tokens.
     * @returns  {Object} The JSON version of the updated user.
     * @memberof UserRepository
     */
    async removeAllTokensById(id) {
        try {
            // Set the user's tokens to be an empty array. toJSON already called in member method.
            return await this.updateById(id, {
                $set: { tokens: [] }
            });
        } catch (err) {
            // Not determining error here for it will be caught and thrown by `this.updateById` and then re-thrown here.
            throw err;
        }
    }

    /**
     * @description Updates the paths that point to a user's avatar.
     *
     * @param    {String} id             The ID of the user from whom to update the paths.
     * @param    {Object} newAvatarPaths The new avatar paths which which to perform updates.
     * @returns  {Object} The JSON version of the updated user.
     * @memberof UserRepository
     */
    async updateAvatarById(id, newAvatarPaths) {
        try {
            // Update the avatar. toJSON already called in member method.
            return await this.updateById(id, { avatarPaths: newAvatarPaths });
        } catch (err) {
            // Not determining error here for it will be caught and thrown by `this.updateById` and then re-thrown here.
            throw err;
        }
    }

    /**
     * @description Attempts to find a user by a query object, returning `null` if not found.
     *
     * @param    {Object} query The query object with which to perform a search.
     * @returns  The JSON version of the found user or `null`.
     * @memberof UserRepository
     */
    async readByQuery(query) {
        try {
            const user = await this.User.findOne(query);
            return user ? user.toJSON() : null;
        } catch (err) {
            throw err;
        }
    }

    /**
     * @description Attempts to find a user by their ID, returning `null` if not found.
     *
     * @param    {String} id The ID of the user which which to perform a search.
     * @returns  The JSON version of the found user or `null`.
     * @memberof UserRepository
     */
    async readById(id) {
        try {
            // Call the model and get the user by their ID.
            const user = await this.User.findById(id);
            return user ? user.toJSON() : null;
        } catch (err) {
            throw err;
        }
    }

    /**
     * @description Attempts to delete a user by their ID, throwing an error if none is found.
     *
     * @param    {String} id The ID of the User Document to delete.
     * @returns  {Object} The JSON version of the found user
     * @memberof UserRepository
     */
    async deleteById(id) {
        try {
            // Call the user model and delete the user with the specified ID.
            const user = await this.User.findById(id);

            // Throwing if there is no user.
            if (!user) throw new ResourceNotFoundError();

            // Delete the user.
            await user.remove();

            return user.toJSON();
        } catch (err) {
            throw err;
        }
    }
}

module.exports = UserRepository;