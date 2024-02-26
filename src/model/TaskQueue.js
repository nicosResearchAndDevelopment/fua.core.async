class TaskQueue {

    #idle  = true;
    #tasks = [];

    #start() {
        this.#idle = (this.#tasks.length === 0);
        if (!this.#idle) this.#tasks[0].call(null).catch(console.error);
    }

    #next() {
        this.#tasks.shift();
        this.#start();
    }

    #wrap(method, args) {
        return async () => await method.apply(null, args);
    }

    #create(method, resolve, reject) {
        return () => method.call(null).then((result) => {
            this.#next();
            resolve(result);
        }).catch((err) => {
            this.#next();
            reject(err);
        });
    }

    #enqueue(task) {
        this.#tasks.push(task);
        if (this.#idle) this.#start();
    }

    /** @returns {boolean} */
    get idle() {
        return this.#idle;
    }

    /** @returns {number} */
    get size() {
        return this.#tasks.length;
    }

    /**
     * @template {any} Result
     * @param {function(...args: any): Promise<Result> | Result} method
     * @param {...any} args
     * @returns {Promise<Result>}
     */
    queue(method, ...args) {
        if (typeof method !== 'function') throw new Error('expected method to be a function');
        return new Promise((resolve, reject) => this.#enqueue(this.#create(this.#wrap(method, args), resolve, reject)));
    }

}

module.exports = TaskQueue;
