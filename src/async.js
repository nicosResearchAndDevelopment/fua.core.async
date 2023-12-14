const async = exports;

/**
 * @template {any} T
 * @param {function(...args: any, cb: function(error?: Error, result?: T): void): any} fn
 * @param {...any} args
 * @returns {Promise<T>}
 */
async.promify = function (fn, ...args) {
    if (typeof fn !== 'function') throw new Error('fn must be a function');
    return new Promise((resolve, reject) => {
        args.push((err, ...results) =>
            err ? reject(err)
                : results.length > 1 ? resolve(results)
                    : resolve(results[0]));
        fn.apply(this, args);
    });
};

/**
 * @template {any} T
 * @param {function(...args: any, cb: function(error?: Error, result?: T): void): any} fn
 * @returns {function(...args: any): Promise<T>}
 */
async.promisify = function (fn) {
    if (typeof fn !== 'function') throw new Error('fn must be a function');
    return function (...args) {
        args.unshift(fn);
        return async.promify.apply(this, args);
    };
};

/**
 * @template {any} T
 * @param {function(...args: any): Promise<T>} fn
 * @param {...any} args
 * @param {function(error?: Error, result?: T): void} cb
 * @returns {void}
 */
async.callbacky = function (fn, ...args /*, cb*/) {
    if (typeof fn !== 'function') throw new Error('fn must be a function');
    const cb = args.pop();
    if (typeof cb !== 'function') throw new Error('cb must be a function');
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
 * @template {any} T
 * @param {function(...args: any): Promise<T>} fn
 * @returns {function(...args: any, cb: function(error?: Error, result?: T): void): void}
 */
async.callbackify = function (fn) {
    if (typeof fn !== 'function') throw new Error('fn must be a function');
    return function (...args) {
        args.unshift(fn);
        return async.callbacky.apply(this, args);
    };
};

/**
 * @param {function(...args: any): Promise | any} fn
 * @param {...any} args
 * @returns {void}
 */
async.iife = function (fn, ...args) {
    if (typeof fn !== 'function') throw new Error('fn must be a function');
    try {
        const result = fn.apply(this, args);
        if (result instanceof Promise) result.catch(console.error);
    } catch (err) {
        console.error(err);
    }
};

/**
 * @template {any} T
 * @param {function(...args: any): Promise<T> | T} fn
 * @param {number} delay
 * @param {...any} args
 * @returns {Promise<T>}
 */
async.delay = function (fn, delay, ...args) {
    if (typeof fn !== 'function') throw new Error('fn must be a function');
    if (!Number.isFinite(delay)) throw new Error('delay must be a finite number');
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const result = fn.apply(this, args);
                if (result instanceof Promise) result.then(resolve).catch(reject);
                else resolve(result);
            } catch (err) {
                reject(err);
            }
        }, Math.max(0, delay));
    });
};

/**
 * @template {any} T
 * @param {function(...args: any): Promise<T> | T} fn
 * @param {number} [maxRetries=2]
 * @returns {function(...any: any): Promise<T>}
 */
async.retry = function (fn, maxRetries = 2) {
    if (typeof fn !== 'function') throw new Error('fn must be a function');
    if (!Number.isInteger(maxRetries)) throw new Error('maxRetries must be an integer');
    if (maxRetries < 1 || maxRetries > Number.MAX_SAFE_INTEGER) throw new Error('maxRetries must be in range from 1 to ' + Number.MAX_SAFE_INTEGER);
    return async function (...args) {
        let error;
        for (let current = 0; current < maxRetries; current++) {
            try {
                return await fn.apply(this, args);
            } catch (err) {
                error = err;
            }
        }
        throw error;
    };
};

/**
 * @template {any} T
 * @param {Array<function(): Promise<T>>} fnQueue
 * @param {number} [maxConcurrent=1]
 * @returns {Promise<Array<T>>}
 */
async.queue = async function (fnQueue, maxConcurrent = 1) {
    if (!Array.isArray(fnQueue)) throw new Error('fnQueue must be an array');
    if (!fnQueue.every(fn => typeof fn === 'function')) throw new Error('fnQueue must only contain functions');
    if (!Number.isInteger(maxConcurrent)) throw new Error('maxConcurrent must be an integer');
    if (maxConcurrent < 1 || maxConcurrent > Number.MAX_SAFE_INTEGER) throw new Error('maxConcurrent must be in range from 1 to ' + Number.MAX_SAFE_INTEGER);
    const results = new Array(fnQueue.length);
    let currIndex = 0;
    await Promise.all(Array.from(
        {length: Math.min(fnQueue.length, maxConcurrent)},
        async function processTask() {
            if (currIndex >= results.length) return;
            const fnIndex    = currIndex++;
            results[fnIndex] = await fnQueue[fnIndex]();
            if (currIndex < results.length) return processTask();
        }
    ));
    return results;
};

/**
 * @template {any} T
 * @param {Array<T>} valueArr
 * @param {function(value: T, index: number): Promise<boolean> | boolean} filterFn
 * @returns {Promise<Array<T>>}
 */
async.filter = async function (valueArr, filterFn) {
    if (!Array.isArray(valueArr)) throw new Error('valueArr must be an array');
    if (typeof filterFn !== 'function') throw new Error('filterFn must be a function');
    const filterResults = await Promise.all(valueArr.map(filterFn));
    return filterResults.reduce((result, valid, index) => {
        if (valid) result.push(valueArr[index]);
        return result;
    }, []);
};

/**
 * @template {any} T
 * @param {Array<T>} valueArr
 * @param {function(value: T, index: number): Promise<boolean> | boolean} filterFn
 * @param {number} [maxConcurrent=1]
 * @returns {Promise<Array<T>>}
 */
async.filter.queue = async function (valueArr, filterFn, maxConcurrent = 1) {
    if (!Array.isArray(valueArr)) throw new Error('valueArr must be an array');
    if (typeof filterFn !== 'function') throw new Error('filterFn must be a function');
    const fnQueue       = valueArr.map((value) => () => filterFn(value));
    const filterResults = await async.queue(fnQueue, maxConcurrent);
    return filterResults.reduce((result, valid, index) => {
        if (valid) result.push(valueArr[index]);
        return result;
    }, []);
};

/**
 * @template {any | Buffer} T
 * @param {ReadableStream<T>} stream
 * @returns {Promise<Array<T> | Buffer>}
 */
async.capture = function (stream) {
    if (!stream || typeof stream !== 'object') throw new Error('stream must be an object');
    if (typeof stream.on !== 'function') throw new Error('stream must include function "on"');
    if (typeof stream.once !== 'function') throw new Error('stream must include function "once"');
    if (typeof stream.off !== 'function') throw new Error('stream must include function "off"');
    return new Promise((resolve, reject) => {
        const chunks = [];
        let onData, onError, onEnd;
        stream.on('data', onData = (data) => chunks.push(data));
        stream.once('error', onError = (error) => {
            stream.off('data', onData);
            stream.off('end', onEnd);
            reject(error);
        });
        stream.once('end', onEnd = () => {
            stream.off('data', onData);
            stream.off('error', onError);
            try {
                const result = stream.readableObjectMode ? chunks : Buffer.concat(chunks);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        });
    });
};

(function freeze(target) {
    Object.freeze(target);
    Object.values(target)
        .filter(value => value instanceof Object)
        .forEach(freeze);
})(async);
module.exports = async;
