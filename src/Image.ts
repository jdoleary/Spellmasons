const BASE_PATH = 'images/';
const boardContents = document.getElementById('board-contents');
export const CELL_SIZE = 64;
const MOVE_SPEED = 1000;

// https://webdva.github.io/how-i-implemented-client-side-linear-interpolation/
function lerp(start: number, end: number, time: number) {
  if (time >= 1) {
    return end;
  }
  return start * (1 - time) + end * time;
}
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
  rotation = 0;
  // Pixel position, not cell position
  // Never set these directly,  they are set by this.animate
  x = 0;
  // Never set these directly,  they are set by this.animate
  // Pixel position, not cell position
  y = 0;
  targetRotation = 0;
  targetX = 0;
  targetY = 0;
  deltaTimeAcc = 0;

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
      if (directionX > 0) {
        rotation = directionY == 0 ? -90 : directionY > 0 ? -45 : 225;
      } else if (directionX < 0) {
        rotation = directionY == 0 ? 90 : directionY > 0 ? 45 : -225;
      } else {
        rotation = directionY == 0 ? 0 : directionY > 0 ? 0 : 180;
      }
      this.set(cellX, cellY, rotation);
      boardContents.appendChild(this.element);
    }
  }
  animate(deltaTime: number) {
    this.deltaTimeAcc += deltaTime;
    const lerpTime = this.deltaTimeAcc / MOVE_SPEED;
    this.x = lerp(this.x, this.targetX, lerpTime);
    this.y = lerp(this.y, this.targetY, lerpTime);
    this.rotation = lerp(this.rotation, this.targetRotation, lerpTime);
    if (lerpTime > 1) {
      // Normalize to set back to 0-360
      this.rotation = normalizeDegrees(this.rotation);
      this.targetRotation = this.rotation;
    }
    this.setTransform();
  }
  setTransform() {
    // Update styles:
    const newTransform =
      'translate(' +
      this.x +
      'px, ' +
      this.y +
      'px) rotate(' +
      this.rotation +
      'deg)';
    this.element.style.transform = newTransform;
  }
  cleanup() {
    // Remove DOM element
    this.element?.remove();
  }
  anim_spin() {
    this.targetRotation += 360;
    // Reset delta time accumulator so it will animate again
    this.deltaTimeAcc = 0;
  }
  move(cell_x: number, cell_y: number) {
    this.targetX = cell_x * CELL_SIZE;
    this.targetY = cell_y * CELL_SIZE;
    // Reset delta time accumulator so it will animate again
    this.deltaTimeAcc = 0;
  }
  // Used for initialization
  set(cell_x: number, cell_y: number, rotation: number) {
    this.x = cell_x * CELL_SIZE;
    this.targetX = this.x;
    this.y = cell_y * CELL_SIZE;
    this.targetY = this.y;
    this.rotation = normalizeDegrees(rotation);
    this.targetRotation = this.rotation;
    this.setTransform();
  }
}
