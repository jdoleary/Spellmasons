import type * as PIXI from 'pixi.js';
import { clone, Vec2 } from '../jmath/Vec';
import * as config from '../config';
import { app, containerFloatingText, containerUIFixed, withinCameraBounds } from './PixiUtils';
import { Localizable } from '../localization';
import throttle from 'lodash.throttle';
import { test_ignorePromiseSpy } from '../promiseSpy';

interface FText {
  startPosition: Vec2;
  dy: number;
  // velocity y
  vy: number;
  alpha: number;
  valpha: number;
  aalpha: number;
  pixiText: PIXI.Text;
  keepWithinCameraBounds: boolean;
}
interface FloatingTextInsructions {
  coords: Vec2;
  text: Localizable;
  container?: PIXI.Container;
  style?: Partial<PIXI.ITextStyle>;
  keepWithinCameraBounds?: boolean;
  // Must be a negative number, determines how quickly the
  // floating text disappears
  valpha?: number;
  aalpha?: number;
  prediction?: boolean;
  aggregateMatcher?: RegExp;
}
// If too many instances of floatingText with the same text occur too
// quickly, just render one in their place
let optimizer: { [key: string]: { count: number, startTime: number, canon?: PIXI.Text } } = {}
// How many floatingText instances of the same text can be made before it makes a canon (aggregate)
const optimizeThreshold = 20;
const canonFontSize = 50;
export default function floatingText({
  coords,
  text,
  container = containerFloatingText,
  style = { fill: 'white' },
  keepWithinCameraBounds = true,
  valpha = -0.2,
  aalpha = 0.003,
  prediction,
  aggregateMatcher,
}: FloatingTextInsructions): Promise<void> {
  if (!(globalThis.pixi && app && container) || prediction) {
    return Promise.resolve();
  }
  const localizedText = i18n(text);

  // Optimize: Gather tons of floatingText of the same text into a single
  // aggregate
  let optim = optimizer[localizedText];
  const now = Date.now();
  // Delete record if the canon has disappeared OR if it's been 3 seconds since the optimizer
  // record was created
  if (optim && ((optim.canon && optim.canon.alpha <= 0) || (now - optim.startTime > 3000))) {
    delete optimizer[localizedText];
    optim = undefined;
  }
  if (!optim) {
    optimizer[localizedText] = optim = {
      count: 0,
      startTime: now
    }
  }
  optim.count++;
  const doOptimize = aggregateMatcher || optim.count > optimizeThreshold;
  if (aggregateMatcher) {
    if (optim.canon) {
      optim.canon.text = optim.canon.text.replace(aggregateMatcher, `${optim.count}`);
      return Promise.resolve();
    }
  } else {
    // Default optimize:
    // Default optimize is like aggregateMatcher but activates as a necessity to preserve framerate, while aggregateMatcher will always activate
    // if there's more than one
    if (doOptimize) {
      if (optim.canon) {
        optim.canon.text = optim.canon.text.replace(/(x\d+)$/, `x${optim.count}`);
        return Promise.resolve();
      }
    }
  }
  // End Optimize

  // Ensure style has drop shadow, but allow it to be overridden
  style = Object.assign({ ...config.PIXI_TEXT_DROP_SHADOW, fontFamily: 'Forum' }, style);
  const pixiText = new globalThis.pixi.Text(localizedText, style);
  pixiText.x = coords.x;
  pixiText.y = coords.y;
  pixiText.anchor.x = 0.5;
  pixiText.anchor.y = 0.5;
  if (container !== containerUIFixed) {
    // Keep floating text the same size regardless of camera zoom
    pixiText.scale.x = 1 / app.stage.scale.x;
    pixiText.scale.y = 1 / app.stage.scale.y;
  }
  // If optimizing and not short-circuited earlier, the canon text doesn't exist yet
  // so create it
  if (doOptimize && !optim.canon && globalThis.player) {
    optim.canon = pixiText;
    pixiText.style.fontSize = `${canonFontSize}px`;
    // @ts-ignore: A special flag to show that an instance of a pixitext
    // is an aggregate counter
    optim.canon.isCanon = true;
    if (!aggregateMatcher) {
      optim.canon.text = optim.canon.text + ` x${optim.count}`;
    }
    coords = clone(globalThis.player.unit);
    // Offset multiple canons so they don't overlap
    const numberOfExistingCanons = Object.values(optimizer).filter(x => x.canon).length;
    coords.y -= numberOfExistingCanons * canonFontSize / 2;
    // Disappear slower if canon
    aalpha *= 0.5;
  }
  const instance: FText = {
    startPosition: clone(coords),
    dy: 0,
    pixiText,
    vy: 1,
    alpha: 1,
    valpha,
    aalpha,
    keepWithinCameraBounds,
  };
  container.addChild(pixiText);
  // Prevent overlap
  const YDistanceFromOtherInstances = 20;
  for (let otherInstance of allFloatingTextInstances) {
    const diffY = otherInstance.startPosition.y - instance.startPosition.y;
    const diffX = otherInstance.startPosition.y - instance.startPosition.y;
    if (diffY >= 0 && diffY < YDistanceFromOtherInstances && diffX < (instance.pixiText.width + otherInstance.pixiText.width) / 2) {
      instance.startPosition.y = otherInstance.startPosition.y - YDistanceFromOtherInstances;
      pixiText.y = instance.startPosition.y;
    }

  }
  allFloatingTextInstances.push(instance);
  const promise = new Promise<void>((resolve) => {
    requestAnimationFrame(() => floatAway(instance, resolve));
  });
  test_ignorePromiseSpy(promise);
  return promise;
}
const allFloatingTextInstances: FText[] = [];
function floatAway(instance: FText, resolve: (value: void) => void) {
  if (instance.alpha > 0) {
    instance.dy -= instance.vy;
    instance.vy = instance.vy * 0.97;
    instance.alpha -= Math.max(instance.valpha, 0);
    instance.valpha += instance.aalpha;
    if (instance.keepWithinCameraBounds) {
      const adjustedPosition = withinCameraBounds(instance.startPosition, instance.pixiText.width / 2, instance.pixiText.height / 2);
      instance.pixiText.y = adjustedPosition.y + instance.dy;
      instance.pixiText.x = adjustedPosition.x;
    } else {
      instance.pixiText.y = instance.startPosition.y + instance.dy;
      instance.pixiText.x = instance.startPosition.x;
    }
    if (app) {
      if (instance.pixiText.parent !== containerUIFixed) {
        // Keep floating text the same size regardless of camera zoom
        instance.pixiText.scale.x = 1 / app.stage.scale.x;
        instance.pixiText.scale.y = 1 / app.stage.scale.y;
      }
    }
    instance.pixiText.alpha = instance.alpha;
    // Once it's fully hidden / done animating
    if (instance.alpha <= 0) {
      // Clean up the element
      if (instance.pixiText.parent) {
        instance.pixiText.parent.removeChild(instance.pixiText);
      }
      // Must manually clean up pixiText
      // https://www.html5gamedevs.com/topic/31749-how-to-cleaning-up-all-pixi-sprites-and-textures/?do=findComment&comment=182386
      instance.pixiText.destroy(true);
      const index = allFloatingTextInstances.indexOf(instance);
      if (index != -1) {
        allFloatingTextInstances.splice(index, 1);
      }
      resolve();
    } else {
      requestAnimationFrame(() => floatAway(instance, resolve));
    }
  }
}
export const elPIXIHolder = document.getElementById('PIXI-holder') as HTMLElement;

let centeredTextAnimating = false;
let centeredTextQueue: { text: Localizable, fill: string | number }[] = [];
export function queueCenteredFloatingText(text: Localizable, fill: string | number = 'white') {
  if (!centeredTextAnimating) {
    centeredFloatingText(text, fill);
  } else {
    centeredTextQueue.push({ text, fill });
  }
}
export function centeredFloatingText(text: Localizable, fill: string | number = 'white') {
  if (globalThis.headless) { return; }
  if (globalThis.recordingShorts) { return; }
  centeredTextAnimating = true;
  floatingText({
    coords: {
      x: elPIXIHolder.clientWidth / 2,
      y: elPIXIHolder.clientHeight / 2
    },
    text,
    container: containerUIFixed,
    style: {
      fill,
      fontSize: '120px',
      ...config.PIXI_TEXT_DROP_SHADOW
    },
    // centered text is FIXED to the center, so it shouldn't be adjusted based on the camera
    // position or else it will leave the center under certain camera positions
    keepWithinCameraBounds: false
  }).then(() => {
    if (centeredTextQueue.length) {
      const nextInQueue = centeredTextQueue.shift();
      if (nextInQueue) {
        const { text, fill } = nextInQueue
        return centeredFloatingText(text, fill)
      }
    }
  }).then(() => {
    centeredTextAnimating = false;
  });

}

export const warnNoMoreSpellsToChoose = throttle(() => {
  queueCenteredFloatingText('No more spell upgrades to pick from.');
}, 2000);