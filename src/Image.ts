import type { Transform } from './AnimationManager';
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
  static id: number = 0;
  transform: Transform = {
    x: 0,
    y: 0,
    rotation: 0,
  };

  constructor(
    cellX: number,
    cellY: number,
    directionX: number,
    directionY: number,
    imageName: string,
  ) {
    if (imageName) {
      this.element = document.createElement('img');
      this.element.src = BASE_PATH + imageName;
      this.element.id = `image-${Image.id}`;
      this.element.className = 'unit';
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
      this.set(cellX, cellY, rotation);
      const boardContents = document.getElementById('board-contents');
      boardContents.appendChild(this.element);
    }
  }
  cleanup() {
    // Remove DOM element
    this.element?.remove();
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
  // Used for initialization
  set(cell_x: number, cell_y: number, rotation: number) {
    this.transform.x = cell_x * CELL_SIZE;
    this.transform.y = cell_y * CELL_SIZE;
    this.transform.rotation = normalizeDegrees(rotation);
    window.animationManager.setTransform(this.element, this.transform);
  }
}
