/*
 * File: strip-bearer-token.test.js (__tests__/__unit__/src/api/middleware/strip-bearer-token.test.js)
 *
 * Description: Contains test cases pertaining to the stripBearerToken middleware function.
 * 
 * Created By Jamie Corkhill on 08/09/2019 at 04:56 PM (Local), 09:56 PM (Zulu)
 */

const stripBearerToken = require('./../../../../../src/api/middleware/strip-bearer-token');

test('Should call the mock functions correctly with a provided token', () => {
    const req = {
        header: jest.fn(() => 'Bearer a-token-123')
    };
    const next = jest.fn();

    stripBearerToken(req, null, next);

    // Assert that the mock functions were called correctly.
    expect(req.header).toHaveBeenCalledTimes(1);
    expect(req.header).toHaveBeenCalledWith('Authorization');
    expect(req.token).toEqual('a-token-123');
    expect(next).toHaveBeenCalledTimes(1);
});

test('Should return an empty string for the token if no token is provided', () => {
    const req = {
        header: jest.fn(() => '')
    };
    const next = jest.fn();

    stripBearerToken(req, null, next);

    // Assert that the mock functions were called correctly.
    expect(req.header).toHaveBeenCalledTimes(1);
    expect(req.header).toHaveBeenCalledWith('Authorization');
    expect(req.token).toEqual('');
    expect(next).toHaveBeenCalledTimes(1);
});