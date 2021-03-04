import type { AnimatableProps } from './AnimationManager';
import SubImage from './SubImage';
export const CELL_SIZE = 64;

export function normalizeDegrees(degrees) {
  const remainder = degrees % 360;
  if (remainder < 0) {
    return 360 + remainder;
  } else {
    return remainder;
  }
}
export default class Image {
  size_x: number;
  size_y: number;
  element: HTMLDivElement;
  elSubImageHolder: HTMLDivElement;
  unitImage: SubImage;
  imageName: string;
  subImages: { [name: string]: SubImage };
  static id: number = 0;
  transform: AnimatableProps = {
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 100,
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
    this.element = document.createElement('div');
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
    this.unitImage = new SubImage(
      { rotation },
      CELL_SIZE,
      CELL_SIZE,
      imageName,
    );
    this.element.appendChild(this.unitImage.element);
    this.elSubImageHolder = document.createElement('div');
    this.elSubImageHolder.classList.add('subimage-holder');
    this.element.appendChild(this.elSubImageHolder);
    this.element.style.width = `${CELL_SIZE}px`;
    this.element.style.height = `${CELL_SIZE}px`;
    this.element.id = `image-${Image.id}`;
    this.element.classList.add('game-image');
    Image.id++;
    this.set(cellX, cellY, 1.0);
    const boardContents = document.getElementById('board-contents');
    boardContents?.appendChild(this.element);
    // this.addSubImage('damage', 'spell/damage.png');
  }
  cleanup() {
    // Remove DOM element
    this.element?.remove();
  }
  addSubImage(key, imageName) {
    const subImg = new SubImage(null, 20, 20, imageName);
    this.elSubImageHolder.appendChild(subImg.element);
    this.subImages[key] = subImg;
  }
  removeSubImage(key) {
    this.subImages[key].cleanup();
    delete this.subImages[key];
  }
  scale(scale) {
    window.animationManager.addAnimation(this.element, this.transform, {
      // Clamp to positive values
      scale: Math.max(0, scale),
    });
  }
  remove() {
    window.animationManager.currentGroup.onFinishedCallbacks.push(() => {
      this.element?.remove();
    });
  }
  updateFilter(opacityPercentage) {
    window.animationManager.addAnimation(this.element, this.transform, {
      opacity: opacityPercentage,
    });
  }
  anim_spin() {
    window.animationManager.addAnimation(this.element, this.transform, {
      rotation: this.transform.rotation + 360,
    });
  }
  move(cell_x: number, cell_y: number) {
    window.animationManager.addAnimation(this.element, this.transform, {
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
    window.animationManager.addAnimation(this.element, this.transform, {
      x: cell_x * CELL_SIZE,
      y: cell_y * CELL_SIZE,
    });
    // Move back
    window.animationManager.addAnimation(this.element, this.transform, {
      x: current_cell_x * CELL_SIZE,
      y: current_cell_y * CELL_SIZE,
    });
  }
  // Used for initialization
  set(cell_x: number, cell_y: number, scale: number) {
    this.transform.x = cell_x * CELL_SIZE;
    this.transform.y = cell_y * CELL_SIZE;
    this.transform.scale = scale;
    window.animationManager.setTransform(this.element, this.transform);
  }
}
