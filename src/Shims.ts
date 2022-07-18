
// @ts-nocheck

// Shims:
const fakeElement = {};
global.document = {
    getElementById: () => fakeElement,
    querySelector: () => fakeElement
};
window.addEventListener = function () { };
export { };