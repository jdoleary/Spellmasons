import * as PIXI from 'pixi.js';
import type { Vec2 } from './Vec';
import { app, containerFloatingText, containerUIFixed, withinCameraBounds } from './PixiUtils';
import * as config from './config';

interface FText {
  x: number;
  y: number;
  // velocity y
  vy: number;
  alpha: number;
  valpha: number;
  pixiText: PIXI.Text;
  keepWithinCameraBounds: boolean;
}
interface FloatingTextInsructions {
  coords: Vec2;
  text: string;
  container?: PIXI.Container;
  style?: Partial<PIXI.ITextStyle>;
  keepWithinCameraBounds: boolean;
}
export default function floatingText({
  coords,
  text,
  container = containerFloatingText,
  style = { fill: 'white' },
  keepWithinCameraBounds = true
}: FloatingTextInsructions) {
  const pixiText = new PIXI.Text(text, style);
  pixiText.x = coords.x;
  pixiText.y = coords.y;
  pixiText.anchor.x = 0.5;
  pixiText.anchor.y = 0.5;
  // Keep floating text the same size regardless of camera zoom
  pixiText.scale.x = 1 / app.stage.scale.x;
  pixiText.scale.y = 1 / app.stage.scale.y;
  const instance = {
    x: pixiText.x,
    y: pixiText.y,
    pixiText,
    vy: 1,
    alpha: 1,
    valpha: -0.2,
    keepWithinCameraBounds,
  };
  container.addChild(pixiText);
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => floatAway(instance, resolve));
  })
}
function floatAway(instance: FText, resolve: (value: void) => void) {
  if (instance.alpha > 0) {
    instance.y -= instance.vy;
    instance.vy = instance.vy * 0.97;
    instance.alpha -= Math.max(instance.valpha, 0);
    instance.valpha += 0.004;
    if (instance.keepWithinCameraBounds) {
      const pos = withinCameraBounds(instance);
      instance.pixiText.y = pos.y;
      instance.pixiText.x = pos.x;
    } else {
      instance.pixiText.y = instance.y;
      instance.pixiText.x = instance.x;
    }
    instance.pixiText.alpha = instance.alpha;
    // Once it's fully hidden / done animating
    if (instance.alpha <= 0) {
      // Clean up the element
      if (instance.pixiText.parent) {
        instance.pixiText.parent.removeChild(instance.pixiText);
      }
      resolve();
    } else {
      requestAnimationFrame(() => floatAway(instance, resolve));
    }
  }
}
export const elPIXIHolder = document.getElementById('PIXI-holder') as HTMLElement;

let centeredTextAnimating = false;
let centeredTextQueue: { text: string, fill: string | number }[] = [];
export function queueCenteredFloatingText(text: string, fill: string | number = 'white') {
  if (window.devMode) {
    // skip floating text in dev mode for sake of time
    return;
  }
  if (!centeredTextAnimating) {
    centeredFloatingText(text, fill);
  } else {
    centeredTextQueue.push({ text, fill });
  }
}
export function centeredFloatingText(text: string, fill: string | number = 'white') {
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
      fontSize: '120px'
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
