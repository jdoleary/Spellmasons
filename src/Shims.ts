
// @ts-nocheck

// Shims:
const fakeElement = {};
global.document = {
    getElementById: () => fakeElement
};
export { };