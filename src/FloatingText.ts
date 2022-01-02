import * as PIXI from 'pixi.js';
import type { Coords } from './commonTypes';
import { containerFloatingText } from './PixiUtils';
interface FText {
  x: number;
  y: number;
  // velocity y
  vy: number;
  alpha: number;
  valpha: number;
  pixiText: PIXI.Text;
}
export default function floatingText({
  coords,
  text,
  style = { fill: 'black' },
}: {
  coords: Coords;
  text: string;
  style?: Partial<PIXI.ITextStyle>;
}) {
  const pixiText = new PIXI.Text(text, style);
  pixiText.x = coords.x;
  pixiText.y = coords.y;
  pixiText.anchor.x = 0.5;
  pixiText.anchor.y = 0.5;
  const instance = {
    x: pixiText.x,
    y: pixiText.y,
    pixiText,
    vy: 1,
    alpha: 1,
    valpha: -0.2,
  };
  containerFloatingText.addChild(pixiText);
  requestAnimationFrame(() => floatAway(instance));
}
function floatAway(instance: FText) {
  if (instance.alpha > 0) {
    instance.y -= instance.vy;
    instance.vy = instance.vy * 0.97;
    instance.alpha -= Math.max(instance.valpha, 0);
    instance.valpha += 0.004;
    instance.pixiText.y = instance.y;
    instance.pixiText.x = instance.x;
    instance.pixiText.alpha = instance.alpha;
    // Once it's fully hidden / done animating
    if (instance.alpha <= 0) {
      // Clean up the element
      if (instance.pixiText.parent) {
        instance.pixiText.parent.removeChild(instance.pixiText);
      }
    } else {
      requestAnimationFrame(() => floatAway(instance));
    }
  }
}
