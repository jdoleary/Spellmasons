import type * as PIXI from 'pixi.js';
import { Vec2 } from '../jmath/Vec';
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
}
export default function floatingText({
  coords,
  text,
  container = containerFloatingText,
  style = { fill: 'white' },
  keepWithinCameraBounds = true,
  valpha = -0.2,
  aalpha = 0.003,
}: FloatingTextInsructions): Promise<void> {
  if (!(globalThis.pixi && app && container)) {
    return Promise.resolve();
  }
  // Ensure style has drop shadow, but allow it to be overridden
  style = Object.assign({ ...config.PIXI_TEXT_DROP_SHADOW, fontFamily: 'Forum' }, style);
  const pixiText = new globalThis.pixi.Text(i18n(text), style);
  pixiText.x = coords.x;
  pixiText.y = coords.y;
  pixiText.anchor.x = 0.5;
  pixiText.anchor.y = 0.5;
  if (container !== containerUIFixed) {
    // Keep floating text the same size regardless of camera zoom
    pixiText.scale.x = 1 / app.stage.scale.x;
    pixiText.scale.y = 1 / app.stage.scale.y;
  }
  const instance: FText = {
    startPosition: coords,
    dy: 0,
    pixiText,
    vy: 1,
    alpha: 1,
    valpha,
    aalpha,
    keepWithinCameraBounds,
  };
  container.addChild(pixiText);
  const promise = new Promise<void>((resolve) => {
    requestAnimationFrame(() => floatAway(instance, resolve));
  });
  test_ignorePromiseSpy(promise);
  return promise;
}
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