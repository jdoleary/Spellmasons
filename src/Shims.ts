
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
export { };