// https://webdva.github.io/how-i-implemented-client-side-linear-interpolation/
function lerp(start: number, end: number, time: number) {
  if (time >= 1) {
    return end;
  }
  return start * (1 - time) + end * time;
}
export interface Transform {
  x?: number;
  y?: number;
  rotation?: number;
}
interface Animation {
  element: HTMLElement;
  current: Transform;
  target: Transform;
}
export default class AnimationManager {
  constructor() {
    this.animate = this.animate.bind(this);
  }
  animations: Animation[] = [];
  addAnimation(element, current, target) {
    this.animations.push({ element, current, target });
  }
  lerpTime: number = 0;
  // delta time accumulator
  deltaTimeAcc: number = 0;
  animateStart: number = 0;
  millisPerAnimation = 1000;
  animate(timestamp: number) {
    if (this.animateStart == 0) {
      this.animateStart = timestamp;
    }
    this.deltaTimeAcc += timestamp - this.animateStart;
    // Animate one at a time until the whole list of animations is done
    const lerpTime = this.deltaTimeAcc / this.millisPerAnimation;
    const currentAnimation = this.animations[0];
    if (currentAnimation) {
      const { element, current, target } = currentAnimation;

      // Lerp the transform properties
      if (target.x) {
        current.x = lerp(current.x, target.x, lerpTime);
      }
      if (target.y) {
        current.y = lerp(current.y, target.y, lerpTime);
      }
      if (target.rotation) {
        current.rotation = lerp(current.rotation, target.rotation, lerpTime);
      }

      // Render the changes
      this.setTransform(element, current);

      if (lerpTime >= 1) {
        // If animation is finished, remove it
        this.animations.splice(0, 1);
        // Reset the time
        this.deltaTimeAcc = 0;
      }
    }
    // Continue animating until all the animations are complete
    if (this.animations.length) {
      window.requestAnimationFrame(this.animate);
    } else {
      // When all animations are complete, do NOT request another animation frame
      // and reset the animateStart time
      this.animateStart = 0;
    }
  }
  setTransform(element: HTMLElement, transform: Transform) {
    const newTransform =
      'translate(' +
      transform.x +
      'px, ' +
      transform.y +
      'px) rotate(' +
      transform.rotation +
      'deg)';
    element.style.transform = newTransform;
  }
}
