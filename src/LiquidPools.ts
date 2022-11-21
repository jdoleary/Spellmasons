// 0: non liquid,

import { Material } from "./Conway";
import * as Vec from './jmath/Vec';
import { oneDimentionIndexToVec2, vec2ToOneDimentionIndex } from "./jmath/ArrayUtil";

// 1: liquid
export default [
    toMaterials([
        0, 0,
        1, 0,
        1, 0,
        1, 1,
    ], 2),
    toMaterials([
        1, 1, 1, 1, 1
    ], 5)
]
function toMaterials(matrixContents: number[], width: number): { width: number, materials: Material[] } {
    // Surround with 2 layers of ground so that they don't collide with other stamps
    // The first layer of ground leaves room for liquid corner pieces
    let surroundedTiles = surround(matrixContents, width);
    // surroundedTiles = surround(surroundedTiles.tiles, surroundedTiles.width);
    return { width, materials: surroundedTiles.contents.map(x => x === 1 ? Material.LIQUID : Material.GROUND) };
}
interface Matrix {
    width: number,
    contents: number[]
}
export function surround(matrixContents: number[], width: number): Matrix {
    const newWidth = width + 2;
    const out: Matrix = { width: newWidth, contents: [] };
    const height = oneDimentionIndexToVec2(matrixContents.length - 1, width).y;
    const newHeight = height + 3;
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
function matrixToReadable(matrix: number[], width: number) {
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
// Mutates source
export function stampMatricies(source: any[], sourceWidth: number, stamp: any[], stampWidth: number, startStampPosition: Vec.Vec2) {
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