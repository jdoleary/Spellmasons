
// Convert a 1d array index to a 2d array index

import { Vec2 } from "./Vec";

// width: the width of the first dimention of the 2d array
export function oneDimentionIndexToVec2(index: number, width: number): Vec2 {
    return {
        x: index % width,
        y: Math.floor(index / width)
    }
}
// Disallows negative x or x > last column which would "wrap" and return a valid index that isn't a true neighbor
export function vec2ToOneDimentionIndexPreventWrap(pos: Vec2, width: number): number {
    if (pos.x < 0 || pos.x > width - 1) {
        return -1;
    }
    return pos.y * width + pos.x

}
// Convert a 2d array index to a 1d array index
export function vec2ToOneDimentionIndex(pos: Vec2, width: number): number {
    return pos.y * width + pos.x

}