// https://webdva.github.io/how-i-implemented-client-side-linear-interpolation/
export function lerp(start: number, end: number, time: number) {
  if (time >= 1) {
    return end;
  }
  if (time <= 0) {
    return start;
  }
  return start * (1 - time) + end * time;
}

interface Coords {
  x: number;
  y: number;
}
export function distance(cell1: Coords, cell2: Coords) {
  return Math.sqrt(
    Math.pow(cell2.x - cell1.x, 2) + Math.pow(cell2.y - cell1.y, 2),
  );
}

// Converts a singular index into x,y coords on a rectangle with a known width
export function indexToXY(index: number, width: number) {
  return { x: index % width, y: Math.floor(index / width) };
}
export function xyToIndex(coords: { x: number; y: number }, width: number) {
  return coords.y * width + coords.x;
}
