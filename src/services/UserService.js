/*
 * File: UserService.js (src/services/UserService.js)
 *
 * Description: This class encapsulates all primary business logic as it pertains to performing user related operations, namely those that require the
 * manipulation of a database, but there are others involved as well. We also extend the EventEmitter class, thus creating a Pub/Sub Architecture, and
 * permitting other files/functions, called subscribers, to watch (subscribe to) for events emitted from this class. 
 * 
 * Notice that the UserRepository is injected into this class from the Injected Service Locator via Dependency Injection as a method by which to attain
 * Inversion of Control. In this way, and for the purposes of Test Driven Development, it becomes easier to mock individual required dependencies.
 * 
 * Emitted Events and Purpose:
 * -
 * -
 * -
 * 
 * Created by Jamie Corkhill on 07/28/2019 at 05:10 PM (Local), 10:10 PM (Zulu)
 */

const EventEmitter = require('events');
const { ValidationError, AuthenticationError, ResourceNotFoundError } = require('./../custom-exceptions/index');

class UserService extends EventEmitter {
    constructor(
        { 
            userRepository, 
            authenticationService, 
            passwordService, 
            fileStorageService, 
            fileStorageAdapter, 
            appConfig, 
            context 
        }
    ) {
        // Extending EventEmitter, call the super class.
        super();
        // Dependency Injection
        this.userRepository = userRepository;
        this.authenticationService = authenticationService;
        this.passwordService = passwordService;
        this.fileStorageService = fileStorageService;
        this.fileStorageAdapter = fileStorageAdapter;
        this.appConfig = appConfig;
        this.context = context;
    }

    async signUpNewUser(userData) {
        // TODO: Bad request if data not sent up right.
        try {
            // Hash the user's password.
            const hashedPassword = await this.passwordService.hash(userData.password);

            // Create a safe user object to store with no sensitive data in plain-text.
            const cleanUser = {
                ...userData,
                password: hashedPassword
            };

            // Save the user to the database.
            const userPreToken = await this.userRepository.create(cleanUser);

            // TODO: Emit events for analytics, cron-jobs, email on-boarding, etc.
            // TODO: this.eventEmitter.emit('signed_up_user', { email, name });

            // Attain an authentication token for the user.
            const token = this.authenticationService.generateAuthToken(userPreToken._id);

            // Update the user in the database to save his/her token.
            const userWithToken = await this.userRepository.updateTokensById(userPreToken._id, token);

            // Transform the avatar relative paths to absolute URIs if an avatar has been provided.
            userWithToken.avatarPaths = userWithToken.avatarPaths.original !== 'no-profile' ? (
                this._mapRelativeAvatarPathsToAbsoluteAvatarURIs(userWithToken.avatarPaths) 
            ) : (
                userWithToken.avatarPaths
            );

            return {
                user: userWithToken,
                token
            };
        } catch (err) {
            throw err;
        }
    }

    async loginUser(email, password) {
        try {
            // Attempt to find the user by their email.
            const user = await this.userRepository.readByQuery({ email });

            // Determine whether the user is authenticated by checking passwords and existence.
            const isAuthenticated = user && user.password ? (
                // Determine whether the hash of the provided password and the stored hash password match.
                await this.passwordService.compare(password, user.password)
            ) : false;

            // Either the user could not be found or their hashed passwords don't match.
            if (!isAuthenticated) throw new AuthenticationError();
           
            // Attain an authentication token for the user.
            const token = this.authenticationService.generateAuthToken(user._id);

            // Update the user in the database to save his/her token.
            const userWithToken = await this.userRepository.updateTokensById(user._id, token);

            // The user is authorized.
            return {
                user: userWithToken,
                token
            };
        } catch (err) {
            throw err;
        }
    }

    async logoutUser(token) {
        try {
            // Remove the user's existing token from the database.
            return this.userRepository.removeTokenById(this.context.user._id, token);
        } catch (err) {
            throw err;
        }
    }

    async logoutUserAll() {
        try {
            // Remove all of the user's tokens from the database.
            return this.userRepository.removeAllTokensById(this.context.user._id);
        } catch (err) {
            throw err;
        }
    }

    async retrieveUserById(id) {
        try {
            const { user: authenticatedUser } = this.context;

            // Check if the requested user is the logged in user.
            if (authenticatedUser != null && authenticatedUser._id === id) {
                // We don't need to make a network call and can return the user straight away.
                return UserService._cleanUser(authenticatedUser.toJSON());
            }

            // Attempt to find the user in the database.
            const user = await this.userRepository.readById(id);

            const cleanUser = UserService._cleanUser(user.toJSON());

            // TODO: Transform avatar paths.

            return cleanUser;
        } catch (err) {
            throw err;  
        }
    }    

    async retrieveUserByQuery(query) {
        try {
            // TODO: Do we want to throw a ResourceNotFoundError here?
            const user = await this.userRepository.readByQuery(query);

            return user;
        } catch (err) {
            throw err;
        }
    }

    async updateUser(requestedUpdates) {
        // TODO: 400 for no updates.
        try {
            // Verify that the requested updates are valid.
            const validUpdates = {};
            const updateKeys = Object.keys(requestedUpdates);
            const allowedUpdates = ['name', 'email', 'password', 'age'];
            const isValidOperation = updateKeys.every(update => allowedUpdates.includes(update));

            if (!isValidOperation) throw new ValidationError();

            // Note: `validUpdates` could contain a plain-text password at this point. This is resolved below.
            // eslint-disable-next-line no-return-assign
            updateKeys.forEach(updateKey => validUpdates[updateKey] = requestedUpdates[updateKey]);

            // If the user is updating their password, hash the password before saving it.
            if (updateKeys.includes('password')) {
                validUpdates.password = await this.passwordService.hash(requestedUpdates.password);
            }

            return await this.userRepository.updateById(this.context.user._id, validUpdates);
        } catch (err) {
            throw err;
        }
    }

    async deleteUser() {
        // TODO: Delete Tasks.
        // TODO: Send cancellation emails.

        await this.userRepository.deleteById(this.context.user._id);
    }

    async uploadUserAvatar(avatarBuffer) {
        const { _id } = this.context.user;
        try {
            // In the event that the user decides not to upload an avatar image.
            if (!avatarBuffer) {
                // Using default avatar.
                const updatedUser = await this.userRepository
                    .updateAvatarById(_id, this.appConfig.cloudStorage.avatars.getDefaultAvatars());

                // TODO: Transform the avatar relative paths to absolute URIs.
                
                return updatedUser;
            }

            /* An avatar image has been provided if we make it to here. */

            // Upload and process the avatar image.
            const result = await this.fileStorageService.processAndUploadAvatarImage(avatarBuffer, _id);

            // Temporary object.
            const avatarPaths = {};

            // Map through the result array and add a new property to `avatarPaths` containing the relative key (path).
            result.forEach(({ Key }) => {
                avatarPaths[Key.substring(Key.lastIndexOf('_') + 1, Key.lastIndexOf('.'))] = Key;
            });

            // Attain the updated user after updating the avatar paths.
            const updatedUser = await this.userRepository.updateAvatarById(_id, avatarPaths);

            // Transform the avatar relative paths to absolute URIs. Could also use result[i].Location, but it's better to stick with one source of truth
            // for mapping.
            updatedUser.avatarPaths = this._mapRelativeAvatarPathsToAbsoluteAvatarURIs(updatedUser.avatarPaths);

            // We obviously need to settle this promise with the new user to return.
            return updatedUser;
        } catch (err) {
            throw err;
        }
    }

    async deleteUserAvatar() {
        try {
            const { user, user: { _id, avatarPaths } } = this.context;
            const defaultAvatarPaths = this.appConfig.cloudStorage.avatars.getDefaultAvatarPaths();

            // We don't want to delete a binary object from cloud storage if that object does not exist.
            if (avatarPaths.original === 'no-profile' || avatarPaths.original === defaultAvatarPaths.original) {
                return user;
            }

            // Remove all avatar images for the current user from cloud storage.
            await Promise.all(Object.keys(user.toJSON().avatarPaths)
                    .map(objKey => this.fileStorageService
                        .deleteAvatarImage(this.fileStorageAdapter.getRelativeFileURI(avatarPaths[objKey]))));

            // Replace the relative path in the database with the default avatar relative paths (anonymous avatar).
            const updatedUser = await this.userRepository.updateAvatarById(_id, defaultAvatarPaths);

            return updatedUser;
        } catch (err) {
            throw err;
        }
    }

    async retrieveUserAvatarURLById(id) {
        try {
            const user = await this.userRepository.readById(id);

            if (!user) throw new ResourceNotFoundError();

            user.avatarPaths = this._mapRelativeAvatarPathsToAbsoluteAvatarURIs(user.avatarPaths);

            return user.avatarPaths;
        } catch (err) {
            throw err;
        }
    }

    static _cleanUser(user) {
        // eslint-disable-next-line no-unused-vars
        const { password, tokens, ...cleanUser } = user;
        return cleanUser;
    }

    /*
     * Description:
     * 1.) Construct the new avatarPaths object to return later.
     * 2.) Map through each key of old paths and generate the full path based on the old path.
     */
    /**
     * @description Maps (transforms) relative avatar URIs to absolute avatar URIs.
     *
     * @param    {Object} relativeAvatarPaths The relative paths.
     * @returns  {Object} The transformed avatar paths.
     * @memberof UserService
     */
    _mapRelativeAvatarPathsToAbsoluteAvatarURIs(relativeAvatarPaths) {
        // The new avatarPaths object.
        const mappedAvatarPaths = {};

        // Map through each key and generate the absolute URI based on the relative path corresponding to the key.
        Object.keys(relativeAvatarPaths).forEach(key => {
            mappedAvatarPaths[key] = this.fileStorageAdapter.getAbsoluteFileURI(relativeAvatarPaths[key]);
        });

        return mappedAvatarPaths;
    }
}

module.exports = UserService;