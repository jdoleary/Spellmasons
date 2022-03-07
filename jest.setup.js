window.animationManager = {
  animate: () => {},
  addAnimation: () => {},
  setTransform: () => {},
  startAnimate: () => {},
  startGroup: () => {},
  endGroup: () => {},
};

window.alert = () => {}

// Overwrite Jest's obnoxious changes to console.log
const util = require('util')
// Simplify logs
console.log = function () { process.stdout.write(util.format.apply(this, arguments) + '\n'); }
// Silence logs
console.log = () => {}