// Created by Jamie Corkhill.
// Houses enumerations for file upload.

// Enumerations - File Access.
module.exports.FileAccess = Object.freeze({
    Public: 'public-read',
    Private: 'private'
});

// Enumerations - File Purpose.
module.exports.FilePurpose = Object.freeze({ 
    AvatarImage: 'avatar-image', 
    TaskImage: 'task-image'
});