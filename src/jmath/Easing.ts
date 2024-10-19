
// from https://easings.net/

import { lerp } from "./math";

// input should be 0 - 1
export function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
}
interface TweenArgs {
    object: any;
    key: string;
    from: number;
    to: number;
    duration: number;
    easingFn?: (x: number) => number;
}
// tween is used to tween any object's value from a start value `from` to and end value `to` in a duration
// Intentioned to be used for marketing and recording
export async function tween(tweenArgs: TweenArgs) {
    return new Promise(res => {
        tweenFrame(Date.now(), res, tweenArgs)();
    });
}
function tweenFrame(startTime: number, resolve: (value: void | PromiseLike<void>) => void, tweenArgs: TweenArgs) {
    return function tweenFrameInner() {
        const now = Date.now();
        const timeDiff = now - startTime;
        // t is 0 to 1
        const t = tweenArgs.easingFn ? tweenArgs.easingFn(timeDiff / tweenArgs.duration) : lerp(0, 1, timeDiff / tweenArgs.duration);
        tweenArgs.object[tweenArgs.key] = lerp(tweenArgs.from, tweenArgs.to, t);
        if (t >= 1) {
            resolve();
        } else {
            requestAnimationFrame(tweenFrame(startTime, resolve, tweenArgs));
        }
    }
}