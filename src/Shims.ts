
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
    querySelectorAll: () => [],
    body: {
        classList: {
            add: () => { },
            toggle: () => { },
            contains: () => { }
        },
    }
};
globalThis.addEventListener = function () { };

global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
}
global.requestAnimationFrame = (callback) => {
    console.trace('Headless requestAnimationFrame shouldnt be called');
    console.error('Headless invoked requestionAnimationFrame.  How to fix: Prevent it from calling requestAnimationFrame and instead optimize like was done with fly() and lob()')
    return callback(Date.now());
}
// Headless server plays no audio
global.playSFX = (_string) => { };
global.playSFXKey = (_string) => { };
global.walkPathGraphics = undefined;
global.debugGraphics = undefined;
global.devDebugGraphics = undefined;
global.radiusGraphics = undefined;
global.thinkingPlayerGraphics = undefined;
global.unitOverlayGraphics = undefined;
global.predictionGraphics = undefined;
global.planningViewGraphics = undefined;
global.hoverTarget = undefined;
global.location = undefined;
global.cinematicCameraEnabled = false;
// No translations should be done on the server, just return the original text.
global.i18n = (text) => text;
global.localStorage = {
    removeItem: () => { },
    getItem: () => 'headless server does not use localStorage',
    setItem: () => { },
}
export { };