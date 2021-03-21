import type * as PIXI from 'pixi.js';

import { addPixiSprite } from './PixiUtils';
import { normalizeRadians, cellToBoardCoords } from './math';

export default class Image {
  sprite: PIXI.Sprite;
  subSprites: { [key: string]: PIXI.Sprite } = {};
  size_x: number;
  size_y: number;
  imageName: string;

  constructor(
    cellX: number,
    cellY: number,
    imageName: string,
    parent?: PIXI.Container,
  ) {
    // Save image path in unit so it's accessible when loading gamestate
    this.imageName = imageName;
    this.sprite = addPixiSprite(imageName, parent);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.rotation = 0;
    this.setPosition(cellX, cellY);
  }
  cleanup() {
    // Remove PIXI sprite
    this.sprite.parent.removeChild(this.sprite);
  }
  setPosition(cellX: number, cellY: number) {
    const { x, y } = cellToBoardCoords(cellX, cellY);
    this.sprite.x = x;
    this.sprite.y = y;
  }
  scale(scale) {
    // Clamp to a positive value
    scale = Math.max(0, scale);
    window.animationTimeline.addAnimation([
      {
        sprite: this.sprite,
        target: { scale },
      },
    ]);
  }
  addSubSprite(imageName, key) {
    const subSprite = addPixiSprite(imageName, this.sprite);
    subSprite.anchor.x = 0.5;
    subSprite.anchor.y = 0.5;
    this.subSprites[key] = subSprite;
    return subSprite;
  }
  removeSubSprite(key) {
    const subSprite = this.subSprites[key];
    if (subSprite) {
      subSprite.parent.removeChild(subSprite);
      delete this.subSprites[key];
    }
  }
  updateFilter(alpha) {
    window.animationTimeline.addAnimation([
      {
        sprite: this.sprite,
        target: { alpha },
      },
    ]);
  }
  move(cellX: number, cellY: number) {
    return window.animationTimeline.addAnimation([
      {
        sprite: this.sprite,
        target: cellToBoardCoords(cellX, cellY),
      },
    ]);
  }
  show() {
    window.animationTimeline.addAnimation([
      {
        sprite: this.sprite,
        target: { alpha: 1 },
      },
    ]);
  }
  hide() {
    window.animationTimeline.addAnimation([
      {
        sprite: this.sprite,
        target: { alpha: 0 },
      },
    ]);
  }
  take_hit() {
    window.animationTimeline
      .addAnimation([
        {
          sprite: this.sprite,
          target: { rotation: this.sprite.rotation + Math.PI * 2 },
        },
      ])
      .then(() => {
        this.sprite.rotation = normalizeRadians(this.sprite.rotation);
      });
  }
  attack(
    current_cellX: number,
    current_cellY: number,
    cellX: number,
    cellY: number,
  ) {
    // Move forward
    window.animationTimeline.addAnimation([
      {
        sprite: this.sprite,
        target: cellToBoardCoords(cellX, cellY),
      },
    ]);
    // Move back
    window.animationTimeline.addAnimation([
      {
        sprite: this.sprite,
        target: cellToBoardCoords(current_cellX, current_cellY),
      },
    ]);
  }
}
