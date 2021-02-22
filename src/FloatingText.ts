import { CELL_SIZE } from './Image';
interface FText {
  x: number;
  y: number;
  // velocity y
  vy: number;
  opacity: number;
  vopacity: number;
  el: HTMLElement;
}
export default function floatingText({ cellX, cellY, text, color }) {
  const el = document.createElement('div');
  el.innerText = text;
  el.classList.add('floating-text');
  el.style.color = color;
  document.getElementById('board').appendChild(el);
  const instance = {
    // Place in the middle of cell
    x: cellX * CELL_SIZE + CELL_SIZE / 2,
    y: cellY * CELL_SIZE + CELL_SIZE / 2,
    el,
    vy: 1,
    opacity: 1,
    vopacity: -0.2,
  };
  requestAnimationFrame(() => floatAway(instance));
}
function floatAway(instance: FText) {
  if (instance.el) {
    instance.y -= instance.vy;
    instance.vy = instance.vy * 0.97;
    instance.opacity -= Math.max(instance.vopacity, 0);
    instance.vopacity += 0.004;
    instance.el.style.top = instance.y + 'px';
    instance.el.style.left = instance.x + 'px';
    instance.el.style.opacity = instance.opacity.toString();
    // Once it's fully hidden / done animating
    if (instance.opacity < 0) {
      // Clean up the element
      instance.el.remove();
      // Prevent continued looping
      instance.el = null;
    } else {
      requestAnimationFrame(() => floatAway(instance));
    }
  }
}
