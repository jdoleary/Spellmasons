import * as PIXI from 'pixi.js';
import { CELL_SIZE } from './config';
import { app, containerFloatingText } from './PixiUtils';
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
  cellX,
  cellY,
  text,
  style = { fill: 'black' },
}: {
  cellX: number;
  cellY: number;
  text: string;
  style?: Partial<PIXI.ITextStyle>;
}) {
  const pixiText = new PIXI.Text(text, style);
  pixiText.x = cellX * CELL_SIZE + CELL_SIZE / 2;
  pixiText.y = cellY * CELL_SIZE + CELL_SIZE / 2;
  pixiText.anchor.x = 0.5;
  pixiText.anchor.y = 0.5;
  const instance = {
    // Place in the middle of cell
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
  if (instance.pixiText) {
    instance.y -= instance.vy;
    instance.vy = instance.vy * 0.97;
    instance.alpha -= Math.max(instance.valpha, 0);
    instance.valpha += 0.004;
    instance.pixiText.y = instance.y;
    instance.pixiText.x = instance.x;
    instance.pixiText.alpha = instance.alpha;
    // Once it's fully hidden / done animating
    if (instance.alpha < 0) {
      // Clean up the element
      app.stage.removeChild(instance.pixiText);
      // Prevent continued looping
      instance.pixiText = null;
    } else {
      requestAnimationFrame(() => floatAway(instance));
    }
  }
}
