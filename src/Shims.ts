
// @ts-nocheck

// Shims:
const fakeElement = {
    style: {},
    addEventListener: () => { }
};
global.document = {
    getElementById: () => fakeElement,
    createElement: () => fakeElement,
    querySelector: () => fakeElement,
    body: {
        classList: {
            toggle: () => { },
            contains: () => { }
        },
    }
};
globalThis.addEventListener = function () { };
const TICK_RATE = 16;
console.log('TICK_RATE set to', TICK_RATE)

global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
}
global.requestAnimationFrame = (callback) => {
    // Note, changing TICK_RATE from undefined to 16
    // went from consuming 20% cpu to 7% cpu
    return setTimeout(() => callback(Date.now()), TICK_RATE);
}
// Headless server plays no audio
global.playSFX = (_string) => { };
global.playSFXKey = (_string) => { };
export { };