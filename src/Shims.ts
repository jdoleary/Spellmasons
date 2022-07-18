
// @ts-nocheck

// Shims:
const fakeElement = undefined;
global.document = {
    getElementById: () => fakeElement,
    querySelector: () => fakeElement
};
window.addEventListener = function () { };
global.requestAnimationFrame = (callback) => {
    console.log('invoke set immediate', typeof document, document);
    // setImmediate(() => callback(Date.now()));
}
export { };