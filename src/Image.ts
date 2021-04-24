import type * as PIXI from 'pixi.js';

import { addPixiSprite } from './PixiUtils';
import { normalizeRadians, cellToBoardCoords } from './math';
import Subsprites from './Subsprites';
import { animateIndependent } from './AnimationTimeline';
import type { Coords } from './commonTypes';

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
  spritesheetId: string,
  parent: PIXI.Container,
): IImage {
  const sprite = addPixiSprite(spritesheetId, parent);
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.rotation = 0;

  const image: IImage = {
    // Save image path in unit so it's accessible when loading gamestate
    imageName: spritesheetId,
    sprite,
    subSpriteInstances: {},
    subSprites: [],
    scale: 1,
  };
  setPosition(image, cellX, cellY);
  return image;
}
export function cleanup(image: IImage) {
  // Remove PIXI sprite
  if (image.sprite && image.sprite.parent) {
    // Remove subsprites
    image.sprite.removeChildren();
    image.sprite.parent.removeChild(image.sprite);
  }
}
export function changeSprite(image: IImage, sprite: PIXI.Sprite) {
  sprite.x = image.sprite.x;
  sprite.y = image.sprite.y;
  sprite.scale.x = image.sprite.scale.x;
  sprite.scale.y = image.sprite.scale.y;
  sprite.anchor.x = image.sprite.anchor.x;
  sprite.anchor.y = image.sprite.anchor.y;
  cleanup(image);
  image.sprite = sprite;
  restoreSubsprites(image);
}
export function load(image: IImage, parent: PIXI.Container) {
  const copy = { ...image };
  const { x, y } = copy.sprite;
  // Recreate the sprite using the create function so it initializes it properly
  const remadeSprite = create(0, 0, copy.imageName, parent).sprite;
  copy.sprite = remadeSprite;
  // Restore position
  copy.sprite.x = x;
  copy.sprite.y = y;
  // Restore subsprites
  copy.subSpriteInstances = {};
  restoreSubsprites(copy);

  // Restore scale
  scale(copy, copy.scale);
  return copy;
}
export function restoreSubsprites(image: IImage) {
  // Re-add subsprites
  const subSprites = [...image.subSprites];
  image.sprite.removeChildren();
  image.subSprites = [];
  for (let subSprite of subSprites) {
    addSubSprite(image, subSprite);
  }
}
// Returns only the properties that can be saved
// callbacks and complicated objects such as PIXI.Sprites
// are removed
export function serialize(image: IImage) {
  return {
    sprite: {
      x: image.sprite.x,
      y: image.sprite.y,
    },
    scale: image.scale,
    subSprites: image.subSprites,
    imageName: image.imageName,
  };
}
export function setPosition(image: IImage, cellX: number, cellY: number) {
  const { x, y } = cellToBoardCoords(cellX, cellY);
  image.sprite.x = x;
  image.sprite.y = y;
}
export function scale(image: IImage, scale: number) {
  // Clamp to a positive value
  scale = Math.max(0, scale);
  return animateIndependent([
    {
      sprite: image.sprite,
      target: { scale },
    },
  ]).then(() => {
    image.scale = scale;
  });
}
export function addSubSprite(image: IImage, key: string) {
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
export function removeSubSprite(image: IImage, key: string) {
  const subSprite = image.subSpriteInstances[key];
  if (subSprite) {
    // Remove PIXI.Sprite instance
    subSprite.parent.removeChild(subSprite);
    delete image.subSpriteInstances[key];
    // Remove from subSprites list
    image.subSprites = image.subSprites.filter((k) => k !== key);
  }
}
export function moveAbs(image: IImage, target: Coords) {
  return animateIndependent([
    {
      sprite: image.sprite,
      target,
    },
  ]);
}
export function move(image: IImage, cellX: number, cellY: number) {
  return animateIndependent([
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
  return animateIndependent([
    {
      sprite: image.sprite,
      target: { rotation: image.sprite.rotation + Math.PI * 2 },
    },
  ]).then(() => {
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
  return animateIndependent([
    {
      sprite: image.sprite,
      target: cellToBoardCoords(
        current_cellX + (cellX - current_cellX) / 2,
        current_cellY + (cellY - current_cellY) / 2,
      ),
    },
  ]).then(() => {
    // Move back
    return animateIndependent([
      {
        sprite: image.sprite,
        target: cellToBoardCoords(current_cellX, current_cellY),
      },
    ]);
  });
}
