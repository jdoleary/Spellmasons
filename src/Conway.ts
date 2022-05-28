import { CaveTile, Materials } from "./MapOrganicCave";
import { randInt } from "./rand";
import type { Vec2 } from "./Vec"
import { oneDimentionIndexToVec2 } from "./WaveFunctionCollapse";

// Neighbors
// 0,1,2
// 7   3
// 6,5,4
function mutateViaRules(tile: CaveTile, neighbors: (CaveTile | undefined)[], state: ConwayState): CaveTile {
    // Replace empty tiles
    if (tile.material == Materials.Empty) {
        if (neighbors.some(t => t && t.material == Materials.Ground)) {
            // If any neighbor is Ground, make it a wall
            return { ...tile, material: Materials.Wall }
        } else if (neighbors.some(t => t && t.material == Materials.Wall)) {
            // If no neighbors are Ground and any neighbor is wall, make it a semi-wall
            return { ...tile, material: Materials.SemiWall }
        }
    }
    // Given a ground tile
    if (tile.material == Materials.Ground) {
        if (state.currentNumberOfLiquidPools < state.desiredNumberOfLiquidPools) {
            // If all of it's neighbors are ground it is a candidate for liquid pool
            if (neighbors.every(t => t && t.material == Materials.Ground)) {
                state.currentNumberOfLiquidPools++;
                return { ...tile, material: Materials.Liquid }
            }
        }

        // Grow liquid pools
        // If at least one neighbor is liquid
        if (neighbors.some(t => t && t.material == Materials.Liquid)) {
            // and all other neighbors are ground (so liquid doesn't butt up against walls and block pathing)
            if (neighbors.every(t => t && t.material == Materials.Ground || t?.material == Materials.Liquid)) {
                const roll = randInt(window.underworld.random, 0, 1)
                // chance of changing it to liquid and growing the pool
                if (roll == 0) {
                    return { ...tile, material: Materials.Liquid }
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
export function getNeighbors(tileIndex: number, tiles: CaveTile[], widthOf2DArray: number): (CaveTile | undefined)[] {
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
export function conway(tiles: CaveTile[], widthOf2DArray: number, state: ConwayState) {
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        if (tile) {
            const neighbors = getNeighbors(i, tiles, widthOf2DArray);
            tiles[i] = mutateViaRules(tile, neighbors, state);
        }
    }
}