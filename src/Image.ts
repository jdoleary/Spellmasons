import type * as PIXI from 'pixi.js';

import { addPixiSprite } from './PixiUtils';
import { normalizeRadians, cellToBoardCoords } from './math';
import Subsprites from './Subsprites';

export default class Image {
  // Not to be serialized
  sprite: PIXI.Sprite;
  // Not to be serialized
  subSpriteInstances: { [key: string]: PIXI.Sprite };
  // This IS serializable, it is a list of the keys corresponding to subSprite
  // data in Subsprites.ts
  subSprites: string[];
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
    this.subSpriteInstances = {};
    this.subSprites = [];
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
  addSubSprite(key) {
    // Don't add more than one copy
    if (!this.subSprites.includes(key)) {
      const subSpriteData = Subsprites[key];
      const sprite = addPixiSprite(subSpriteData.imageName, this.sprite);
      sprite.alpha = subSpriteData.alpha;
      sprite.anchor.set(subSpriteData.anchor.x, subSpriteData.anchor.y);
      sprite.scale.set(subSpriteData.scale.x, subSpriteData.scale.y);
      this.subSpriteInstances[key] = sprite;
    }
  }
  removeSubSprite(key) {
    const subSprite = this.subSpriteInstances[key];
    if (subSprite) {
      // Remove PIXI.Sprite instance
      subSprite.parent.removeChild(subSprite);
      delete this.subSpriteInstances[key];
      // Remove from subSprites list
      this.subSprites = this.subSprites.filter((k) => k !== key);
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
