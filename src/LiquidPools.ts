// 0: non liquid,

import { Material } from "./Conway";
import * as Vec from './jmath/Vec';
import { oneDimentionIndexToVec2, vec2ToOneDimentionIndex } from "./jmath/ArrayUtil";
import { rotateMatrix } from "./jmath/math";

// 1: liquid
export default [
    ...registerPool([
        1
    ], 1),
    ...registerPool([
        0, 0,
        1, 0,
        1, 0,
        1, 1,
    ], 2),
    ...registerPool([
        1, 1, 1, 1, 1
    ], 5),
    ...registerPool([
        1,
        1,
        1,
        1,
        1
    ], 1),
    ...registerPool([
        1, 1, 1,
        1, 1, 1,
        1, 1, 1,
    ], 3),
    ...registerPool([
        1, 0, 0, 1,
        1, 0, 0, 1,
        1, 0, 0, 1,
    ], 4),
    ...registerPool([
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 0, 0, 0,
        1, 1, 1, 1,
    ], 4),
]
function registerPool(matrixContents: number[], width: number): { width: number, contents: Material[] }[] {
    // Surround with 2 layers of ground so that they don't collide with other stamps
    // The first layer of ground leaves room for liquid corner pieces
    let surroundedTiles = surround(matrixContents, width);
    // The second layer of ground makes sure there's a margin between liquid pools so they don't
    // intersect in weird ways
    surroundedTiles = surround(surroundedTiles.contents, surroundedTiles.width);

    const newWidth = surroundedTiles.width;
    surroundedTiles.contents = surroundedTiles.contents.map(x => x === 1 ? Material.LIQUID : Material.GROUND)
    // Not get all 4 rotations:
    const rotation1 = rotateMatrix(surroundedTiles.contents, newWidth);
    const rotation2 = rotateMatrix(rotation1.contents, rotation1.width);
    const rotation3 = rotateMatrix(rotation2.contents, rotation2.width);
    return [
        surroundedTiles,
        rotation1,
        rotation2,
        rotation3,
    ];
}
interface Matrix {
    width: number,
    contents: number[]
}
export function surround(matrixContents: number[], width: number): Matrix {
    const newWidth = width + 2;
    const out: Matrix = { width: newWidth, contents: [] };
    const height = oneDimentionIndexToVec2(matrixContents.length - 1, width).y + 1;
    const newHeight = height + 2;
    // Initialize the new array
    for (let x = 0; x < newWidth; x++) {
        for (let y = 0; y < newHeight; y++) {
            const index = vec2ToOneDimentionIndex({ x, y }, newWidth);
            out.contents[index] = 0;
        }
    }
    // Stamp the old one over top of it:
    stampMatricies(out.contents, out.width, matrixContents, width, { x: 1, y: 1 });
    return out;

}

// For development, prints a matrix in a way in which it is easily
// readable.  Works well only with single digit contents 0-9
export function matrixToReadable(matrix: number[], width: number) {
    let out = '';
    for (let i = 0; i < matrix.length; i++) {
        const value = matrix[i];
        if (i % width == 0) {
            out += '\n';
        }
        out += value + ',';
    }
    return out;
}

// Stamp one array over top of another overriding the source's values
// Stamps from the top left of the stamp to the bottom right starting at
// the startStampPosition on the source matrix
// Mutates source
export function stampMatricies(source: any[], sourceWidth: number, stamp: any[], stampWidth: number, startStampPosition: Vec.Vec2) {
    // Abort if stamp would overflow
    const lastStampPosition = Vec.add(startStampPosition, oneDimentionIndexToVec2(stamp.length - 1, stampWidth));
    const lastStampIndexOnMatrix = vec2ToOneDimentionIndex(lastStampPosition, sourceWidth);
    if (lastStampPosition.x >= sourceWidth || lastStampIndexOnMatrix >= source.length) {
        return;
    }

    for (let stampIndex = 0; stampIndex < stamp.length; stampIndex++) {
        const material = stamp[stampIndex];
        if (material) {
            const stampPosition = oneDimentionIndexToVec2(stampIndex, stampWidth);
            const overridePosition = Vec.add(startStampPosition, stampPosition);
            const overrideIndex = vec2ToOneDimentionIndex(overridePosition, sourceWidth);
            source[overrideIndex] = material;
        }
    }

}
interface Stamp {
    start: Vec.Vec2,
    end: Vec.Vec2
}
export function doStampsOverlap(s1: Stamp, s2: Stamp): boolean {
    return Vec.isBetween(s1.start, s2.start, s2.end) || Vec.isBetween(s1.end, s2.start, s2.end)
}