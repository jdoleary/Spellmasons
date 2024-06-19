import * as shims from "./src/Shims";
export default function setup({ provide }) {
  console.log('importing shims', shims);
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
}