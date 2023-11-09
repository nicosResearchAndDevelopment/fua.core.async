const
    {describe, test} = require('mocha'),
    expect           = require('expect'),
    async            = require('../src/async.js');

describe('core.async', function () {

    test('develop', function () {
        expect(typeof async.promisify).toBe('function');
        expect(typeof async.callbackify).toBe('function');
        expect(Object.isFrozen(async)).toBe(true);
    });

});
