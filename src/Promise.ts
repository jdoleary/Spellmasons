export function raceTimeout(ms: number, message: string, promise: Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
        let timeoutId = setTimeout(() => {
            console.error('raceTimeout: ', message);
            resolve(undefined);
        }, ms)
        promise.then(x => {
            clearTimeout(timeoutId);
            resolve(x);
        }).catch(reject);
    });
}