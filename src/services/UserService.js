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

// TODO: Data sanitization.

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

    /*
     * Description:
     * 1.) Throw a ValidationError if no `userData` object is provided.
     * 2.) Hash the provided password.
     * 3.) Build a safe use object by spreading out the dangerous object and overriding the plain-text password with the hashed password.
     * 4.) Create the user in the database, throw an error and display a message if the email already exists, or throw an error for validation.
     * 5.) Generate an authentication token and save it to the user object.
     * 6.) Return the safe user object.
     */
    /**
     * @description - Performs the required operations to sign up a new user, including handling ValidationErrors, hashing passwords, generating
     *     authentication tokens, and stripping sensitive data from the user object before returning it.
     *
     * @param    {Object} userData Information regarding the user to sign up.
     * @returns  {Object} The successfully signed up user.
     * @memberof UserService
     */
    async signUpNewUser(userData = {}) {
        try {
            // Only checking password here because the Model will validate other properties.
            if (!userData || !userData.password) throw new ValidationError();

            // Hash the user's password.
            const hashedPassword = await this.passwordService.hash(userData.password); 

            // Create a safe user object to store with no sensitive data in plain-text.
            const cleanUser = {
                ...userData,
                avatarPaths: this.appConfig.cloudStorage.avatars.getDefaultAvatarPaths(),
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

            return {
                user: this._transformUser(userWithToken),
                token
            };
        } catch (err) {
            if (err.code === 11000) throw new ValidationError(null, 'The provided email address is already in use.');
            if (!err.name) throw err;
            throw err.name === 'ValidationError' ? new ValidationError(err) : err;
        }
    }

    /*
     * Description:
     * 1.) Find the user in the database by their ID, `user` will be `null` if no user is found.
     * 2.) Check if the user is authenticated. If `user` is `null`, the `isAuthenticated` boolean switch will be set to `false`. If `user` is defined and
     * hashed passwords match, than the `isAuthenticated` boolean flag will be set to true.
     * 3.) Throw an AuthenticationError if `isAuthenticated` is false.
     * 4.) Generate a new authentication token for this sign in session and store it.
     * 5.) Return the clean user.
     */
    /**
     * @description - Attempts to log a user in, which includes querying the database for the user's email, ensuring the stored hashed password matches the
     *     hash of the provided password, generating a new authentication token for this session, and returning the safe user object.
     *
     * @param    {String} email    The user's email address.
     * @param    {String} password The user's password.
     * @returns  {Object} The safe user object.
     * @memberof UserService
     */
    async loginUser(email, password) {
        // The email and password is sort of important...
        if (!email || !password) throw new ValidationError();

        // Attempt to find the user by their email. If user is null, an AuthenticationError will be thrown below.
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
            user: this._transformUser(userWithToken),
            token
        };
    }

    /*
     * Description:
     * 1.) Call the Repository to remove a user's active token from the database.
     */
    /**
     * @description - Logs out a user by invalidating their token for the logged in session.
     *
     * @param    {String} token JSON Web Token
     * @returns  {Object} The safe logged out user object.
     * @memberof UserService
     */
    async logoutUser(token) {
        // Remove the user's existing token from the database.
        return this._transformUser(await this.userRepository.removeTokenById(this.context.user._id, token));
    }

    /*
     * 1.) Call the Repository to remove all a user's active tokens from the database.
     */
    /**
     * @description - Logs out a user by invalidating all their tokens across all sessions.
     *
     * @returns  {Object} The safe logged out user object.
     * @memberof UserService
     */
    async logoutUserAll() {
        // Remove all of the user's tokens from the database.
        return this._transformUser(await this.userRepository.removeAllTokensById(this.context.user._id))
    }

    /*
     * Description:
     * 1.) Find the user in the database via query.
     * 2.) Throw an error if the user is null.
     * 3.) Return the safe user.
     */
    /**
     * @description - Attempts to find a user by a query, and returns that safe user if possible, otherwise throws a ResourceNotFoundError.
     *
     * @param   {Object} query The subset of the user object being requested.
     * @returns {Object} The safe user object if discovered.
     * @memberof UserService
     */
    async retrieveUserByQuery(query) {
        // Attempt to find the user by a query.
        const user = await this.userRepository.readByQuery(query);

        // Throw a ResourceNotFoundError if that user does not exist.
        if (!user) throw new ResourceNotFoundError();

        return this._transformUser(user);
    }

    /* 
     * Description:
     * 1.) If the `requestedUpdates` object is null, set it to be an empty object.
     * 2.) Count the number of keys on the object, if it's zero, return the current user with no side effects.
     * 3.) Otherwise, ensure the updates are valid.
     * 4.) If valid and one of the updates is the password, make the password safe by hashing it.
     * 5.) Update the user object in the DB with the updates.
     * 6.) Return the safe object.
     */
    /**
     * @description - Attempts to update a user by ensuring the updates for the user are valid. If no updates are provided, the current state of the user
     *     is returned, if updates are invalid, a ResourceNotFoundError is thrown, if updates are valid, then the user is updated as specified. If the updates
     *     are valid and one of the updates is a password, then the new password is hashed before being sent across the network (despite being SSL Encrypted
     *     with HSTS enforced).
     *
     * @param    {Object} [requestedUpdates={}] The requested updates.
     * @returns  {Object} The updated user object.
     * @memberof UserService
     */
    async updateUser(requestedUpdates = {}) {
        // Create an empty allowed updates object and enumerate `requestedUpdates` keys.
        const validUpdates = {};
        const updateKeys = Object.keys(requestedUpdates);

        // Abort if no updates have been provided.
        if (updateKeys.length === 0) return this.context.user;
        
        // Verify that the requested updates are valid.
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

        return this._transformUser(await this.userRepository.updateById(this.context.user._id, validUpdates));
    }

    /*
     * Description:
     * 1.) TODO: Cascade deletion of tasks.
     * 2.) TODO: Send cancellation emails.
     * 3.) Delete the user.
     */
    /**
     * @description Deletes a user from the database, handles cascade deletion of user tasks, and sends cancellation emails.
     *
     * @memberof UserService
     */
    async deleteUser() {
        // TODO: Delete Tasks.
        // TODO: Send cancellation emails.

        return this.userRepository.deleteById(this.context.user._id);     
    }

    /*
     * Description:
     * 1.) If no avatar buffer has been provided, set the relative paths to point to the default avatars and return the safe user.
     * 2.) Otherwise, send the image away for processing and upload.
     * 3.) Create a temporary avatar path object and store the relative avatar paths on there (dynamically creating the key names).
     * 4.) Update the database and return the safe user.
     */
    /**
     * @description - Attempts to handle the processing and uploading of a user's avatar. If no avatar buffer is provided (so `avatarBuffer` is null), then
     *     the database is updated to contain relative paths to the default avatar for all images from the cloud storage solution, which is an anonymous image.
     *     If `avatarBuffer` is non-null, then calls are made to handle processing and subsequently uploading the avatar image to the cloud storage solution.
     *     After a successful upload to cloud storage, the database is updated to contain the relative paths that point to the storage location of the Blob in
     *     storage. The safe user is then returned.
     *
     * @param    {Buffer} avatarBuffer The buffer of the user's avatar.
     * @returns  {Object} The safe user object.
     * @memberof UserService
     */
    async uploadUserAvatar(avatarBuffer) {
        const { _id } = this.context.user;
        
        // In the event that the user decides not to upload an avatar image.
        if (!avatarBuffer) {
            // Using default avatar.
            const updatedUser = await this.userRepository
                .updateAvatarById(_id, this.appConfig.cloudStorage.avatars.getDefaultAvatarPaths());
            
            return this._transformUser(updatedUser);
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

        return this._transformUser(updatedUser);
    }

    /*
     * Description:
     * 1.) If the database does not contain a path to a unique image, make no changes and return the safe user.
     * 2.) Otherwise, delete the image from cloud storage by generating it's keys dynamically.
     * 3.) Return the transformed user with the database now pointing to the default avatars.
     */
    /**
     * @description - Attempts to delete a user's avatar by removing the avatar image from the cloud storage solution and resetting the `avatarPaths`
     *    in the database to point to the default avatar image initially provided for all users.
     *
     * @returns  {Object} The safe user object.
     * @memberof UserService
     */
    async deleteUserAvatar() {
        const { user, user: { _id, avatarPaths } } = this.context;
        const defaultAvatarPaths = this.appConfig.cloudStorage.avatars.getDefaultAvatarPaths();

        // We don't want to delete a binary object from cloud storage if that object does not exist.
        if (avatarPaths.original === 'no-profile' || avatarPaths.original === defaultAvatarPaths.original) {
            return this._transformUser(user);
        }

        // Remove all avatar images for the current user from cloud storage.
        await Promise.all(Object.keys(user.avatarPaths)
                .map(objKey => this.fileStorageService
                    .deleteAvatarImage(this.fileStorageAdapter.getRelativeFileURI(avatarPaths[objKey]))));

        // Replace the relative path in the database with the default avatar relative paths (anonymous avatar).
        return this._transformUser(await this.userRepository.updateAvatarById(_id, defaultAvatarPaths));
    }

    /*
     * Description:
     * 1.) Attempt to find the user in the database, if not, throw a ResourceNotFoundError.
     * 2.) Perform mapping logic for avatar paths and then return the `avatarPaths` object.
     */
    /**
     * @description - Provides an object containing URLs that point to the user's avatar.
     *
     * @param    {String} id The ID of the user for whom avatar paths will be discovered.
     * @returns  {Object} The aggregated URL object.
     * @memberof UserService
     */
    async retrieveUserAvatarURLById(id) {
        try {
            const user = await this.userRepository.readById(id);

            if (!user) throw new ResourceNotFoundError();

            user.avatarPaths = this._mapRelativeAvatarPathsToAbsoluteAvatarURIs(user.avatarPaths);

            return user.avatarPaths;
        } catch (err) {
            throw new ResourceNotFoundError();
        }
    }

    /*
     * Description:
     * 1.) Using the spread operator to stript the password and tokens properties, dumping the rest in `cleanUser`.
     * 2.) Return the clean user.
     */
    /**
     * @description - Private member function as noted by the '_' prefix. Removes the `password` and `tokens` field if they exist to make the user object
     * safe, and then returns that safe object.
     *
     * @static
     * @param    {Object} user The unsafe user object.
     * @returns  {Object} The safe user object.
     * @memberof UserService
     */
    static _stripSensitiveData(user) {
        // eslint-disable-next-line no-unused-vars
        const { password, tokens, ...cleanUser } = user;
        return cleanUser;
    }

    /*
     * Description:
     * 1.) Strip any sensitive data from the provided user.
     * 2.) Return an object with the clean user and mapped avatar paths if such unique paths exist. 
     */
    /**
     * @description - Private member function as noted by the '_' prefix. Maps the relative avatar URLs to absolute avatar URLs.
     *
     * @param {*} user 
     * @returns
     * @memberof UserService
     */
    _transformUser(user) {
        const strippedUser = UserService._stripSensitiveData(user);
        return {
            ...strippedUser,
            // If the avatar paths are not the database default, then map them, otherwise, leave them.
            avatarPaths: strippedUser.avatarPaths.original !== 'no-profile' ? (
                this._mapRelativeAvatarPathsToAbsoluteAvatarURIs(strippedUser.avatarPaths)
            ) : (
                strippedUser.avatarPaths
            )
        };
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
            mappedAvatarPaths[key] = this.fileStorageAdapter.getAbsoluteFileURI(relativeAvatarPaths[key] !== 'no-profile' ? ( 
                relativeAvatarPaths[key] 
            ) : ( 
                this.appConfig.cloudStorage.avatars.getDefaultAvatarPaths()[key])
            // eslint-disable-next-line function-paren-newline
            );
        });

        return mappedAvatarPaths;
    }
}

module.exports = UserService;