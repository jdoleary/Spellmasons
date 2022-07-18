
// @ts-nocheck

// Shims:
const fakeElement = undefined;
global.document = {
    getElementById: () => fakeElement,
    querySelector: () => fakeElement
};
window.addEventListener = function () { };
global.requestAnimationFrame = (callback) => {
    // TODO: OPTIMIZE: Use setImmediate instead? Watch out for 100% CPU
    setTimeout(() => callback(Date.now()));
}
export { };