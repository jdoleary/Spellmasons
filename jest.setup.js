globalThis.animationManager = {
  animate: () => { },
  addAnimation: () => { },
  setTransform: () => { },
  startAnimate: () => { },
  startGroup: () => { },
  endGroup: () => { },
};

globalThis.usingTestRunner = true;
// Stub out translation for testing
globalThis.i18n = (text) => text;
globalThis.alert = () => { }

// Overwrite Jest's obnoxious changes to console.log
const util = require('util')
// Simplify logs
console.log = function () { process.stdout.write(util.format.apply(this, arguments) + '\n'); }
// Silence logs
// console.log = () => {}
// Type guard that checks if a value is null or undefined
globalThis.isNullOrUndef = (x) => {
  return x === undefined || x === null;
};

// Type guard that checks if a value exists (is not null or undefined)
globalThis.exists = (x) => {
  return !globalThis.isNullOrUndef(x);
};