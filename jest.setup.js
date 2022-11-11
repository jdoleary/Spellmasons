window.animationManager = {
  animate: () => { },
  addAnimation: () => { },
  setTransform: () => { },
  startAnimate: () => { },
  startGroup: () => { },
  endGroup: () => { },
};

window.usingTestRunner = true;
// Stub out translation for testing
window.i18n = (text) => text;
window.alert = () => { }

// Overwrite Jest's obnoxious changes to console.log
const util = require('util')
// Simplify logs
console.log = function () { process.stdout.write(util.format.apply(this, arguments) + '\n'); }
// Silence logs
// console.log = () => {}