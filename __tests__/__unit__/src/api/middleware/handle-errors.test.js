/*
 * File: handle-errors.test.js (__tests__/__unit__/src/api/middleware/handle-errors.test.js)
 *
 * Description: Contains test cases pertaining to the handleErrors middleware function.
 * 
 * Created By Jamie Corkhill on 08/09/2019 at 04:42 PM (Local), 09:42 PM (Zulu)
 */

const handleErrors = require('./../../../../../src/api/middleware/handle-errors');

test('Should call the correct res methods for a custom error', () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
    };

    // System Under Test
    handleErrors({
        data: {
            custom: true,
            statusCode: 400,
            message: 'Test'
        }
    }, null, res, null);

    // Assert that the mocks were called correctly.
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ error: 'Test' });
});

test('Should call the correct res methods for an unknown error', () => {
    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
    };

    // System Under Test
    handleErrors({}, null, res, null);

    // Assert that the mocks were called correctly.
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ error: 'An unexpected error occurred. Internal Server Error.' });
});