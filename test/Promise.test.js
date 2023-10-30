const
    {describe, test} = require('mocha'),
    expect           = require('expect'),
    Promise          = require('../src/model/Promise.js');

describe('core.async.Promise', function () {

    describe('Promise() constructor', function () {
        // SEE https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise

        test('MDN Example', async function () {
            const promise1 = new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve('foo');
                }, 300);
            });

            await promise1.then((value) => {
                expect(value).toBe('foo');
            });

            expect(promise1).toBeInstanceOf(Promise);
        });

    });

    describe('Promise.prototype.then()', function () {
        // SEE https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then

        test('MDN Example', async function () {
            const promise1 = new Promise((resolve, reject) => {
                resolve('Success!');
            });

            await promise1.then((value) => {
                expect(value).toBe('Success!');
            });
        });

    });

    describe('Promise.prototype.catch()', function () {
        // SEE https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch

        test('MDN Example', async function () {
            const promise1 = new Promise((resolve, reject) => {
                throw new Error('Uh-oh!');
            });

            await promise1.catch((error) => {
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toBe('Uh-oh!');
            });
        });

    });

    describe('Promise.prototype.finally()', function () {
        // SEE https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally

        test('MDN Example', async function () {
            function checkMail() {
                return new Promise((resolve, reject) => {
                    if (Math.random() > 0.5) {
                        resolve('Mail has arrived');
                    } else {
                        reject(new Error('Failed to arrive'));
                    }
                });
            }

            for (let k = 0; k < 100; k++) {
                let completed = false;
                await checkMail()
                    .then((mail) => {
                        expect(mail).toBe('Mail has arrived');
                    })
                    .catch((err) => {
                        expect(err).toBeInstanceOf(Error);
                        expect(err.message).toBe('Failed to arrive');
                    })
                    .finally(() => {
                        completed = true;
                    });
                expect(completed).toBe(true);
            }

        });

    });

    describe('Promise.resolve()', function () {
        // SEE https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve

        test('MDN Example', async function () {
            const promise1 = Promise.resolve(123);

            await promise1.then((value) => {
                expect(value).toBe(123);
            });
        });

    });

    describe('Promise.reject()', function () {
        // SEE https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject

        test('MDN Example', async function () {
            let status = 'pending';

            function resolved(value) {
                expect(value).not.toBe(undefined);
                status = 'fulfilled';
            }

            function rejected(err) {
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toBe('fail');
                status = 'rejected';
            }

            await Promise.reject(new Error('fail')).then(resolved, rejected);
            expect(status).toBe('rejected');
        });

    });

    describe('Promise.all()', function () {
        // SEE https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all

        test('MDN Example', async function () {
            const promise1 = Promise.resolve(3);
            const promise2 = 42;
            const promise3 = new Promise((resolve, reject) => {
                setTimeout(resolve, 100, 'foo');
            });

            await Promise.all([promise1, promise2, promise3]).then((values) => {
                expect(values).toMatchObject([3, 42, "foo"]);
            });
        });

    });

    describe('Promise.allSettled()', function () {
        // SEE https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled

        test('MDN Example', async function () {
            const promise1 = Promise.resolve(3);
            const promise2 = new Promise((resolve, reject) => setTimeout(reject, 100, 'foo'));
            const promises = [promise1, promise2];

            await Promise.allSettled(promises).then((results) => {
                expect(results).toMatchObject([
                    {status: 'fulfilled', value: 3},
                    {status: 'rejected', reason: 'foo'}
                ]);
            });

        });

    });

    describe('Promise.any()', function () {
        // SEE https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any

        test('MDN Example', async function () {
            const promise1 = Promise.reject(0);
            const promise2 = new Promise((resolve) => setTimeout(resolve, 100, 'quick'));
            const promise3 = new Promise((resolve) => setTimeout(resolve, 500, 'slow'));

            const promises = [promise1, promise2, promise3];

            await Promise.any(promises).then((value) => {
                expect(value).toBe('quick');
            });
        });

    });

    describe('Promise.race()', function () {
        // SEE https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race

        test('MDN Example', async function () {
            const promise1 = new Promise((resolve, reject) => {
                setTimeout(resolve, 500, 'one');
            });

            const promise2 = new Promise((resolve, reject) => {
                setTimeout(resolve, 100, 'two');
            });

            await Promise.race([promise1, promise2]).then((value) => {
                expect(value).toBe('two');
            });
        });

    });

});
