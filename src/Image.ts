import type { AnimatableProps } from './AnimationManager';
const BASE_PATH = 'images/';
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
  element?: HTMLImageElement;
  imageName: string;
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
    if (imageName) {
      // Save image path in unit so it's accessible when loading gamestate
      this.imageName = imageName;
      this.element = document.createElement('img');
      this.element.src = BASE_PATH + imageName;
      this.element.id = `image-${Image.id}`;
      this.element.classList.add('game-image');
      this.element.width = CELL_SIZE;
      this.element.height = CELL_SIZE;
      Image.id++;
      let rotation = 0;
      // set and normalize rotation
      if (directionX > 0) {
        rotation = directionY == 0 ? -90 : directionY > 0 ? -45 : 225;
      } else if (directionX < 0) {
        rotation = directionY == 0 ? 90 : directionY > 0 ? 45 : -225;
      } else {
        rotation = directionY == 0 ? 0 : directionY > 0 ? 0 : 180;
      }
      this.set(cellX, cellY, rotation, 1.0);
      const boardContents = document.getElementById('board-contents');
      boardContents?.appendChild(this.element);
    }
  }
  cleanup() {
    // Remove DOM element
    this.element?.remove();
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
  set(cell_x: number, cell_y: number, rotation: number, scale: number) {
    this.transform.x = cell_x * CELL_SIZE;
    this.transform.y = cell_y * CELL_SIZE;
    this.transform.rotation = normalizeDegrees(rotation);
    this.transform.scale = scale;
    window.animationManager.setTransform(this.element, this.transform);
  }
}
