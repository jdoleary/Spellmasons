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
}
export default function floatingText({
  coords,
  text,
  container = containerFloatingText,
  style = { fill: 'white' },
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
    keepWithinCameraBounds: true,
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
export function centeredFloatingText(text: string, fill = 'white') {
  floatingText({
    coords: {
      x: elPIXIHolder.clientWidth / 2,
      y: elPIXIHolder.clientHeight / 2
    },
    text,
    container: containerUIFixed,
    style: {
      fill,
      fontSize: '140px'
    }
  });

}
