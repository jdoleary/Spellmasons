function lerp(start, end, time) {
  if (time >= 1) {
    return end;
  }
  return start * (1 - time) + end * time;
}
const e1 = {};
const e2 = {};
let animations = [
  {
    element: e1,
    current: { x: 0 },
    target: { x: 100 },
  },
  {
    element: e2,
    current: { x: -20 },
    target: { x: 400 },
  },
];
function start() {
  console.log('start');
  let absTime = 0;
  // Animate one at a time until the whole list of animations is done
  while (animations.length) {
    const time = absTime++ / 10;
    const currentAnimation = animations[0];
    const { element, current, target } = currentAnimation;
    current.x = lerp(current.x, target.x, time);
    // Render the changes
    element.x = current.x;
    if (time >= 1) {
      // Remove it
      animations.splice(0, 1);
      // Reset the time
      absTime = 0;
    }
    console.log('go', e1, e2);
  }
  console.log('done', e1, e2);
}
start();
