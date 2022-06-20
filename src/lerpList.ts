import { lerp } from "./math"

interface Lerpable {
    mutatable: any,
    key: string,
    startVal: number,
    endVal: number,
    startTime: number,
    duration: number
}

// processLerpQueue is designed to be called with requestFrameAnimation so
// that it recieves a number of milliseconds that have passed since the last invocation.
// When it is invoked, it will lerp each object of the lerpQueue, mutating its value
// defined by 'key'.  Once the elapsed time passes the duration the lerpQueue record
// will be removed because the lerp is finished.
// This is useful for running short, independent animations such as making a 
// unit flash white when it takes damage
function processLerpList(currentTime: number, lerpQueue: Lerpable[]) {
    for (let i = lerpQueue.length - 1; i >= 0; i--) {
        const lerpInstance = lerpQueue[i];
        if (lerpInstance) {
            const { mutatable, key, startVal, endVal, duration } = lerpInstance;
            mutatable[key] = lerp(startVal, endVal, (currentTime - lerpInstance.startTime) / duration);
            // Remove from the queue when the lerp is finished
            if (currentTime - lerpInstance.startTime >= duration) {
                lerpQueue.splice(i, 1);
            }
        } else {
            console.error('Lerp queue loop is malformed')
        }
    }

}
const globalLerpList: Lerpable[] = [];
export function lerpLoop(timestamp: number) {
    processLerpList(timestamp, globalLerpList);
    // Only continue to loop if there are
    if (globalLerpList.length !== 0) {
        requestAnimationFrame(lerpLoop)
    }
}
export function addLerpable(object: any, key: string, endVal: number, duration: number) {
    globalLerpList.push({
        mutatable: object,
        key,
        startVal: object[key],
        endVal,
        startTime: performance.now(),
        duration
    });
    requestAnimationFrame(lerpLoop);
}

export const testable = {
    processLerpList
}