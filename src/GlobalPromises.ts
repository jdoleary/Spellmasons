// Promises that can be resolved remotely
interface GlobalPromises {
    [key: string]: {
        resolve: () => void;
        reject: () => void;
    }
}
// A singleton that stores promises that can be resolved remotely
const promises: GlobalPromises = {};
// An object that stores keys for promises that should be resolved as soon as they are created
const preResolve: { [key: string]: any } = {};

// Creates a new promise and stores it in the promises singleton to
// allow remote resolution so that the code that resolves it can be
// in a different place from the code that created the promise
export function create(key: string): Promise<any> {
    const preExisting = promises[key];
    if (preExisting) {
        // If preExisting key by the same name still exists, reject it
        // because it hasn't been resolved yet and there can only be
        // one promise of a key at a time
        preExisting.reject();
    }
    if (preResolve[key]) {
        // console.log('global promise: create and immediately resolve', key)
        delete preResolve[key];
        return Promise.resolve();
    } else {
        // console.log('global promise: create', key)
        return new Promise<void>((res, rej) => {
            promises[key] = {
                resolve: res,
                reject: rej
            }
        });
    }
}

// resolves a promise in the promises singleton by key
// or queues a promise to be resolved as soon as it is created
export function resolve(key: string) {
    const wrapper = promises[key];
    if (wrapper) {
        // console.log('global promise: resolving', key)
        wrapper.resolve();
        // Delete it now that it is resolved
        delete promises[key];
    } else {
        // console.log('global promise: queue resolve', key)
        // Queue a promise of key to be resolved as soon as it's created
        preResolve[key] = true;
    }
}