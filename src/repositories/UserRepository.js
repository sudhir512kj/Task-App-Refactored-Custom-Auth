
// Custom Errors
const { ValidationError } = require('../custom-exceptions/index');

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

            return user;
        } catch (err) {
            // TODO: Duplicate user error handling.
            throw err.name === 'ValidationError' ? new ValidationError(err) : err;
        }
    }

    async updateById(id, updates) {
        try {
            // Update and attempt to save. MongoDB won't validate if runValidators is not set to true.
            return await this.User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        } catch (err) {
            throw err.name === 'ValidationError' ? new ValidationError(err) : err;
        }
    }

    async updateTokensById(id, token) {
        try {
            // Push the new item into the array.
            return await this.updateById(id, {
                $push: { tokens: { token } }
            });
        } catch (err) {
            // Not determining error here for it will be caught and thrown by `this.updateById` and then re-thrown here.
            throw err;
        }
    }

    async removeTokenById(id, token) {
        try {
            // Pull the provided token from the array.
            return await this.updateById(id, {
                $pull: { tokens: { token } }
            });
        } catch (err) {
            // Not determining error here for it will be caught and thrown by `this.updateById` and then re-thrown here.
            throw err;
        }
    }

    async removeAllTokensById(id) {
        try {
            // Set the user's tokens to be an empty array.
            return await this.updateById(id, {
                $set: { tokens: [] }
            });
        } catch (err) {
            // Not determining error here for it will be caught and thrown by `this.updateById` and then re-thrown here.
            throw err;
        }
    }

    async updateAvatarById(id, newAvatarPaths) {
        try {
            // Update the avatar.
            return await this.updateById(id, { avatarPaths: newAvatarPaths });
        } catch (err) {
            // Not determining error here for it will be caught and thrown by `this.updateById` and then re-thrown here.
            throw err;
        }
    }

    async readByQuery(query) {
        try {
            return await this.User.findOne(query);
        } catch (err) {
            throw err;
        }
    }

    async readById(id) {
        try {
            // Call the model and get the user by their ID.
            return await this.User.findById(id);
        } catch (err) {
            throw err;
        }
    }

    async deleteById(id) {
        try {
            // Call the user model and delete the user with the specified ID.
            return await this.User.findById(id).remove();
        } catch (err) {
            throw err;
        }
    }
}

module.exports = UserRepository;