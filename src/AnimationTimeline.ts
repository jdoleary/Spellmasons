import type * as PIXI from 'pixi.js';
import { MILLIS_PER_ANIMATION, MILLIS_PER_SPELL_ANIMATION } from './config';
import { lerp } from './math';

export interface AnimatableProps {
  x: number;
  y: number;
  rotation: number;
  alpha: number;
  scale: number;
}
interface AnimationGroup {
  startTime: number;
  animations: Animation[];
  resolvePromise: () => void;
}
interface Animation {
  sprite: PIXI.Sprite;
  start?: Partial<AnimatableProps>;
  target: Partial<AnimatableProps>;
}
export default class AnimationTimeline {
  constructor() {
    this.animate = this.animate.bind(this);
  }
  animating: boolean = false;
  animationGroups: AnimationGroup[] = [];
  // addAnimation takes an array of animations which will all be played simultaneously and returns
  // a promise that is fulfilled when the animations are done
  addAnimation(animations: Animation[]) {
    return new Promise<void>((resolve) => {
      // Animation to be played by itself
      this.animationGroups.push({
        startTime: 0,
        animations,
        resolvePromise: resolve,
      });
      // Now that a new animation has been added,
      // if not already animating, start animating
      if (!this.animating) {
        this.animating = true;
        requestAnimationFrame(this.animate);
      }
    });
  }
  animate(timestamp: number) {
    const currentAnimationGroup = this.animationGroups[0];
    if (currentAnimationGroup) {
      // Initialize startTime for group and start object for animations
      if (currentAnimationGroup.startTime == 0) {
        for (let currentAnimation of currentAnimationGroup.animations) {
          if (currentAnimation) {
            currentAnimation.start = {
              x: currentAnimation.sprite.x,
              y: currentAnimation.sprite.y,
              rotation: currentAnimation.sprite.rotation,
              // Scale is not designed to ever be skewed
              scale: currentAnimation.sprite.scale.x,
              alpha: currentAnimation.sprite.alpha,
            };
          }
        }
        currentAnimationGroup.startTime = timestamp;
      }
      // Calculate detla time from the start time (must come after startTime is initialized)
      const deltaTimeSinceStart = timestamp - currentAnimationGroup.startTime;
      // Animate one at a time until the whole list of animations is done
      const lerpTime = deltaTimeSinceStart / MILLIS_PER_ANIMATION;
      // Lerp animations
      for (let currentAnimation of currentAnimationGroup.animations) {
        if (currentAnimation) {
          const { sprite, start, target } = currentAnimation;
          if (start) {
            // Lerp the transform properties
            if (target.x !== undefined && start.x !== undefined) {
              sprite.x = lerp(start.x, target.x, lerpTime);
            }
            if (target.y !== undefined && start.y !== undefined) {
              sprite.y = lerp(start.y, target.y, lerpTime);
            }
            if (target.rotation !== undefined && start.rotation !== undefined) {
              sprite.rotation = lerp(start.rotation, target.rotation, lerpTime);
            }
            if (target.alpha !== undefined && start.alpha !== undefined) {
              sprite.alpha = lerp(start.alpha, target.alpha, lerpTime);
            }
            if (target.scale !== undefined && start.scale !== undefined) {
              sprite.scale.set(lerp(start.scale, target.scale, lerpTime));
            }
          }
        }
      }
      if (lerpTime >= 1) {
        // Report via promise that the anition is finished
        currentAnimationGroup.resolvePromise();
        // If the animationGroup is finished, remove it
        this.animationGroups.splice(0, 1);
      }
    }
    // Continue animating until all the animationGroups are complete
    if (this.animationGroups.length) {
      requestAnimationFrame(this.animate);
    } else {
      this.animating = false;
    }
  }
}

let independentAnimations: AnimationGroup[] = [];
export function animateIndependent(animations: Animation[]) {
  return new Promise<void>((resolve) => {
    independentAnimations.unshift({
      startTime: 0,
      animations,
      resolvePromise: resolve,
    });
  });
}
function animateIndependents(timestamp: number) {
  for (
    let groupIndex = independentAnimations.length - 1;
    groupIndex >= 0;
    groupIndex--
  ) {
    const group = independentAnimations[groupIndex];
    if (group) {
      const doRemove = animateGroup(group, timestamp);
      if (doRemove) {
        independentAnimations.splice(groupIndex, 1);
      }
    }
  }

  requestAnimationFrame(animateIndependents);
}
// Start animating:
requestAnimationFrame(animateIndependents);

// Executes the animating of an AnimationGroup
// Return value of true signifies that the animation is complete
function animateGroup(group: AnimationGroup, timestamp: number): boolean {
  if (group === undefined) {
    console.error('unexpected, animationGroup is undefined');
    return true;
  }
  // Initialize startTime for group and start object for animations
  if (group.startTime == 0) {
    for (let currentAnimation of group.animations) {
      if (currentAnimation) {
        currentAnimation.start = {
          x: currentAnimation.sprite.x,
          y: currentAnimation.sprite.y,
          rotation: currentAnimation.sprite.rotation,
          // Scale is not designed to ever be skewed
          scale: currentAnimation.sprite.scale.x,
          alpha: currentAnimation.sprite.alpha,
        };
      }
    }
    group.startTime = timestamp;
  }
  // Calculate detla time from the start time (must come after startTime is initialized)
  const deltaTimeSinceStart = timestamp - group.startTime;
  // Animate one at a time until the whole list of animations is done
  const lerpTime = deltaTimeSinceStart / MILLIS_PER_SPELL_ANIMATION;
  // Lerp animations within  group
  for (let currentAnimation of group.animations) {
    if (currentAnimation) {
      const { sprite, start, target } = currentAnimation;
      if (start) {
        // Lerp the transform properties
        if (target.x !== undefined && start.x !== undefined) {
          sprite.x = lerp(start.x, target.x, lerpTime);
        }
        if (target.y !== undefined && start.y !== undefined) {
          sprite.y = lerp(start.y, target.y, lerpTime);
        }
        if (target.rotation !== undefined && start.rotation !== undefined) {
          sprite.rotation = lerp(start.rotation, target.rotation, lerpTime);
        }
        if (target.alpha !== undefined && start.alpha !== undefined) {
          sprite.alpha = lerp(start.alpha, target.alpha, lerpTime);
        }
        if (target.scale !== undefined && start.scale !== undefined) {
          sprite.scale.set(lerp(start.scale, target.scale, lerpTime));
        }
      }
    }
  }
  if (lerpTime >= 1) {
    // Report via promise that the animation is finished
    group.resolvePromise();
    return true;
  } else {
    return false;
  }
}
