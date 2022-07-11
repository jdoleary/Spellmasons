export function raceTimeout(ms: number, message: string, promise: Promise<any>): Promise<any> {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        let timeoutId = setTimeout(() => {
            console.error('raceTimeout: ', message);
            resolve(undefined);
        }, ms)
        promise.then(x => {
            // Debug message to see how long it takes the promise to resolve naturally
            if (!message.includes('moveTowards')) {
                console.debug(message, 'resolved in', Date.now() - start)
            }
            // Ensure that the timeout doesn't trigger now that the promise has resolved
            // natually within the allowed time
            clearTimeout(timeoutId);
            // Pass on the result of the promise
            resolve(x);
        }).catch(reject);
    });
}