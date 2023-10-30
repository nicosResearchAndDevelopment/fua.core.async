const
    async = exports;

// async.Promise = require('./model/Promise.js');

/**
 * @param {Function} fn
 * @param {...any} args
 * @returns {Promise<any>}
 */
async.promify = function (fn, ...args) {
    return new Promise((resolve, reject) => {
        args.push((err, ...results) =>
            err ? reject(err)
                : results.length > 1 ? resolve(results)
                    : resolve(results[0]));
        fn.apply(this, args);
    });
};

/**
 * @param {Function} fn
 * @returns {function(...args: any): Promise<any>}
 */
async.promisify = function (fn) {
    return function (...args) {
        args.unshift(fn);
        return async.promify.apply(this, args);
    };
};

/**
 * @param {Function} fn
 * @param {...any} args
 * @param {Function} cb
 * @returns {void}
 */
async.callbacky = function (fn, ...args /*, cb*/) {
    const cb = args.pop();
    try {
        const result = fn.apply(this, args);
        if (result instanceof Promise) result
            .then(res => cb(null, res))
            .catch(err => cb(err));
        else cb(null, result);
    } catch (err) {
        cb(err);
    }
};

/**
 * @param {Function} fn
 * @returns {function(...args: any, cb: Function): void}
 */
async.callbackify = function (fn) {
    return function (...args) {
        args.unshift(fn);
        return async.callbacky.apply(this, args);
    };
};
