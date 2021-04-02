import type * as PIXI from 'pixi.js';

import { addPixiSprite } from './PixiUtils';
import { normalizeRadians, cellToBoardCoords } from './math';
import Subsprites from './Subsprites';

export interface IImage {
  // Not to be serialized
  sprite: PIXI.Sprite;
  // image IS serializable and is used to create sprite
  imageName: string;
  // Not to be serialized
  subSpriteInstances: { [key: string]: PIXI.Sprite };
  // image IS serializable, it is a list of the keys corresponding to subSprite
  // data in Subsprites.ts
  subSprites: string[];
  scale: number;
}
export function create(
  cellX: number,
  cellY: number,
  imageName: string,
  parent?: PIXI.Container,
): IImage {
  const image: IImage = {
    // Save image path in unit so it's accessible when loading gamestate
    imageName,
    sprite: addPixiSprite(imageName, parent),
    subSpriteInstances: {},
    subSprites: [],
    scale: 1,
  };
  setPosition(image, cellX, cellY);
  return image;
}
export function cleanup(image: IImage) {
  // Remove PIXI sprite
  image.sprite.parent.removeChild(image.sprite);
}
export function load(image: IImage, parent?: PIXI.Container) {
  const instantiatedImage = create(0, 0, image.imageName, parent);
  instantiatedImage.sprite.x = image.sprite.x;
  instantiatedImage.sprite.y = image.sprite.y;
  scale(instantiatedImage, image.sprite.scale);
  // Re-add subsprites
  const subSprites = [...image.subSprites];
  image.subSprites = [];
  for (let subSprite of subSprites) {
    addSubSprite(instantiatedImage, subSprite);
  }
  return instantiatedImage;
}
// Returns only the properties that can be saved
// callbacks and complicated objects such as PIXI.Sprites
// are removed
export function serialize(image: IImage) {
  return {
    sprite: {
      x: image.sprite.x,
      y: image.sprite.y,
      scale: image.scale,
    },
    subSprites: image.subSprites,
    imageName: image.imageName,
  };
}
export function setPosition(image: IImage, cellX: number, cellY: number) {
  const { x, y } = cellToBoardCoords(cellX, cellY);
  image.sprite.x = x;
  image.sprite.y = y;
}
export function scale(image: IImage, scale) {
  // Clamp to a positive value
  scale = Math.max(0, scale);
  image.scale = scale;
  window.animationTimeline.addAnimation([
    {
      sprite: image.sprite,
      target: { scale },
    },
  ]);
}
export function addSubSprite(image: IImage, key) {
  // Don't add more than one copy
  if (!image.subSprites.includes(key)) {
    image.subSprites.push(key);
    const subSpriteData = Subsprites[key];
    const sprite = addPixiSprite(subSpriteData.imageName, image.sprite);
    sprite.alpha = subSpriteData.alpha;
    sprite.anchor.set(subSpriteData.anchor.x, subSpriteData.anchor.y);
    sprite.scale.set(subSpriteData.scale.x, subSpriteData.scale.y);
    image.subSpriteInstances[key] = sprite;
  }
}
export function removeSubSprite(image: IImage, key) {
  const subSprite = image.subSpriteInstances[key];
  if (subSprite) {
    // Remove PIXI.Sprite instance
    subSprite.parent.removeChild(subSprite);
    delete image.subSpriteInstances[key];
    // Remove from subSprites list
    image.subSprites = image.subSprites.filter((k) => k !== key);
  }
}
export function move(image: IImage, cellX: number, cellY: number) {
  return window.animationTimeline.addAnimation([
    {
      sprite: image.sprite,
      target: cellToBoardCoords(cellX, cellY),
    },
  ]);
}
export function show(image: IImage) {
  window.animationTimeline.addAnimation([
    {
      sprite: image.sprite,
      target: { alpha: 1 },
    },
  ]);
}
export function hide(image: IImage) {
  window.animationTimeline.addAnimation([
    {
      sprite: image.sprite,
      target: { alpha: 0 },
    },
  ]);
}
export function take_hit(image: IImage) {
  window.animationTimeline
    .addAnimation([
      {
        sprite: image.sprite,
        target: { rotation: image.sprite.rotation + Math.PI * 2 },
      },
    ])
    .then(() => {
      image.sprite.rotation = normalizeRadians(image.sprite.rotation);
    });
}
export function attack(
  image: IImage,
  current_cellX: number,
  current_cellY: number,
  cellX: number,
  cellY: number,
) {
  // Move forward
  window.animationTimeline.addAnimation([
    {
      sprite: image.sprite,
      target: cellToBoardCoords(cellX, cellY),
    },
  ]);
  // Move back
  window.animationTimeline.addAnimation([
    {
      sprite: image.sprite,
      target: cellToBoardCoords(current_cellX, current_cellY),
    },
  ]);
}
