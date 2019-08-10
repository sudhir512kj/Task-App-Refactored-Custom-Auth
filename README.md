  

# Task App Refactored (Custom Auth)
A Node.js API utilizing clean architectural and design patterns with a custom JWT-based authentication system.

<p float="left">

<a href="https://circleci.com/gh/JamieCorkhill/Task-App-Refactored-Custom-Auth">
    <img src="https://circleci.com/gh/JamieCorkhill/Task-App-Refactored-Custom-Auth.svg?style=svg">
</a>

<img src="https://img.shields.io/circleci/build/github/JamieCorkhill/Task-App-Refactored-Custom-Auth/master">
<img src="https://img.shields.io/github/license/JamieCorkhill/Task-App-Refactored-Custom-Auth">
<img src="https://img.shields.io/github/languages/code-size/JamieCorkhill/Task-App-Refactored-Custom-Auth">
<img src="https://img.shields.io/github/package-json/v/JamieCOrkhill/Task-App-Refactored-Custom-Auth">

</p>

### Table of Contents
- [About](#about)
- [Description](#description)
-  [Reasons for Building](#reasons-for-building)
- [Ported Versions](#ported-versions)
    - [Front-End](#front-end)
    - [Back-End](#back-end)
- [Migrations](#migrations)
- [Infrastructure](#infrastructure)
     - [Authentication](#authentication)
     - [Database](#database)
     - [External APIs](#external-apis)
     - [Layers](#layers)
     - [Error Handling](#error-handling)
- [Design Ideology](#design-ideology)
    - [What this Codebase Attempts to Do](#what-this-codebase-attempts-to-do)
    - [Design Patterns](#design-patterns)
    - [Architectural Patterns](#architectural-patterns)
    - [Dependency Injection](#dependency-injection)
- [Code Quality](#code-quality)
    - [Linting](#linting)
- [Prouduction Deployment](#production-deployment)
    - [Server Administration](#server-administration)
    - [Lambda Functions](#lambda-functions)
    - [Load Testing](#load-testing)
    - [Load Balancing](#load-balancing)
    - [Logging (pm2)](#logging)
- [Security](#security)
    - [Validation and Injections](#validation-and-injections)
    - [HTTPS](#https)
    - [HSTS](#hsts)
- [Testing](#testing)
    - [Unit Testing](#unit-testing)
    - [Integration Testing](#integration-testing)
    - [Mutation Testing  & Code Coverage](#mutation-testing-and-code-coverage)
    - [Continuous Integration](#continuous-integration)
- [Local Execution (Usage)](#local-execution-usage)
- [API](#api)
- [Contributions](#contributions)
- [Corrigendum](#corrigendum)
- [Special Thanks](#special-thanks)
- [Resources](#resources)
- [License](#license)

## About
Within the Node.js community, there a not a lot of resources that depict methods by which to architect server-side solutions utilizing best-practice design patterns in a manner by which they can be readily applied to applications (both greenfield and legacy) that are required to meet the quality, standards, speed, security, and scalability expected of them within the production environment. 

This open-source (OSS) repository is designed to aid any developers who are looking for readily available information in the context of a real application to help them migrate toward following better practices for architecting and managing Node.js back-ends.

Indeed, that is absolutely **not** to say that this repository represents the gold standard in architecture and practices. Rather, it is a culmination of what I have most recently learned with regards to writing better, cleaner, and more elegant code. Some of the information herein could very well be blatantly incorrect (for I'm still learning myself) and there may exist better solutions to problems I've attempted to solve. Should any developer notice any method by which something could be done better, please open an Issue and possibly submit a pull request.

For all developers, and especially when first learning how to program in general, a lot of the problems faced surround how to do something, such as how to accomplish a specific task, how to use an API, how to get acquainted with the nuances of a language, etc. Once a developer has achieved some amount of mastery over a language, there becomes a fundamental delta or change in one's thought process. One no longer questions _how to do something_ (for they already know), rather, they question _how to do something **well**_.

For me, this repository represents my attempts not to build mere functional solutions to problems, but to design architect, and craft functional solutions well.
## Description
As stated above, this repository is an attempt at practicing and applying patterns associated with clean architecture (not Bob Martin) toward Node.js applications. This API manages the backend of an application for storing tasks one may want to complete on a day-to-day basis.

Primitive user operations such as signing up, signing in, signing out, managing session tokens, uploading avatars, uploading profile information, updating profile information, etc. are depicted. User passwords are hashed with the `bcrypt` algorithm and provided signed, ephemeral JSON Web Tokens per session.

Primitive task operations such as creating, updating, and deleting tasks are depicted. More endpoints will be added in the future.

More advanced operations, such as scheduling cron-jobs for user email onboarding are currently in development and the infrastructure is already there to support them.

MongoDB, a NoSQL database, is used to persist user data, manipulated through the Mongoose ORM (Object-Relational Mapping). This repository is merely an attempt at better software craftsmanship, and it's important to note that non-relational databases like NoSQL, although easy to use, are seldom better choices than relational databases like PostgreSQL, especially for operations and applications that require referential integrity/Consistency and or Atomicity/atomic transactions. With that said, MongoDB does support transactions.
## Reasons for Building
As previously stated, the reasons for building this application and releasing its codebase open source are as follows.
1. To provide a resource to members of the Node.js community looking for information.
2. To inspire developers to practice better coding practices.
3. To depict common architectural patterns operating in the real-world (i.e, not textbook examples)
4. To foster learning and the open-source distribution of knowledge and education pertaining to this topic.
5. (Selfishly) To become a better developer personally by taking advice from developers more knowledgable and experienced than myself regarding how I can do things better and architect better solutions.
## Disclaimer
As stated multiple times, I in no way wish to state that the coding style, practices, methods, patterns, and solutions I employ here are in anyway supreme to other options or that this code represents the gold standard in development practices. The actuality is rather quite the opposite. This repository could very well be riddled with bad practices that I am not yet aware of, so although the purpose of this repository is primarily to help others learn, it is very much equally a learning experience for myself.

Please don't take this as something that has to be followed, it's merely a suggestion and representation of the knowledge that I've managed to gain in my time learning how to architect better solutions for production applications. 

If it is helpful to you in any way, then great, and feel free to reuse some of my solutions here in your own projects. If anything is incorrect or if anything could be done better, then please don't hesitate to open an Issue and submit a Pull Request.

A Limitation of Liability is included at the bottom of this file in the Licensing section.
## Ported Versions
In an attempt to learn as much as possible about production level development and deployment, it is my intention to build front-ends and to replicate this back-end in as many different languages/frameworks as possible, for native platform development, web development, and desktop development. Depending on how much time I have and how much I can learn, I might also release a custom web server built in C that handles HTTP on the socket level, although that is unlikely and a while away at best.
### Front-End
- [ ] React Native, JavaScript/TypeScript - Mobile 
- [ ] Android Native, Java - Mobile
- [ ] Android Native, Kotlin - Mobile
- [ ] Xamarin, C# - Mobile
- [ ] React, JavaScript/TypeScript - Web
- [ ] Electron - Desktop
- [ ] Windows Presentation Foundation (WPF), C# - Desktop
- [ ]  Qt, C++ - Desktop
- [ ] JavaFx, Java - Desktop
### Back-End
- [x] Node.js and MongoDB
- [ ] Node.js and PostgreSQL
- [ ] Nest.js (TypeScript)
- [ ] ASP.NET Web API  and SQL Server
- [ ] Java EE
- [ ] Ruby on Rails
- [ ] Flask (Python)
- [ ] Custom C Webserver (highly unlikely)
## Migrations
As to ascertain how modular this codebase is based on how it permits migration to different solutions, I'll be uploading alternate versions that will utilize different Database Management Systems, different cloud storage solutions, different password hashing algorithms, and different authentication systems.

At a bare minimum, that will help me get an idea if concerns are separated (Separation of Concerns), loosely coupled, and highly modular.

I'll also be attempting to simulate existing users and to perform migrations between database and cloud storage providers with active user load on the server. How does one migrate from AWS S3 to GCS, for example, while still dealing with new user signups? I'll also attempt to alter avatar image processing logic to see how well the code will react to that, from both the perspective of the API and its business logic (internally) and the client's business logic (externally). To answer those questions, new repos will be uploaded that implement those changes and migrations.

Roadmap for Migratory Changes:
1. Database migrations from NoSQL to SQL.
2. Cloud storage and CDN migrations.
3. Password hashing algorithm migrations.
4. File processing (image resizing) changes.
5. Authorization Bearer Token migrations.
6. OAuth2.0 Integration for sign up through Federated Identity Providers.
## Infrastructure
This section explains internal infrastructure how Authentication, Databases, External APIs, Application Layers, and Error Handling are handled. This should provide insight into the practiced and employed architecture.
### Authentication
Authentication is performed via signed and ephemeral JSON Web Tokens. All protected HTTP Endpoints require a valid Authorization Bearer Token to be provided in the header of the request via custom middleware for the Express Web Application Framework. 

The provided Bearer Token is stripped from the header of the request, the string `Bearer        ` plus one more space is removed, and the JSON Web Token is provided on `req` for future middleware functions. The operations described in this paragraph are the concern of the `stripBearerToken` middleware function.

```javascript
// strip-bearer-token.js
const stripBearerToken = (req, res, next) => {
    try {
        // Strip off the Bearer Token
        req.token = req.header('Authorization').replace('Bearer ', '');
        next();
    } catch (e) {
        // We are not concerned with the implications of having no 
        // token here. (That'll be handled by other middleware).
        req.token =  '';
        next();
    }
};
```
After a Bearer Token has been stripped, it'll be passed off to the `verifyAuth` middleware function. This function is concerned with validating and decoding the token, and ensuring a valid user exists within the database based on the ID property on the decoded token, and by the token itself in the database.

That is, the payload of the JSON Web Tokens contains the ID of the user. When the token is decoded with the secret (which is an environment variable), the ID will be made available in scope. We can then query the database to find a user based on that ID and the token itself. If the user object is defined, then we know the user is now authenticated, and we place the user object in scope to the rest of the Services in the Service Layer. Otherwise, an `AuthenticationError` is thrown. Such custom errors are described below. This code snippet includes Dependency Injection with the Awilix Injected Service Locator. Dependency Injection and its use with this codebase is discussed at a later time.

```javascript
// verifyAuth.js

// Dependency Injection
const { inject } = require('awilix-express');

// Custom Exceptions
const { AuthenticationError } = require('./../../custom-exceptions/index');

const verifyAuth = inject(({ authenticationService, userService }) => async (req, res, next) => {
    try {
        // Ensure that the Authorization Bearer Token is valid - if so, decode     it.
        const decoded = authenticationService.verifyAuthToken(req.token);

        // Ensure that the user exists in the database by their ID and current token.
        // A ResourceNotFoundError will be thrown if the user does not exist, which will be caught below and an AuthenticationError will be thrown.
        const user = await userService.retrieveUserByQuery({  _id: decoded._id, 'tokens.token': req.token }, true);

        // We have the user now, so register it on the request and in the container (so we can use it in services).
        req.user = user;
        req.container.resolve('context').user = user;

        // Proceed.
        next();
    } catch (err) {
        // Throw an AuthenticationError (401)
        throw  new  AuthenticationError();
    }
});
```
The fact that the `_id` property is passed into the `UserService` directly is a code-smell and will be fixed at a later point in time. The whole point is to abstract away anything database-specific from all layers above the Repository Layer (Data Access Layer). So, since MongoDB expects an ObjectID to be available on `_id` field, then that above authentication implementation is too specific and too coupled to MongoDB because it passes a Mongo specific param down to the Service.

Instead, the `UserService` should expose a generic interface to the application to perform CRUD Operations on the Users Collection without having to interface with any data that is specific to a MongoDB Schema. Again, that change is upcoming.
### Database
The MongoDB Database is employed for the persistence of all user-related data, and it's accessed through the Mongoose ORM which manipulates the MongoDB Native Driver for Node. Steps have been taken to decouple the database solution from the application business logic as to make migrating databases (such as from MongoDB to PostgreSQL) easier and less troublesome in the future.
### External APIs
The primary external API employed is that of Amazon Web Services through the AWS SDK for JavaScript in Node.js. Because this application uses a custom authentication solution and does **not** use Auth0, Google Firebase Authentication, etc., then AWS is the primary external API (used for cloud storage with S3).

In the spirit of the decoupling of logic, the AWS SDK/API is wrapped in a custom-built Adapter as to define a generic interface through which generic application and Service Layer data can be mapped AWS SDK specific parameters. For pipelines that require work such as file processing prior to S3 upload, a Facade pattern is employed through a service - that is, the `FileStorageService` acts as a facade to both the `FileProcessingService` and the `FileStorageAdapter` to provide an easy to use and single function call to the `UserService`.

I went through many, many iterations for decoupling logic pertaining to processing images, generating AWS specific upload parameters, and writing the Adapter, which is evident by viewing the commit history on this repo. For that reason, the methods employed to decouple logic are described below in detail.

Any other APIs will also be wrapped in Adapters. The PayPal Express Checkout API, for example, would be wrapped by a `PaymentAdapter`, for example, to decouple anything PayPal specific from application and Service Layer business logic.
### Layers
Fundamentally, the application is split into three layers: The Controller Layer, the Service Layer, and the Repository (Data Access) Layer.

The Controller Layer (although not clearly defined), is very thin and sits on top. Its job is to receive HTTP Requests from the client, map HTTP specific data into generic objects that subsequent layers can understand, and to respond to the client with the result of operations performed on the Service Layer and below. I mentioned that the Controller Layer is not clearly defined because there do not exist any `*Controler` classes, per se. That's because the Services make the Controllers so thin that they are not required. Rather, endpoints are defined within Express Routes and have Services injected via Dependency Injection. You can see an example in the `~/api/routes` directory.

It's vitally important that each layer communicates only with the layer directly beneath it. That is, the Controller Layer will only ever request data from the Service Layer or from functions that exist outside the layers. The Service Layer will only ever request data from fellow Services or from the Data Access Layer (Repositories). And the Repository Layer will only ever request data from the ORM or the Database Driver.

Additionally, no HTTP specific data may ever leak down into Service Layers, for the Controller Layer will strip away HTTP specific data/artifacts *prior* to passing it down to the Services.

The Service Layer encapsulates all application business logic within classes by feature/operation. The following Services exist within this application:

1. AuthenticationService
2. FileProcessingService
3. FileStorageService
4. PasswordService
5. TaskService
6. UserService

Notice the PascalCase naming convention. That is employed because each Service is its own class that handles data relating to that specific feature - users, tasks, passwords, authentication, etc.

Once again, layers can only make function calls to talk to fellow layers or to singleton Repositories that are injected into the constructor of each Service class via Dependency Injection.

Indeed, since Services encapsulate the entirety of business logic, Service Classes have the tendency to become quite large and monolith. To help prevent monolith design within Services, the Observer Pattern is used. That is, certain services extend (inherit from) the Node `EventEmitter` class. That provides the Service the ability to emit events that observers and subjects can listen for and perform data.

One such example is having the `UserService` emit a `signed_up_user` event, which Observers or Subjects that exist, operate, and function outside of the concept of the layers can listen for to perform such actions as scheduling cron-jobs for user email on-boarding. Indeed, just because these Observers exist outside the defined layers does not mean that they are not subject to the same architectural practices. For emails, an `EmailService` should exist that talks to the Sendgrid API (for example) via an adapter. All that the Observers would do, in this case, is schedule cron-jobs for `EmailService`  singleton functions to fire with a pre-determined HTML email template. They might also be able to inject specific user-related data (such as a user's name) into the template.

Finally, the Repository or Data Access Layer is the bottom-most layer that talks directly to the Database, the Database Driver, or the employed ORM. It will never request data from anyone other than the Database. It provides an interface to the Services that is generic from the database, such that if the database was to be migrated or swapped out, then an application-wide refactor would **not** be required for a new database should literally be a drop-in replacement. (Not factoring into account, of course, the migration in terms of pre-stored data).
### Error Handling
It is common for Express Endpoints to be filled with clunky and verbose `try`/`catch` statements, and, admittedly, I've coded this way myself for a long time. To help make the Controller Layer/Endpoints as thin as possible, no error handling at all (with rare exceptions) is performed at the Controller level. Rather custom error classes are defined that extend from `Error`.

These custom `Error` classes, like     `AuthenticationError`, `ValidationError`, `ResourceNotFoundError`, etc., contain properties such as `err`, `message`, and `statusCode`.

When one of the errors is thrown, it'll bubble up to the Controller Layer. Express Middleware will catch that error and allow me to decide what to do. If the error is a custom one that I define, then I'll strip the `statusCode` and `message` and respond to the client. If not, I'll respond with a 500 to the client.

One benefit of this is that it provides one single source of truth that you know all errors will be required to pass through, providing the ability to log any errors in once place.

```javascript
const handleErrors = (err, req, res, next) => {
    // Logging here.
    // If the err object has an err.data.custom property, it's one of ours.
    if (err.data && err.data.custom && err.data.custom === true) {
        // The err object already contains the status code and message we want to respond with.
        res.status(err.data.statusCode).send({ error: err.data.message });
    } else {
        // This err is not one of ours.
        res.status(500).send({ error: 'An unexpected error occurred. Internal Server Error.' });
    }
};
```
## Design Ideology
As stated many times, I designed and architected this codebase with scalability and refactorability in mind. Having loosely coupled modules that communicate via generic interfaces with small surface areas was a crucial notion I kept in mind during the design process.
### What this Codebase Attempts to Do
This codebase attempts depict clean architecture in Node (not Bob Martin's version) in a manner by which others can learn from (taking into account my disclaimer). It tries to make all components loosely coupled but highly cohesive and separable in nature.
### Design Patterns
Many of the employed design patterns are already discussed, but a few more are the:
1. Singleton Pattern
2. Observer Pattern
3. Adapter/Facade Pattern
4. The Factory/Builder Pattern
5. State/Context
6. Inversion of Control through Dependency Injection.
### Architectural Patterns
The primary architectural pattern employed is that of three-tier (three-layer) architecture. Indeed, this is not Model View Presenter or Model View Controller. Rather, it's an architecture that consists of a thin and light-weight Controller Layer that handles HTTP artifacts, a heavy Service Layer that encapsulates business logic and delegates to Observers, and a Repository Layer (Data Access Layer) that maps service operations to CRUD Operations on a database.
### Dependency Injection
Dependency Injection is such a critical component to this application (specifically for testing) that it deserves its own section.

The Awilix Dependency Injection container, built by [Jeff Hansen](https://github.com/jeffijoe), is employed to manage the dependencies of all Layers in the application.

Rather than having each Controller, Service, and Repository define its own dependencies, they are injected from above. Hence, Inversion of Control is achieved via Dependency Injection. This has numerous benefits to decouple code and to make testing easier by a factor of 100 factorial. Instead of having to monkey-patch `require`, mock functions/services can be passed into other functions/services as required. Such mocks can be Jest functions and Jest Spies.

[Awilix](https://github.com/jeffijoe/awilix) is the Dependency Injection Container I employ for the above purposes, and it is used in conjunction with [awilix-express](https://github.com/talyssonoc/awilix-express) to inject dependencies into Controllers and to scope dependencies on a per HTTP Request basis.

## Code Quality
Code Quality standards are employed ensured via linting.

### Linting
ESLint for Node, Jest, and ECMAScript 8 with the Airbnb Rule Set is used and enforced.

## Production Deployment
As to emulate the production environment and to learn as much as possible, I'll be deploying to Heroku, a Digital Ocean Droplet, to AWS EC2.
### Server Administration
As to learn more about DevOps and System Administration, this codebase will be deployed to AWS EC2 where I'll manage and load balance the server and provide a custom SSL Certificate as discussed below.
### Lambda Functions
Another possible avenue is to migrate to a Microservices Architecture with Lambda Functions and AWS Lambda@Edge. One example of Lambda@Edge would be to process images dynamically based on back-pressure at CDN Node/Edge locations rather than pre-processing all images before storage in S3.
### Load Testing
The server has not yet been load tested or memory profiled, and no flame charts have been generated to that end. I'll be doing so in the near future.
### Load Balancing
The server has no load balancer or reverse proxy in front of it. I'll be using one upon production to AWS EC2, either the load balancer provided by `pm2` or Nginx. I might also employ Redis for caching when this repository is updated with a live chat feature via web sockets.
### Logging
Production level logging is yet to be implemented but will be soon likely with `pm2`.

## Security
Security measures are taken to prevent common the exploitation of common attack vectors - such as SQL and NoSQL Injections.
### Validation and Injections
Coming soon.
### HTTPS
Node uses HTTP by default, so I'll be setting up Express Middleware and attaining a signed certificate from a CA to handle requests over HTTPS with SSL encryption.
### HSTS
Express Middleware will be employed to ensure all requests use HTTPS.
## Testing
Ensure a MongoDB Database Server is running or use the included batch file (after editing as discussed below) to start one with the following script:
```
npm run dev-db-server
```
This repository contains two types of tests - Integration Tests and Unit Tests. Unit Tests execute fast and test units of code (typically functions) in isolation. Unit Tests exist for most if not all functions of each Service, Repository, and Utility class/file in this repo. The Integration Tests included here spin up test database servers populated with seed data and a fake API that operates on an Express Application with `supertest`. Test files exist within the `__tests__` directory in the root of the project, are ran with the Jest Test Runner, and match the following Glob Pattern:
```
__tests__/**/*.test.js
```
Jest has been specifically configured to use that pattern in the Node environment and to run all tests in band with the `--runInBand` flag as to prevent conflicts between seed data within spun up instances.

Care has been taken to help prevent memory leaks and race conditions by running in-band and by ensuring MongoDB Server Instances (through `mongoose`) and `supertest` agent servers are disposed upon each termination of a test suite, with clean servers spun up for the next suite, and subsequently shut down.

Due to the complexities of Dependency Injection, database and `supertest` agent servers are occasionally spun up locally to a set of `test` functions within
a `describe` block of Jest, permitting those tests and those tests only to operate on an Express Application that has specific dependencies mocked within
the Dependency Injection Container (Awilix). Again, these local servers are disposed upon completion of use.
### Unit Testing
Unit Tests exist for most if not all functions in this repository for 100 percent code coverage. Unit Tests are performed by passing mocks into the System Under Test thanks to the flexibility afforded by Dependency Injection. Assertions are made about these mocks to ensure they were called the correct amount of times with the correct parameters. This permits one to honor the interface the calling code expects (like a Promise) while still mocking the implementation and spying on the calls to dependencies.
### Integration Testing
All HTTP Endpoints are fully Integration Tested to ensure, not only that isolated code units function as they should, but also that the units function correctly *together*. Mock database and web servers are spun up for each test suite so that assertions can be made about how data is stored in the database and how the password hashing and token mechanisms are performing on real data.

A lot of hoops have to be jumped through to test the response from database queries due to formatting and type issues. I'm not sure that my Unit and Integration Tests are written as well as they could be, feel free to open a Pull Request for how I could re-write my tests better.
### Mutation Testing  and Code Coverage
100 percent code coverage is not an accurate representation of how well your tests are written for that coverage. Mutation Testing mutates one's code to determine how well the test cases react. For each mutation, at least one test should fail. If all tests pass, then at least one test is poorly written.

Mutation Testing with Stryker has not yet been implemented into this codebase but will be soon.
### Continuous Integration
Although tests are run locally, CircleCI is used as a build server for running Remote Tests. The `master` branch of this repository is protected as to not permit the merging of pull requests or the committing and pushing of local changes upstream unless all tests are passing.
## Local Execution (Usage)
First and foremost, install the required packages. All modules are defined locally within `package.json` to reduce conflicts between locally and globally installed packages.
```
npm install
```
This API depends on environment variables in its operation. For security purposes, those environment variable key-value pairs have not been included in this repository. In the project's root directory, create a folder named `config`, and store within it two files - `dev.env` and `test.env`. Populate the files as follows (using your own data):

`dev.env`:
```
PORT=[port]
AWS_ACCESS_KEY_ID=[aws_access_key_id]
AWS_SECRET_ACCESS_KEY=[aws_secret_access_key]
MONGODB_URL=mongodb://127.0.0.1:27017/task-app-refactored-custom-auth-api
JWT_SECRET=[jwt_secret]
MODE=dev
```
`test.env`:
```
PORT=[port]
AWS_ACCESS_KEY_ID=[aws_access_key_id]
AWS_SECRET_ACCESS_KEY=[aws_secret_access_key]
MONGODB_URL=mongodb://127.0.0.1:27017/task-app-refactored-custom-auth-api-test
JWT_SECRET=[jwt_secret]
MODE=test
```
Replace the `[name]` value identifiers with your own data.

Additionally, you will be required to reference a valid AWS Simple Storage Service (S3) bucket. Once a bucket has been created it, enter the name of that bucket in the object in the config file `/src/config/application/config.js` under `cloudStorage.buckets`.

Finally, format the class instance variable `this.partialFileURI` in the `FileStorageAdapter` class constructor to reflect the required URI for data access in your AWS S3 bucket.

To execute this API  on `localhost`, ensure a MongoDB Database Server is running, and run the following command:
```
npm run dev
```
This will run the server on your loopback IP Address on port 3000. If you plan to fork or make changes to this codebase, you can optionally watch for changes with `nodemon`:
```
npm run dev-watch
```
A batch file has been included to permit the easy running of the MongoDB Server. Just edit the batch file to include the paths of your `mongo-data` folder and your `mongod` executable, and run it with:
```
npm run dev-db-server
```
## API
Documentation for the API surface is pending.
## Contributions
Contributions are welcomed and encouraged. Create an Issue or submit a Pull Request to do so and I'll be happy to look into merging your changes. If errors exist, please let me know.
##  Corrigendum
In the event of any errors, please open an Issue or contact Jamie Corkhill (me) by email. The last thing I want to is to participate in the distribution of misinformation, so I'll be happy to rectify any errors.
## Special Thanks
Special thanks to  [Jeff Hansen](https://github.com/jeffijoe), the developer of the Awilix Dependency Injection Container, for his invaluable aid and advice toward building this back-end in as clean a manner as possible, and for sharing his time and knowledge with me.
## Resources
Resources list pending.
## License
The MIT License

Copyright &copy; 2019 Jamie Corkhill. 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.