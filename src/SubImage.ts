import type * as PIXI from 'pixi.js';
import { addPixiSprite, app } from './PixiUtils';
import type { AnimatableProps } from './AnimationManager';

export default class SubImage {
  sprite: PIXI.Sprite;
  imageName: string;
  transform: AnimatableProps = {
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 100,
    scale: 1,
  };

  constructor(
    transform: AnimatableProps | null,
    width: number,
    height: number,
    imageName: string,
  ) {
    this.sprite = addPixiSprite(imageName);
    this.sprite.scale.x = width;
    this.sprite.scale.y = height;

    // Save image path in unit so it's accessible when loading gamestate
    this.imageName = imageName;
    if (transform) {
      Object.assign(this.transform, transform);
    }
    window.animationManager.setTransform(this.sprite, this.transform);
  }
  cleanup() {
    app.stage.removeChild(this.sprite);
  }
}
