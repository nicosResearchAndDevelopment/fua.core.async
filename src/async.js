const
    async = exports;

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

async.Promise = class {

    #status = 'pending';
    #result = null;

    #fulfillCallbacks = [];
    #rejectCallbacks  = [];

    #resolve(value) {
        if (this.#status !== 'pending') return;
        this.#status = 'fulfilled';
        this.#result = value;
        for (const callback of this.#fulfillCallbacks) {
            callback(value);
        }
        this.#fulfillCallbacks = null;
    }

    #reject(reason) {
        if (this.#status !== 'pending') return;
        this.#status = 'rejected';
        this.#result = reason;
        for (const callback of this.#rejectCallbacks) {
            callback(reason);
        }
        this.#rejectCallbacks = null;
    }

    constructor(executor) {
        if (typeof executor !== 'function') throw new Error('executor must be a function');
        executor(this.#resolve.bind(this), this.#reject.bind(this));
    }

    #onFulfill(fulfillCallback, nextResolve, nextReject) {
        this.#fulfillCallbacks.push((fulfillValue) => {
            try {
                const nextValue = fulfillCallback(fulfillValue);
                if (nextValue instanceof async.Promise) nextValue.then(nextResolve, nextReject);
                else nextResolve(nextValue);
            } catch (err) {
                nextReject(err);
            }
        });
    }

    #onReject(rejectCallback, nextResolve, nextReject) {
        this.#rejectCallbacks.push((rejectReason) => {
            try {
                const nextValue = rejectCallback(rejectReason);
                if (nextValue instanceof async.Promise) nextValue.then(nextResolve, nextReject);
                else nextResolve(nextValue);
            } catch (err) {
                nextReject(err);
            }
        });
    }

    #onFinal(finalCallback, nextResolve, nextReject) {
        this.#fulfillCallbacks.push((fulfillValue) => {
            try {
                const nextValue = finalCallback();
                if (nextValue instanceof async.Promise) nextValue.then(() => nextResolve(fulfillValue), nextReject);
                else nextResolve(fulfillValue);
            } catch (err) {
                nextReject(err);
            }
        });
        this.#rejectCallbacks.push((rejectReason) => {
            try {
                const nextValue = finalCallback();
                if (nextValue instanceof async.Promise) nextValue.then(() => nextReject(rejectReason), nextReject);
                else nextReject(rejectReason);
            } catch (err) {
                nextReject(err);
            }
        });
    }

    then(onFulfilled, onRejected) {
        if (typeof onFulfilled !== 'function') throw new Error('onFulfilled must be a function');
        if (onRejected && typeof onRejected !== 'function') throw new Error('onRejected must be a function');
        return new async.Promise((resolve, reject) => {
            switch (this.#status) {
                // TODO status !== 'pending'
                case 'pending':
                default:
                    this.#onFulfill(onFulfilled, resolve, reject);
                    if (onRejected) this.#onReject(onRejected, resolve, reject);
            }
        });

    }

    catch(onRejected) {
        if (typeof onRejected !== 'function') throw new Error('onRejected must be a function');
        return new async.Promise((resolve, reject) => {
            // TODO status !== 'pending'
            switch (this.#status) {
                case 'pending':
                default:
                    this.#onReject(onRejected, resolve, reject);
            }
        });
    }

    finally(onFinally) {
        if (typeof onFinally !== 'function') throw new Error('onFinally must be a function');
        return new async.Promise((resolve, reject) => {
            switch (this.#status) {
                // TODO status !== 'pending'
                case 'pending':
                default:
                    this.#onFinal(onFinally, resolve, reject);
            }
        });
    }

    static resolve(value) {
        // TODO
    }

    static reject(reason) {
        // TODO
    }

    static all(iterable) {
        // TODO
    }

    static allSettled(iterable) {
        // TODO
    }

    static any(iterable) {
        // TODO
    }

    static race(iterable) {
        // TODO
    }

};
