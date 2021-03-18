import type * as PIXI from 'pixi.js';

import { addPixiSprite } from './PixiUtils';
import { CELL_SIZE } from './config';
import { normalizeDegrees } from './math';

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
    let rotation = 0;
    rotation = normalizeDegrees(rotation);
    this.sprite = addPixiSprite(imageName, parent);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.rotation = (rotation * Math.PI) / 180;

    const { x, y } = this.cellToBoardCoords(cellX, cellY);
    this.sprite.x = x;
    this.sprite.y = y;
  }
  // convert from cell coordinates to objective board coordinates
  cellToBoardCoords(cellX: number, cellY: number) {
    return {
      x: cellX * CELL_SIZE + CELL_SIZE / 2,
      y: cellY * CELL_SIZE + CELL_SIZE / 2,
    };
  }
  cleanup() {
    // Remove PIXI sprite
    this.sprite.parent.removeChild(this.sprite);
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
        target: this.cellToBoardCoords(cellX, cellY),
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
    window.animationTimeline.addAnimation([
      {
        sprite: this.sprite,
        target: { x: this.sprite.x + 10 },
      },
    ]);
    window.animationTimeline.addAnimation([
      {
        sprite: this.sprite,
        target: { x: this.sprite.x - 10 },
      },
    ]);
    window.animationTimeline.addAnimation([
      {
        sprite: this.sprite,
        target: { x: this.sprite.x },
      },
    ]);
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
        target: this.cellToBoardCoords(cellX, cellY),
      },
    ]);
    // Move back
    window.animationTimeline.addAnimation([
      {
        sprite: this.sprite,
        target: this.cellToBoardCoords(current_cellX, current_cellY),
      },
    ]);
  }
}
