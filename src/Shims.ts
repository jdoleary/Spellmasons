
// @ts-nocheck

// Shims:
const fakeElement = {
    style: {},
    addEventListener: () => { }
};
global.document = {
    getElementById: () => fakeElement,
    querySelector: () => fakeElement
};
globalThis.addEventListener = function () { };
global.requestAnimationFrame = (callback) => {
    // TODO: OPTIMIZE: Use setImmediate instead? Watch out for 100% CPU
    setTimeout(() => callback(Date.now()));
}
export { };