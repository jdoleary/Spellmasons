import Stats from 'stats.js';
const stats = new Stats();
stats.showPanel(1);
stats.dom.classList.add('doob-stats');
document.body.appendChild(stats.dom);
// https://webdva.github.io/how-i-implemented-client-side-linear-interpolation/
function lerp(start: number, end: number, time: number) {
  if (time >= 1) {
    return end;
  }
  return start * (1 - time) + end * time;
}
export interface AnimatableProps {
  x?: number;
  y?: number;
  rotation?: number;
  opacity: number;
  scale: number;
}
interface Animation {
  element: HTMLElement;
  startTime: number;
  start?: AnimatableProps;
  current: AnimatableProps;
  target: AnimatableProps;
}

// AnimationManager allows for SEQUENTIAL animations
// by bringing an HTML element from it's current state to a target state
// over a period of time using a LERP.
// Animation objects are stored in an array and when AnimationManager's animate()
// is invoked, it will run through all the animations one at a time.
// It will stop animating (requestFrameAnimation) when it has completed all the animations
export default class AnimationManager {
  constructor() {
    this.animate = this.animate.bind(this);
  }
  // An array of callbacks that will be called when
  // a set of animations is done
  doneAnimatingCallbacks: (() => void)[] = [];
  animations: Animation[][] = [];
  currentGroup: Animation[];
  grouping: boolean = false;
  startGroup() {
    this.grouping = true;
    this.currentGroup = [];
  }
  endGroup() {
    this.animations.push(this.currentGroup);
    this.currentGroup = [];
    this.grouping = false;
  }
  addAnimation(element, current, target) {
    if (this.grouping) {
      // Animation to be played together in a group
      this.currentGroup.push({
        startTime: 0,
        element,
        current,
        target,
      });
    } else {
      // Animation to be played by itself
      this.animations.push([
        {
          startTime: 0,
          element,
          current,
          target,
        },
      ]);
    }
  }
  millisPerAnimation = 200;
  animating = false;
  doneAnimating: () => void;

  startAnimate() {
    return new Promise<void>((resolve, _reject) => {
      this.doneAnimating = resolve;
      this.animating = true;
      requestAnimationFrame(window.animationManager.animate);
    });
  }
  animate(timestamp: number) {
    stats.begin();
    const currentAnimations = this.animations[0] || [];
    for (let currentAnimation of currentAnimations) {
      if (currentAnimation) {
        if (currentAnimation.startTime == 0) {
          currentAnimation.startTime = timestamp;
          currentAnimation.start = Object.assign({}, currentAnimation.current);
        }
        const deltaTimeSinceStart = timestamp - currentAnimation.startTime;
        // Animate one at a time until the whole list of animations is done
        const lerpTime = deltaTimeSinceStart / this.millisPerAnimation;
        const { element, start, current, target } = currentAnimation;

        // Lerp the transform properties
        // Note: This mutates the current object
        if (target.x !== undefined) {
          current.x = lerp(start.x, target.x, lerpTime);
        }
        if (target.y !== undefined) {
          current.y = lerp(start.y, target.y, lerpTime);
        }
        if (target.rotation !== undefined) {
          current.rotation = lerp(start.rotation, target.rotation, lerpTime);
        }
        if (target.opacity !== undefined) {
          current.opacity = lerp(start.opacity, target.opacity, lerpTime);
        }
        if (target.scale !== undefined) {
          current.scale = lerp(start.scale, target.scale, lerpTime);
        }

        // Render the changes
        this.setTransform(element, current);

        if (lerpTime >= 1) {
          // If animation is finished, remove it
          this.animations.splice(0, 1);
        }
      }
    }
    // Continue animating until all the animations are complete
    if (this.animations.length) {
      window.requestAnimationFrame(this.animate);
    } else {
      this.animating = false;
      // Report that current animations are complete
      if (this.doneAnimating) {
        this.doneAnimating();
      }
    }
    stats.end();
  }
  setTransform(element: HTMLElement, transform: AnimatableProps) {
    const newTransform =
      'translate(' +
      transform.x +
      'px, ' +
      transform.y +
      'px) rotate(' +
      transform.rotation +
      'deg) scale(' +
      transform.scale +
      ')';
    element.style.transform = newTransform;

    const newFilter = `opacity(${transform.opacity}%)`;
    element.style.filter = newFilter;
  }
}
