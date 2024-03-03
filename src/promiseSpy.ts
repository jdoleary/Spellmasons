type TrackablePromise = Promise<any> & { test_label?: string, test_ignorePromiseSpy?: boolean, test_label_sub?: string }
interface PromiseTracker {
    prom?: TrackablePromise;
    resolved: boolean;
}
let testPromisesList: PromiseTracker[] = [];
let testPromisesLabel = 'None';
export function test_ignorePromiseSpy(prom: TrackablePromise) {
    // Ensures this promise won't FAIL if not finished when test_endCheckPromises
    // is invoked.
    // This is for promises created (for example) by floatingText
    // which do not impact gameplay state and should not be awaited inside spells

    prom.test_ignorePromiseSpy = true;

}
export function test_endCheckPromises(): boolean {
    const promisesToCheck = testPromisesList.filter(({ prom }) =>
        prom && !prom.test_ignorePromiseSpy);
    const passed = promisesToCheck.every(({ resolved }) => resolved);
    const logMethod = passed ? console.debug : console.error;
    logMethod(`Test: Promise check ${passed ? 'PASS' : 'FAIL'}: ${Array.from([...new Set(promisesToCheck.map(p => p.prom?.test_label))]).join(',')}`);
    if (!passed) {
        console.debug('Test: Debug promises:\n', promisesToCheck.map(({ prom, resolved }) => `${prom?.test_label}: ${resolved}; (${prom?.test_label_sub})`).join('\n'));
    }
    // Clear checked promises
    const prevCount = testPromisesList.length;
    testPromisesList = testPromisesList.filter(({ resolved, prom }) => !resolved && prom && !prom.test_ignorePromiseSpy);
    console.debug('Test: Clearing promise list. endCheckPromises; was:', prevCount, 'now: ', testPromisesList.length);

    // Clear label
    testPromisesLabel = 'None';

    return passed
}
export function test_startCheckPromises(label: string) {
    testPromisesLabel = label;
    if (testPromisesList.length) {
        const remainingLabels = testPromisesList.filter(x => x.prom && !x.prom.test_ignorePromiseSpy).map(({ prom }) => prom?.test_label);
        console.debug('Test: Unfinished promises: ', remainingLabels.filter((x, i) => remainingLabels.indexOf(x) === i), JSON.stringify(testPromisesList), 'New Label:', label);
    }
    // Clear list because they don't need to be tracked now that the test has been reported
    testPromisesList = [];
}
function addToList(t: PromiseTracker) {
    if (t.prom) {
        t.prom.test_label = testPromisesLabel;
    } else {
        console.error('spyPromises: Attempted to add PromiseTracker with no promise attached');
    }
    testPromisesList.push(t);
}
let spyPromiseActive = false;
export function test_spyPromises() {
    if (!location.href.includes('localhost')) {
        console.debug('Skipping spyPromise in production');
        return;
    }
    if (spyPromiseActive) {
        console.warn('Test: spyPromise invoked more than once');
        return;
    }
    spyPromiseActive = true;

    const OriginalPromise = Promise;
    const OriginalPromiseAll = Promise.all;
    const OriginalPromiseRace = Promise.race;
    function PromiseSpy<T>(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T> {
        // Capture stack trace or any other debug information here
        let tracker: PromiseTracker = { prom: undefined, resolved: false };
        tracker.prom = new OriginalPromise((resolve, reject) => {
            // Optionally modify the behavior of resolve and reject here
            executor((value: T | PromiseLike<T>) => {
                tracker.resolved = true;
                resolve(value);
            }, (reason: T) => {
                reject(reason);
            });
        });
        addToList(tracker);
        return tracker.prom;
    };
    PromiseSpy.prototype = OriginalPromise.prototype;
    PromiseSpy.resolve = ((x) => {
        const prom = new window.Promise((res) => res(x));
        return prom;
    }) as typeof OriginalPromise.resolve;
    PromiseSpy.all = (promises: Promise<any>[]) => {
        let tracker: PromiseTracker = { prom: undefined, resolved: false };
        // Must wrap in a new promise so that it only resolves AFTER
        // tracker.resolved is set to true;
        return new OriginalPromise<any[]>((res) => {
            tracker.prom = OriginalPromiseAll.call(OriginalPromise, promises).then((resolution) => {
                tracker.resolved = true;
                res(resolution);
            });
            addToList(tracker);
        })
    }
    PromiseSpy.race = (promises: any) => {
        let tracker: PromiseTracker = { prom: undefined, resolved: false };
        // Must wrap in a new promise so that it only resolves AFTER
        // tracker.resolved is set to true;
        return new OriginalPromise<any[]>((res) => {
            tracker.prom = OriginalPromiseRace.call(OriginalPromise, promises).then((resolution) => {
                tracker.resolved = true;
                // @ts-ignore Imperfect spy, only applies in development so non-issue
                res(resolution);
            });
            addToList(tracker);
        })
    }
    PromiseSpy.any = OriginalPromise.any;
    PromiseSpy.allSettled = OriginalPromise.allSettled;
    PromiseSpy.reject = OriginalPromise.reject;
    PromiseSpy[Symbol.species] = OriginalPromise[Symbol.species];

    // @ts-ignore Imperfect spy, only applies in development so non-issue
    window.Promise = PromiseSpy;
}
