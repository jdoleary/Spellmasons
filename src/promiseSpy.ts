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
        prom && !prom.test_ignorePromiseSpy)
    const passed = promisesToCheck.every(({ resolved }) => resolved);
    const logMethod = passed ? console.log : console.error;
    logMethod(`Test: Promise check ${passed ? 'PASS' : 'FAIL'}: ${Array.from([...new Set(promisesToCheck.map(p => p.prom?.test_label))]).join(',')}`);
    if (!passed) {
        console.log('Test: Debug promises:\n', promisesToCheck.map(({ prom, resolved }) => `${prom?.test_label}: ${resolved}; (${prom?.test_label_sub})`).join('\n'));
    }
    // Clear checked promises
    const prevCount = testPromisesList.length;
    testPromisesList = testPromisesList.filter(({ resolved, prom }) => !resolved && prom && !prom.test_ignorePromiseSpy);
    console.log('Test: Clearing promise list. endCheckPromises; was:', prevCount, 'now: ', testPromisesList.length);

    // Clear label
    testPromisesLabel = 'None';

    return passed
}
export function test_startCheckPromises(label: string) {
    testPromisesLabel = label;
    if (testPromisesList.length) {
        const remainingLabels = testPromisesList.filter(x => x.prom && !x.prom.test_ignorePromiseSpy).map(({ prom }) => prom?.test_label);
        console.log('Test: Unfinished promises: ', remainingLabels.filter((x, i) => remainingLabels.indexOf(x) === i), JSON.stringify(testPromisesList), 'New Label:', label);
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
    // @ts-ignore
    window.Promise = function (executor) {
        // Capture stack trace or any other debug information here
        let tracker: PromiseTracker = { prom: undefined, resolved: false };
        tracker.prom = new OriginalPromise((resolve, reject) => {
            // Optionally modify the behavior of resolve and reject here
            executor((value: any) => {
                tracker.resolved = true;
                resolve(value);
            }, (reason: any) => {
                reject(reason);
            });
        });
        addToList(tracker);
        return tracker.prom;
    };
    window.Promise.resolve = () => {
        const prom = new window.Promise<void>((res) => res());
        return prom;
    }
    window.Promise.all = (promises: Promise<any>[]) => {
        let tracker: PromiseTracker = { prom: undefined, resolved: false };
        // Must wrap in a new promise so that it only resolves AFTER
        // tracker.resolved is set to true;
        return new OriginalPromise<any[]>((res) => {
            tracker.prom = OriginalPromise.all(promises).then((resolution) => {
                tracker.resolved = true;
                res(resolution);
            });
            addToList(tracker);
        })
    }
    window.Promise.race = (promises: Promise<any>[]) => {
        let tracker: PromiseTracker = { prom: undefined, resolved: false };
        // Must wrap in a new promise so that it only resolves AFTER
        // tracker.resolved is set to true;
        return new OriginalPromise<any[]>((res) => {
            tracker.prom = OriginalPromise.race(promises).then((resolution) => {
                tracker.resolved = true;
                res(resolution);
            });
            addToList(tracker);
        })
    }
}
