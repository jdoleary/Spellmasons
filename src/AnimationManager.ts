import type * as PIXI from 'pixi.js';
import Stats from 'stats.js';
import { lerp } from './math';

const stats = new Stats();
stats.showPanel(1);
stats.dom.classList.add('doob-stats');
document.body.appendChild(stats.dom);
export interface AnimatableProps {
  x?: number;
  y?: number;
  rotation?: number;
  alpha?: number;
  scale?: number;
}
interface AnimationGroup {
  startTime: number;
  animations: Animation[];
  onFinishedCallbacks: (() => void)[];
}
interface Animation {
  sprite: PIXI.Sprite;
  start?: AnimatableProps;
  current: AnimatableProps;
  target: AnimatableProps;
}

// AnimationManager allows for SEQUENTIAL animations
// by bringing a PIXI sprite from it's current state to a target state
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
  animationGroups: AnimationGroup[] = [];
  currentGroup: AnimationGroup;
  groupLabel: string;
  startGroup(groupLabel: string) {
    if (this.groupLabel) {
      console.error(
        'warning, a new animation group has been started before a previous group has ended.  This "new" group will be added to the current group',
      );
      return;
    }
    this.groupLabel = groupLabel;
    this.currentGroup = {
      startTime: 0,
      animations: [],
      onFinishedCallbacks: [],
    };
  }
  endGroup(groupLabel: string) {
    if (groupLabel !== this.groupLabel) {
      console.error(
        'unable to end animation group because there is another anim group in progress',
      );
      return;
    }
    this.animationGroups.push(this.currentGroup);
    this.groupLabel = undefined;
  }
  addAnimation(sprite: PIXI.Sprite, current, target) {
    if (this.groupLabel) {
      // Animation to be played together in a group
      this.currentGroup.animations.push({
        sprite,
        current,
        target,
      });
    } else {
      // Animation to be played by itself
      this.animationGroups.push({
        startTime: 0,
        animations: [
          {
            sprite,
            current,
            target,
          },
        ],
        onFinishedCallbacks: [],
      });
    }
  }
  millisPerAnimation = 250;
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
    const currentAnimationGroup: AnimationGroup = this.animationGroups[0];
    if (currentAnimationGroup) {
      // Initialize startTime for group and start object for animations
      if (currentAnimationGroup.startTime == 0) {
        for (let currentAnimation of currentAnimationGroup.animations) {
          if (currentAnimation) {
            currentAnimation.start = Object.assign(
              {},
              currentAnimation.current,
            );
          }
        }
        currentAnimationGroup.startTime = timestamp;
      }
      // Calculate detla time from the start time (must come after startTime is initialized)
      const deltaTimeSinceStart = timestamp - currentAnimationGroup.startTime;
      // Animate one at a time until the whole list of animations is done
      const lerpTime = deltaTimeSinceStart / this.millisPerAnimation;
      // Lerp animations
      for (let currentAnimation of currentAnimationGroup.animations) {
        if (currentAnimation) {
          const { sprite, start, current, target } = currentAnimation;

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
          if (target.alpha !== undefined) {
            current.alpha = lerp(start.alpha, target.alpha, lerpTime);
          }
          if (target.scale !== undefined) {
            current.scale = lerp(start.scale, target.scale, lerpTime);
          }

          // Render the changes
          this.setTransform(sprite, current);
        }
      }
      if (lerpTime >= 1) {
        currentAnimationGroup.onFinishedCallbacks.forEach((cb) => cb());
        // If the animationGroup is finished, remove it
        this.animationGroups.splice(0, 1);
      }
    }
    // Continue animating until all the animationGroups are complete
    if (this.animationGroups.length) {
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
  setTransform(sprite: PIXI.Sprite, transform: AnimatableProps) {
    sprite.x = transform.x;
    sprite.y = transform.y;
    sprite.rotation = transform.rotation || 0;
    sprite.scale.x = transform.scale === undefined ? 1 : transform.scale;
    sprite.scale.y = transform.scale === undefined ? 1 : transform.scale;
    sprite.alpha = transform.alpha === undefined ? 1 : transform.alpha;
  }
}
