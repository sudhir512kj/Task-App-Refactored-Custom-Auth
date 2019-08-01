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
 * Created by Jamie Corkhill on 07/28/2019 at 03:34 PM (Local), 07:37 PM (Zulu)
 */

const express = require('express');
const { inject } = require('awilix-express');

// File upload
const upload = require('./../../config/multer/multer');

// Middleware
const { stripBearerToken, verifyAuth } = require('./../middleware/index');
 
// Router 
const router = new express.Router();

// POST /api/v1/users
/*
 * 1.) Call the UserService function to sign up a new user.
 * 2.) Respond with HTTP 201 Created with the user object and his/her token.
 */
router.post('/', inject(({ userService }) => async (req, res) => {
    // Destructing to be explicit in what data is within the HTTP Response for secure coding purposes.
    const { user, token } = await userService.signUpNewUser(req.body.user);
    return res.status(201).send({ user, token });
}));

// POST /api/v1/users/login
/*
 * 1.) Call the UserService function to log in a user.
 * 2.) Respond with HTTP 200 with a user object and his/her token.
 */
router.post('/login', inject(({ userService }) => async (req, res) => {
    const { email, password } = req.body.credentials ? req.body.credentials : { user: null, password: null };

    // Destructing to be explicit in what data is within the HTTP Response for secure coding purposes.
    const { user, token } = await userService.loginUser(email, password);
    return res.send({ user, token });
}));

// POST /api/v1/users/logout
/*
 * 1.) Call the UserService function to logout a user.
 * 2.) Respond with HTTP 200 and no data.
 */
router.post('/logout', stripBearerToken, verifyAuth, inject(({ userService }) => async (req, res) => {
    await userService.logoutUser(req.token);
    return res.send();
}));

// POST /api/v1/users/logoutAll
/*
 * 1.) Call the UserService function to logout a user from all sessions across devices.
 * 2.) Respond with HTTP 200 and no data.
 */
router.post('/logoutAll', stripBearerToken, verifyAuth, inject(({ userService }) => async (req, res) => {
    await userService.logoutUserAll();
    return res.send();
}));

// GET /api/v1/users/me
/*
 * Description:
 * 1.) Call the UserService function to retrieve the logged in user.
 * 2.) Respond with HTTP 200 and the user object.
 */
router.get('/me', stripBearerToken, verifyAuth, inject(({ userService }) => async (req, res) => {
    const user = await userService.retrieveUserById(req.user._id);
    return res.send({ user });
}));

// PATCH /api/v1/users/me
/*
 * Description:
 * 1.) Call the UserService function to update the user.
 * 2.) Respond with HTTP 200 and the user object.
 */
router.patch('/me', stripBearerToken, verifyAuth, inject(({ userService }) => async (req, res) => {
    const updatedUser = await userService.updateUser(req.body.updates);
    return res.send({ user: updatedUser });
}));

// DELETE /api/v1/users/me
/*
 * Description: 
 * 1.) Call the UserService function to delete the user.
 * 2.) Respond with HTTP 200 and no data.
 */
router.delete('/me', stripBearerToken, verifyAuth, inject(({ userService }) => async (req, res) => {
    await userService.deleteUser();
    return res.send();
}));

// POST /users/me/avatar
/*
 * Description:
 * 1.) Call the UserService to upload an avatar buffer. If there is no buffer available, pass `null` into the service.
 * 2.) Respond with the upload result from the cloud storage solution and HTTP Response Status 201 Created.
 */
router.post('/me/avatar', stripBearerToken, verifyAuth, upload.single('avatar'), inject(({ userService }) => async (req, res) => {
    // Perform avatar upload, if there is no buffer, provide `null` to the UserService.
    const user = await userService.uploadUserAvatar((req.file && req.file.buffer) || null);
    return res.status(201).send({ user });
}));


// DELETE api/v1/users/me/avatar
/*
 * Description:
 * 1.) Call the UserService function to delete the user's avatar.
 * 2.) Respond with HTTP 200 and no data.
 */
router.delete('/me/avatar', stripBearerToken, verifyAuth, inject(({ userService }) => async (req, res) => {
    await userService.deleteUserAvatar();
    return res.send();
}));

// GET /api/v1/users/:id/avatar
/*
 * Description:
 * 1.) Call the UserService to retrieve a user's avatar.
 * 2.) Respond with HTTP 200 and an object containing the avatar properties.
 */
router.get('/:id/avatar', inject(({ userService }) => async (req, res) => {
    const avatarURLs = await userService.retrieveUserAvatarURLById(req.params.id);
    res.send({ avatar: avatarURLs });
}));

module.exports = router;