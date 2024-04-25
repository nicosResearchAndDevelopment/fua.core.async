const
    {describe, test} = require('mocha'),
    expect           = require('expect'),
    PromiseProxy     = require('../src/model/PromiseProxy.js');

const example = {
    value: 'Hello World!',
    async test() {
        return {
            value: 'Lorem Ipsum',
            async test() {
                return example;
            },
            throw(msg) {
                throw new Error(msg);
            }
        }
    },
    echo(value) {
        return value;
    }
};

describe('core.async.PromiseProxy', function () {

    test('develop', async function () {
        const proxy = PromiseProxy(example);

        const value1 = await proxy.value;
        const value2 = await proxy.test().test().value;
        expect(value1).toBe(value2);

        // await proxy.test().throw().value;

        console.log(await proxy.test().then(val => val).test().test().value)
        console.log(await proxy.test().then(val => val.test()).test().test().value)
    });

});
