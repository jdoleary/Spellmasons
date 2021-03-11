import type * as PIXI from 'pixi.js';

import { addPixiSprite, app } from './PixiUtils';
import type { AnimatableProps } from './AnimationManager';
import SubImage from './SubImage';
import { CELL_SIZE } from './config';

export function normalizeDegrees(degrees) {
  const remainder = degrees % 360;
  if (remainder < 0) {
    return 360 + remainder;
  } else {
    return remainder;
  }
}
export default class Image {
  sprite: PIXI.Sprite;
  size_x: number;
  size_y: number;
  // element: HTMLDivElement;
  // elSubImageHolder: HTMLDivElement;
  // unitImage: SubImage;
  imageName: string;
  subImages: { [name: string]: SubImage };
  static id: number = 0;
  transform: AnimatableProps = {
    x: 0,
    y: 0,
    rotation: 0,
    alpha: 1,
    scale: 1,
  };

  constructor(
    cellX: number,
    cellY: number,
    directionX: number,
    directionY: number,
    imageName: string,
  ) {
    this.subImages = {};
    // Save image path in unit so it's accessible when loading gamestate
    this.imageName = imageName;
    // this.sprite = document.createElement('div');
    let rotation = 0;
    // set and normalize rotation
    if (directionX > 0) {
      rotation = directionY == 0 ? -90 : directionY > 0 ? -45 : 225;
    } else if (directionX < 0) {
      rotation = directionY == 0 ? 90 : directionY > 0 ? 45 : -225;
    } else {
      rotation = directionY == 0 ? 0 : directionY > 0 ? 0 : 180;
    }
    // Unit rotation is handled explicitly in the unit subImage while other transforms that
    // happen in board space occur in this "Image".  This is so that sub images can stay with
    // the "Image" at large while the unit itself can have independent rotation
    rotation = normalizeDegrees(rotation);
    // this.unitImage = new SubImage(
    //   { rotation },
    //   CELL_SIZE,
    //   CELL_SIZE,
    //   imageName,
    // );
    this.sprite = addPixiSprite(imageName);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.rotation = (rotation * Math.PI) / 180;

    // this.sprite.appendChild(this.unitImage.element);
    // this.elSubImageHolder = document.createElement('div');
    // this.elSubImageHolder.classList.add('subimage-holder');
    // this.sprite.appendChild(this.elSubImageHolder);
    // this.sprite.style.width = `${CELL_SIZE}px`;
    // this.sprite.style.height = `${CELL_SIZE}px`;
    // this.sprite.id = `image-${Image.id}`;
    // this.sprite.classList.add('game-image');
    // Image.id++;
    this.set(cellX, cellY, 1.0);
    // const boardContents = document.getElementById('board-contents');
    // boardContents?.appendChild(this.sprite);
  }
  cleanup() {
    // Remove DOM element
    app.stage.removeChild(this.sprite);
    // this.sprite?.remove();
  }
  addSubImage(key, imageName) {
    const subImg = new SubImage(null, 20, 20, imageName);
    // this.elSubImageHolder.appendChild(subImg.element);
    this.subImages[key] = subImg;
  }
  removeSubImage(key) {
    this.subImages[key].cleanup();
    delete this.subImages[key];
  }
  scale(scale) {
    window.animationManager.addAnimation(this.sprite, this.transform, {
      // Clamp to positive values
      scale: Math.max(0, scale),
    });
  }
  remove() {
    window.animationManager.currentGroup.onFinishedCallbacks.push(() => {
      this.cleanup();
    });
  }
  updateFilter(opacityPercentage) {
    window.animationManager.addAnimation(this.sprite, this.transform, {
      opacity: opacityPercentage,
    });
  }
  anim_spin() {
    window.animationManager.addAnimation(this.sprite, this.transform, {
      rotation: this.transform.rotation + Math.PI * 2,
    });
  }
  move(cell_x: number, cell_y: number) {
    window.animationManager.addAnimation(this.sprite, this.transform, {
      x: cell_x * CELL_SIZE,
      y: cell_y * CELL_SIZE,
    });
  }
  attack(
    current_cell_x: number,
    current_cell_y: number,
    cell_x: number,
    cell_y: number,
  ) {
    // Move forward
    window.animationManager.addAnimation(this.sprite, this.transform, {
      x: cell_x * CELL_SIZE,
      y: cell_y * CELL_SIZE,
    });
    // Move back
    window.animationManager.addAnimation(this.sprite, this.transform, {
      x: current_cell_x * CELL_SIZE,
      y: current_cell_y * CELL_SIZE,
    });
  }
  // Used for initialization
  set(cell_x: number, cell_y: number, scale: number) {
    this.transform.x = cell_x * CELL_SIZE + CELL_SIZE / 2;
    this.transform.y = cell_y * CELL_SIZE + CELL_SIZE / 2;
    this.transform.scale = scale;
    window.animationManager.setTransform(this.sprite, this.transform);
  }
}
