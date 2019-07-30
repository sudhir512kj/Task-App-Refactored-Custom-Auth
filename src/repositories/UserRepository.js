
// Custom Errors
const { ValidationError, ResourceNotFoundError } = require('../custom-exceptions/index');

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
            throw err.name === 'ValidationError' ? new ValidationError(err) : err;
        }
    }

    async updateById(id, updates) {
        try {
            // Update and attempt to save. MongoDB won't validate if runValidators is not set to true.
            const user = await this.User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
            return user.toJSON();
        } catch (err) {
            throw err.name === 'ValidationError' ? new ValidationError(err) : err;
        }
    }

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

    async updateAvatarById(id, newAvatarPaths) {
        try {
            // Update the avatar. toJSON already called in member method.
            return await this.updateById(id, { avatarPaths: newAvatarPaths });
        } catch (err) {
            // Not determining error here for it will be caught and thrown by `this.updateById` and then re-thrown here.
            throw err;
        }
    }

    async readByQuery(query) {
        try {
            const user = await this.User.findOne(query);
            return user ? user.toJSON() : null;
        } catch (err) {
            throw err;
        }
    }

    async readById(id) {
        try {
            // Call the model and get the user by their ID.
            const user = await this.User.findById(id);
            return user ? user.toJSON() : null;
        } catch (err) {
            throw err;
        }
    }

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