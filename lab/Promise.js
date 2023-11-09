class Promise {

    #status = 'pending';
    #value  = undefined;
    #reason = undefined;
    #queue  = [];

    get status() {
        return this.#status;
    }

    get value() {
        return this.#value;
    }

    get reason() {
        return this.#reason;
    }

    get pending() {
        return this.#status === 'pending';
    }

    get fulfilled() {
        return this.#status === 'fulfilled';
    }

    get rejected() {
        return this.#status === 'rejected';
    }

    get settled() {
        return this.#status !== 'pending';
    }

    #resolve(value) {
        if (this.#status !== 'pending') return;
        this.#status = 'fulfilled';
        this.#value  = value;
        this.#queue.forEach(cb => cb());
        this.#queue.length = 0;
    }

    #reject(reason) {
        if (this.#status !== 'pending') return;
        this.#status = 'rejected';
        this.#reason = reason;
        this.#queue.forEach(cb => cb());
        this.#queue.length = 0;
    }

    #enqueue(onFulfilled, onRejected, onFinally, resolve, reject) {
        switch (this.#status) {
            case 'fulfilled':
                try {
                    if (onFulfilled) {
                        const value = onFulfilled(this.#value);
                        if (value instanceof Promise) value.then(resolve, reject);
                        else resolve(value);
                    } else if (onFinally) {
                        const result = onFinally();
                        if (result instanceof Promise) result.then(() => resolve(this.#value), reject);
                        else resolve(this.#value);
                    } else {
                        resolve(this.#value);
                    }
                } catch (reason) {
                    reject(reason);
                }
                break;
            case 'rejected':
                try {
                    if (onRejected) {
                        const value = onRejected(this.#reason);
                        if (value instanceof Promise) value.then(resolve, reject);
                        else resolve(value);
                    } else if (onFinally) {
                        const result = onFinally();
                        if (result instanceof Promise) result.then(() => reject(this.#reason), reject);
                        else reject(this.#reason);
                    } else {
                        reject(this.#reason);
                    }
                } catch (reason) {
                    reject(reason);
                }
                break;
            case 'pending':
            default:
                this.#queue.push(() => this.#enqueue(onFulfilled, onRejected, onFinally, resolve, reject));
        }
    }

    constructor(executor) {
        if (typeof executor !== 'function') throw new Error('executor must be a function');
        try {
            executor(this.#resolve.bind(this), this.#reject.bind(this));
        } catch (reason) {
            this.#reject(reason);
        }
    }

    then(onFulfilled, onRejected) {
        if (typeof onFulfilled !== 'function') throw new Error('onFulfilled must be a function');
        if (onRejected && typeof onRejected !== 'function') throw new Error('onRejected must be a function');
        return new Promise((resolve, reject) => this.#enqueue(onFulfilled, onRejected || null, null, resolve, reject));
    }

    catch(onRejected) {
        if (typeof onRejected !== 'function') throw new Error('onRejected must be a function');
        return new Promise((resolve, reject) => this.#enqueue(null, onRejected, null, resolve, reject));
    }

    finally(onFinally) {
        if (typeof onFinally !== 'function') throw new Error('onFinally must be a function');
        return new Promise((resolve, reject) => this.#enqueue(null, null, onFinally, resolve, reject));
    }

    static resolve(value) {
        return new Promise((resolve, reject) => resolve(value));
    }

    static reject(reason) {
        return new Promise((resolve, reject) => reject(reason));
    }

    static all(iterable) {
        const promises = Array.from(iterable);
        if (promises.length === 0) return Promise.resolve([]);
        return new Promise((resolve, reject) => {
            const values = new Array(promises.length);
            let waiting  = promises.length;
            for (let index = 0; index < promises.length; index++) {
                if (promises[index] instanceof Promise) {
                    promises[index].then((value) => {
                        if (waiting < 0) return;
                        waiting--;
                        values[index] = value;
                        if (!waiting) resolve(values);
                    }, (reason) => {
                        if (waiting < 0) return;
                        waiting       = -1;
                        values.length = 0;
                        reject(reason);
                    });
                } else {
                    if (waiting < 0) return;
                    waiting--;
                    values[index] = promises[index];
                    if (!waiting) resolve(values);
                }
            }
        });
    }

    static allSettled(iterable) {
        const promises = Array.from(iterable);
        if (promises.length === 0) return Promise.resolve([]);
        return new Promise((resolve, reject) => {
            const results = new Array(promises.length);
            let waiting   = promises.length;
            for (let index = 0; index < promises.length; index++) {
                if (promises[index] instanceof Promise) {
                    promises[index].then((value) => {
                        if (waiting < 0) return;
                        waiting--;
                        results[index] = {status: 'fulfilled', value};
                        if (!waiting) resolve(results);
                    }, (reason) => {
                        if (waiting < 0) return;
                        waiting--;
                        results[index] = {status: 'rejected', reason};
                        if (!waiting) resolve(results);
                    });
                } else {
                    if (waiting < 0) return;
                    waiting--;
                    results[index] = {status: 'fulfilled', value: promises[index]};
                    if (!waiting) resolve(results);
                }
            }
        });
    }

    static any(iterable) {
        const promises = Array.from(iterable);
        if (promises.length === 0) return Promise.reject(new AggregateError([], 'no promise resolved'));
        return new Promise((resolve, reject) => {
            const reasons = new Array(promises.length);
            let waiting   = promises.length;
            for (let index = 0; index < promises.length; index++) {
                if (promises[index] instanceof Promise) {
                    promises[index].then((value) => {
                        if (waiting < 0) return;
                        waiting        = -1;
                        reasons.length = 0;
                        resolve(value);
                    }, (reason) => {
                        if (waiting < 0) return;
                        waiting--;
                        reasons[index] = reason;
                        if (!waiting) reject(new AggregateError(reasons, 'no promise resolved'));
                    });
                } else {
                    if (waiting < 0) return;
                    waiting        = -1;
                    reasons.length = 0;
                    resolve(promises[index]);
                }
            }
        });
    }

    static race(iterable) {
        return new Promise((resolve, reject) => {
            let settled = false;
            for (let promise of iterable) {
                if (promise instanceof Promise) {
                    promise.then((value) => {
                        if (settled) return;
                        settled = true;
                        resolve(value);
                    }, (reason) => {
                        if (settled) return;
                        settled = true;
                        reject(reason);
                    });
                } else {
                    if (settled) return;
                    settled = true;
                    resolve(promise);
                }
            }
        });
    }

}

module.exports = Promise;
