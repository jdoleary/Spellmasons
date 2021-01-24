const BASE_PATH = 'images/';
const board = document.getElementById('board');
const CELL_SIZE = 64;
const MOVE_SPEED = 1000;

// https://webdva.github.io/how-i-implemented-client-side-linear-interpolation/
function lerp(start: number, end: number, time: number) {
  if (time >= 1) {
    return end;
  }
  return start * (1 - time) + end * time;
}
export default class Image {
  size_x: number;
  size_y: number;
  element: HTMLImageElement;
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

  constructor(imageName: string) {
    if (imageName) {
      this.element = document.createElement('img');
      this.element.src = BASE_PATH + imageName;
      this.element.id = `image-${Image.id}`;
      this.element.width = CELL_SIZE;
      this.element.height = CELL_SIZE;
      Image.id++;
      board.appendChild(this.element);
    }
  }
  animate(deltaTime: number) {
    this.deltaTimeAcc += deltaTime;
    this.x = lerp(this.x, this.targetX, this.deltaTimeAcc / MOVE_SPEED);
    this.y = lerp(this.y, this.targetY, this.deltaTimeAcc / MOVE_SPEED);
    this.rotation = lerp(
      this.rotation,
      this.targetRotation,
      this.deltaTimeAcc / MOVE_SPEED,
    );
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
    this.element.remove();
  }
  anim_spin() {}
  move(cell_x: number, cell_y: number) {
    this.targetX = cell_x * CELL_SIZE;
    this.targetY = cell_y * CELL_SIZE;
    // Reset delta time accumulator so it will animate again
    this.deltaTimeAcc = 0;
  }
}
