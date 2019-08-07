

# Task App Refactored (Custom Auth)
A Node.js API utilizing clean architectural and design patterns with a custom JWT-based authentication system.

### Table of Contents
- [Local Execution](#local-execution)
- [Testing](#testing)
- More to be added (PENDING).
- [License](#license)

### Local Execution
First and formost, install the required packages. All modules are defined locally within `package.json` to reduce conflicts between locally and globally installed packages.
```
npm install
```
This API depends on environment variables in its operation. For security purposes, those environent variable key-value pairs have not been included in this repository. In the project's root directory, create a folder named `config`, and store within it two files - `dev.env` and `test.env`. Populate the files as follows (using your own data):

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
### Testing
Ensure a MongoDB Database Server is running or use the included batch file (after editing as discussed above) to start one with the following script:
```
npm run dev-db-server
```
This repository contains two types of tests - Integration Tests and Unit Tests. Unit Tests execute fast and test units of code (typically functions) in isolation. Unit Tests exist for most if not all functions of each Service, Repository, and Utility class/file in this repo. The Integration Tests included here spin up test database servers populated with seed data and a fake API that operates on an Express Application with `supertest`. Test files exist within the `__tests__` directory in the root of the project, are ran with the Jest Test Runner, and match the following Glob Pattern:
```
__tests__/**/*.test.js
```
Jest has been specifically configured to use that pattern in the Node environment and to run all tests in band with the `--runInBand` flag as to prevent conflicts between seed data within spun up instances.

Care has been taken to help prevent memory leaks and race conditions by running in band and by ensuring MongoDB Server Instances (through `mongoose`) and `supertest` agent servers are disposed upon each termination of a test suite, with clean servers spun up for the next suite, and subsequently shut down.

Due to the complexities of Dependency Injection, database and `supertest` agent servers are occasionally spun up locally to a set of `test` functions within
a `describe` block of Jest, permitting those tests and those tests only to operate on an Express Application that has specific dependencies mocked within
the Dependency Injection Container (Awilix). Again, these local servers are disposed upon completion of use.
### License
The MIT License

Copyright &copy; 2010-2019 Jamie Corkhill. 

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