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

    test('TaskQueue', async function () {
        const tasks = new async.TaskQueue();
        expect(typeof tasks.queue).toBe('function');
        let result = '';
        const A    = () => new Promise((resolve) => setTimeout(() => {
            result += 'a';
            resolve(result);
        }, 100));
        const B    = () => new Promise((resolve) => setImmediate(() => {
            result += 'b';
            resolve(result);
        }));
        const C    = () => {
            result += 'c';
            return result;
        };

        let results = await Promise.all([
            tasks.queue(A),
            tasks.queue(B),
            tasks.queue(C)
        ]);

        expect(result).toBe('abc');
        expect(results[0]).toBe('a');
        expect(results[1]).toBe('ab');
        expect(results[2]).toBe('abc');

        const D = async (val) => {
            await new Promise(resolve => setTimeout(resolve, Math.floor(10 + Math.random() * 40)));
            const temp = result + val;
            result     = val;
            await new Promise(resolve => setTimeout(resolve, Math.floor(10 + Math.random() * 40)));
            return temp;
        };

        results = await Promise.all([
            tasks.queue(D, 'd'),
            tasks.queue(D, 'e'),
            tasks.queue(D, 'f')
        ]);

        expect(result).toBe('f');
        expect(results[0]).toBe('abcd');
        expect(results[1]).toBe('de');
        expect(results[2]).toBe('ef');
    });

});
