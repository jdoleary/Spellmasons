
let testPromisesList: { label: string, prom: Promise<any>, resolved:boolean }[] = [];
let testPromisesLabel = 'None';
export function test_endCheckPromises(): boolean {
    const labelledPromises = testPromisesList.filter(({ label }) => label == testPromisesLabel)
    const result = labelledPromises.every(({resolved}) => resolved);
    // Clear checked promises
    const logMethod = result ? console.log : console.error;
    logMethod(`Test: Promise check ${result ? 'PASS' : 'FAIL'}: ${testPromisesLabel}`)
    if(!result){
        console.log('Test: Debug promises', JSON.stringify(testPromisesList));
    }
    return result
}
export function test_startCheckPromises(label: string) {
    testPromisesLabel = label;
    if(testPromisesList.length){
        const remainingLabels = testPromisesList.map(({label}) => label);
        console.log('Test: Unfinished promises: ', remainingLabels.filter((x, i) => remainingLabels.indexOf(x) === i))
    }
    // Clear
    testPromisesList = [];
}
let spyPromiseActive = false;
export function spyPromise() {
    if(spyPromiseActive){
        console.warn('Test: spyPromise invoked more than once');
        return;
    }
    spyPromiseActive = true;
    
    const OriginalPromise = Promise;
    window.Promise = function(executor) {
        console.log('Promise constructor called');
        // Capture stack trace or any other debug information here
        let ob = {label: testPromisesLabel, prom:undefined, resolved:false};
        ob.prom = new OriginalPromise((resolve, reject) => {
            // Optionally modify the behavior of resolve and reject here
            executor(value => {
                console.log('Promise resolved with value:', value, this);
                ob.resolved = true;
                resolve(value);
            }, reason => {
                console.log('Promise rejected with reason:', reason);
                reject(reason);
            });
        });
        testPromisesList.push(ob);
        console.log('jtest testPromises', testPromisesList)
        return ob.prom;
    };
    window.Promise.resolve = () => {
        const prom = new window.Promise<void>((res) => res());
        return prom;
    }
}
// export function spyPromise2() {

    // Save original references
    // const originalPromise = Promise;
    // const originalFinally = Promise.prototype.finally;
    // const originalAll = Promise.all;
    // const originalRace = Promise.race;
    // const originalAllSettled = Promise.allSettled;
    // const originalAny = Promise.any;

    // // Spy wrapper for the Promise constructor
    // function PromiseSpy(executor: (arg0: (value: unknown) => void, arg1: (reason?: any) => void) => void) {
    //     console.trace('Promise constructor called');
    //     return new originalPromise((resolve, reject) => {
    //         return executor(resolve, reject);
    //     });
    // }

    // // Inherit Promise prototype
    // PromiseSpy.prototype = originalPromise.prototype;
    // PromiseSpy.prototype.constructor = PromiseSpy;

    // Promise.prototype.finally = function (...args) {
    //     // LEFT OFF DETERMINING IF PROMISE IS RESOLVED
    //     console.log(`${name} called with args:`, args);
    //     // Call the original method
    //     return originalFinally.apply(this, args).then(result => {
    //         console.log(`${name} resolved with:`, result);
    //         return result;
    //     }).catch(error => {
    //         console.log(`${name} rejected with:`, error);
    //         throw error; // Rethrow after logging
    //     });
    // };
    // // Wrap static methods
    // PromiseSpy.all = function (...args) {
    //     console.log('Promise.all called with args:', args);
    //     const prom = originalAll.apply(this, args);
    //     testPromisesList.push({ label: testPromisesLabel, prom });
    //     return prom;
    // };

    // PromiseSpy.race = function (...args) {
    //     console.log('Promise.race called with args:', args);
    //     const prom = originalRace.apply(this, args);
    //     testPromisesList.push({ label: testPromisesLabel, prom });
    //     return prom;
    // };

    // PromiseSpy.allSettled = function (...args) {
    //     console.log('Promise.allSettled called with args:', args);
    //     const prom = originalAllSettled.apply(this, args);
    //     testPromisesList.push({ label: testPromisesLabel, prom });
    //     return prom;
    // };

    // PromiseSpy.any = function (...args) {
    //     console.log('Promise.any called with args:', args);
    //     const prom = originalAny.apply(this, args);
    //     testPromisesList.push({ label: testPromisesLabel, prom });
    //     return prom;
    // };

    // // Replace the global Promise with the spy
    // window.Promise = PromiseSpy;

    // // Utility to restore original Promise if necessary
    // window.restoreOriginalPromise = function () {
    //     window.Promise = originalPromise;
    // };
    // Save original methods to restore later if needed
 
// }
