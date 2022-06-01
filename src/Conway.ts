import { randInt } from "./rand";
import type { Vec2 } from "./Vec"
import { oneDimentionIndexToVec2 } from "./WaveFunctionCollapse";
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
function mutateViaRules(tile: Material, neighbors: (Material | undefined)[], state: ConwayState): Material {
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
    // Given a ground tile
    if (tile == Material.GROUND) {
        if (state.currentNumberOfLiquidPools < state.desiredNumberOfLiquidPools) {
            // If all of it's neighbors are ground it is a candidate for liquid pool
            if (neighbors.every(t => t && t == Material.GROUND)) {
                state.currentNumberOfLiquidPools++;
                return Material.LIQUID
            }
        }

        // Grow liquid pools
        // If at least one neighbor is liquid
        if (neighbors.some(t => t == Material.LIQUID)) {
            // and all other neighbors are ground (so liquid doesn't butt up against walls and block pathing)
            if (neighbors.every(t => t && t == Material.GROUND || t == Material.LIQUID)) {
                const roll = randInt(window.underworld.random, 0, 1)
                // chance of changing it to liquid and growing the pool
                if (roll == 0) {
                    return Material.LIQUID
                }

            }

        }
    }

    return tile;
}

// Disallows negative x or x > last column which would "wrap" and return a valid index that isn't a true neighbor
function vec2ToOneDimentionIndexPreventWrap(pos: Vec2, width: number): number {
    if (pos.x < 0 || pos.x > width - 1) {
        return -1;
    }
    return pos.y * width + pos.x

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
    currentNumberOfLiquidPools: number;
    desiredNumberOfLiquidPools: number;
}
export function conway(tiles: Material[], widthOf2DArray: number, state: ConwayState) {
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        if (tile !== undefined) {
            const neighbors = getNeighbors(i, tiles, widthOf2DArray);
            tiles[i] = mutateViaRules(tile, neighbors, state);
        }
    }
}