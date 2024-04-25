const promiseMethods = Reflect.ownKeys(Promise.prototype).filter(key => typeof key === 'string' && key !== 'constructor');

/** @template {T} */
class PromiseWrapper {

    /** @type {string} */ path        = '$';
    /** @type {Promise<T>} */ promise = null;

    /** @param {Promise<T> | T} promise */
    constructor(promise) {
        this.promise = (promise instanceof Promise) ? promise : Promise.resolve(promise);
    }

    /**
     * @template V
     * @param {string} pathSegment
     * @param {(this: PromiseWrapper<T>, promise: Promise<T>) => PromiseWrapper<V>} promiseCallback
     */
    derive(pathSegment, promiseCallback) {
        const promise = promiseCallback.call(this, this.promise);
        const wrapper = new PromiseWrapper(promise);
        wrapper.path  = this.path + pathSegment;
        return wrapper;
    }

}

/**
 * The proxy is using getter method for the promise to enable function calls on the proxy.
 * @type {ProxyHandler<() => PromiseWrapper<unknown>>}
 */
const proxyHandler = {

    get(getWrapper, key) {
        return new PromiseProxy(getWrapper().derive('.' + key, function (promise) {
            if (promiseMethods.includes(key) && promise[key]) return Promise.resolve(promise[key].bind(promise));
            return promise.then((target) => {
                if (target == null) throw new TypeError(`cannot read property '${key}' in ${this.path}, got ${target}`);
                return typeof target[key] === 'function' ? target[key].bind(target) : target[key];
            });
        }));
    },

    set(getWrapper, key, value) {
        getWrapper().promise.then((target) => Reflect.set(target, key, value));
        return true;
    },

    apply(getWrapper, thisArg, argList) {
        return new PromiseProxy(getWrapper().derive(`(${argList.map((arg, i) => `arg${i}: ` + typeof arg).join(', ')})`, function (promise) {
            return promise.then((target) => {
                if (typeof target !== 'function') throw new TypeError(`${this.path} is not a function, got a ${typeof target}: ${target}`);
                return Reflect.apply(target, thisArg, argList);
            });
        }));
    },

    getPrototypeOf() {
        return Promise;
    }

};

/**
 * @template T
 * @param {Promise<T> | T} value
 * @returns {T & Promise<T>}
 */
function PromiseProxy(value) {
    const wrapper = (value instanceof PromiseWrapper) ? value : new PromiseWrapper(value);
    return new Proxy(() => wrapper, proxyHandler);
}

module.exports = PromiseProxy;
