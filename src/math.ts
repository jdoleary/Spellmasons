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
// The distance between two cells if you allow diagonal movement
export function cellDistance(cell1: Coords, cell2: Coords) {
  return Math.max(Math.abs(cell2.x - cell1.x), Math.abs(cell2.y - cell1.y));
}
// export function distance(cell1: Coords, cell2: Coords) {
//   return Math.sqrt(
//     Math.pow(cell2.x - cell1.x, 2) + Math.pow(cell2.y - cell1.y, 2),
//   );
// }

// Converts a singular index into x,y coords on a rectangle with a known width
export function indexToXY(index: number, width: number): Coords {
  return { x: index % width, y: Math.floor(index / width) };
}
export function xyToIndex(coords: Coords, width: number) {
  return coords.y * width + coords.x;
}

// Normalizes degrees within [0,360)
// for example 360 turns into 0
// 370 turns into 10
// -10 turns into 350
export function normalizeDegrees(degrees) {
  const remainder = degrees % 360;
  if (remainder < 0) {
    return 360 + remainder;
  } else {
    return remainder;
  }
}
