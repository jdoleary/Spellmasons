
// @ts-nocheck

// Shims:
const fakeElement = {
    style: {},
    addEventListener: () => { },
    classList: {
        add: () => { },
        toggle: () => { },
        contains: () => { }
    },
    querySelector: () => fakeElement,
    appendChild: () => { },
    dataset: {}
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
// Setup for Bun runtime
if (typeof Bun !== 'undefined') {
    global.mods = [];
}
// Headless server plays no audio
global.playSFX = (_string) => { };
global.Audio = class Audio { };
global.playSFXKey = (_string) => { };
global.walkPathGraphics = undefined;
global.debugGraphics = undefined;
global.devDebugGraphics = undefined;
global.radiusGraphics = undefined;
global.thinkingPlayerGraphics = undefined;
global.unitOverlayGraphics = undefined;
global.predictionGraphicsGreen = undefined;
global.predictionGraphicsRed = undefined;
global.predictionGraphicsWhite = undefined;
global.predictionGraphicsBlue = undefined;
global.planningViewGraphics = undefined;
global.hoverTarget = undefined;
global.location = undefined;
global.cinematicCameraEnabled = false;
global.totalSoulTrails = 0;
// No translations should be done on the server, just return the original text.
global.i18n = (text) => text;
global.localStorage = {
    removeItem: () => { },
    getItem: () => 'headless server does not use localStorage',
    setItem: () => { },
}
global.getChosenLanguageCode = () => '';
import "./sharedGlobals";
global.peerLobbyId = '';
global.peers = new Set();
export { };