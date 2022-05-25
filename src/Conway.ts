import { CaveTile, Materials } from "./MapOrganicCave";
import { randInt } from "./rand";
import { equal, subtract, Vec2 } from "./Vec"
import { oneDimentionIndexToVec2, vec2ToOneDimentionIndex } from "./WaveFunctionCollapse";

interface Constraint {

}
// Neighbors
// 0,1,2
// 7   3
// 6,5,4
function mutateViaRules(tile: CaveTile, neighbors: (CaveTile | undefined)[]): CaveTile {
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
    return tile;

}

// Mutates tiles
export function conway(tiles: CaveTile[], widthOf2DArray: number) {
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        if (tile) {
            const { x, y } = oneDimentionIndexToVec2(i, widthOf2DArray);
            tiles[i] = mutateViaRules(tile, [
                tiles[vec2ToOneDimentionIndex({ x: x - 1, y: y - 1 }, widthOf2DArray)],
                tiles[vec2ToOneDimentionIndex({ x: x, y: y - 1 }, widthOf2DArray)],
                tiles[vec2ToOneDimentionIndex({ x: x + 1, y: y - 1 }, widthOf2DArray)],
                tiles[vec2ToOneDimentionIndex({ x: x + 1, y: y }, widthOf2DArray)],
                tiles[vec2ToOneDimentionIndex({ x: x + 1, y: y + 1 }, widthOf2DArray)],
                tiles[vec2ToOneDimentionIndex({ x: x, y: y + 1 }, widthOf2DArray)],
                tiles[vec2ToOneDimentionIndex({ x: x - 1, y: y + 1 }, widthOf2DArray)],
                tiles[vec2ToOneDimentionIndex({ x: x - 1, y: y }, widthOf2DArray)],
            ]);
        }
    }
}