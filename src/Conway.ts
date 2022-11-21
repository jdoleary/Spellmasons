import { oneDimentionIndexToVec2, vec2ToOneDimentionIndexPreventWrap } from "./jmath/ArrayUtil";
import Underworld from "./Underworld";
export enum Material {
    EMPTY,
    LIQUID,
    GROUND,
    WALL,
    SEMIWALL
}

// Neighbors
// 0,1,2
// 7   3
// 6,5,4
function mutateViaRules(tile: Material, neighbors: (Material | undefined)[], state: ConwayState, underworld: Underworld): Material {
    // Replace empty tiles
    if (tile == Material.EMPTY) {
        if (neighbors.some(t => t && t == Material.GROUND)) {
            // If any neighbor is GROUND, make it a wall
            return Material.WALL
        } else if (neighbors.some(t => t && t == Material.WALL)) {
            // If no neighbors are GROUND and any neighbor is wall, make it a semi-wall
            return Material.SEMIWALL
        }
    }
    return tile;
}

export function getNeighbors(tileIndex: number, tiles: Material[], widthOf2DArray: number): (Material | undefined)[] {
    const { x, y } = oneDimentionIndexToVec2(tileIndex, widthOf2DArray);
    const neighbors = [
        tiles[vec2ToOneDimentionIndexPreventWrap({ x: x - 1, y: y - 1 }, widthOf2DArray)],
        tiles[vec2ToOneDimentionIndexPreventWrap({ x: x, y: y - 1 }, widthOf2DArray)],
        tiles[vec2ToOneDimentionIndexPreventWrap({ x: x + 1, y: y - 1 }, widthOf2DArray)],
        tiles[vec2ToOneDimentionIndexPreventWrap({ x: x + 1, y: y }, widthOf2DArray)],
        tiles[vec2ToOneDimentionIndexPreventWrap({ x: x + 1, y: y + 1 }, widthOf2DArray)],
        tiles[vec2ToOneDimentionIndexPreventWrap({ x: x, y: y + 1 }, widthOf2DArray)],
        tiles[vec2ToOneDimentionIndexPreventWrap({ x: x - 1, y: y + 1 }, widthOf2DArray)],
        tiles[vec2ToOneDimentionIndexPreventWrap({ x: x - 1, y: y }, widthOf2DArray)],
    ];
    return neighbors;
}

// Mutates tiles based on what the tile's neighbors are
// Probably will need multiple passes to completely satisfy rules
export interface ConwayState {
    percentChanceOfLiquidSpread: number;
    liquidSpreadChanceFalloff: number;
}
export function conway(tiles: Material[], widthOf2DArray: number, state: ConwayState, underworld: Underworld) {
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        if (tile !== undefined) {
            const neighbors = getNeighbors(i, tiles, widthOf2DArray);
            tiles[i] = mutateViaRules(tile, neighbors, state, underworld);
        }
    }
}
// Return each neighbor tile index of a given tile index
export function getNeighborIndices(tileIndex: number, widthOf2DArray: number): (number | undefined)[] {
    const { x, y } = oneDimentionIndexToVec2(tileIndex, widthOf2DArray);
    const neighbors = [
        vec2ToOneDimentionIndexPreventWrap({ x: x - 1, y: y - 1 }, widthOf2DArray),
        vec2ToOneDimentionIndexPreventWrap({ x: x, y: y - 1 }, widthOf2DArray),
        vec2ToOneDimentionIndexPreventWrap({ x: x + 1, y: y - 1 }, widthOf2DArray),
        vec2ToOneDimentionIndexPreventWrap({ x: x + 1, y: y }, widthOf2DArray),
        vec2ToOneDimentionIndexPreventWrap({ x: x + 1, y: y + 1 }, widthOf2DArray),
        vec2ToOneDimentionIndexPreventWrap({ x: x, y: y + 1 }, widthOf2DArray),
        vec2ToOneDimentionIndexPreventWrap({ x: x - 1, y: y + 1 }, widthOf2DArray),
        vec2ToOneDimentionIndexPreventWrap({ x: x - 1, y: y }, widthOf2DArray),
    ];
    return neighbors;
}
