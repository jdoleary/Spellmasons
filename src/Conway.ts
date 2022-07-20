import { randInt } from "./jmath/rand";
import { oneDimentionIndexToVec2, vec2ToOneDimentionIndexPreventWrap } from "./jmath/ArrayUtil";
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

        // Grow liquid pools
        // If at least one neighbor is liquid
        if (neighbors.some(t => t == Material.LIQUID)) {
            // and all other neighbors are ground (so liquid doesn't butt up against walls and block pathing)
            if (neighbors.every(t => t && t == Material.GROUND || t == Material.LIQUID)) {
                const roll = randInt(globalThis.underworld.random, 0, 100)
                // chance of changing it to liquid and growing the pool
                if (roll <= state.percentChanceOfLiquidSpread) {
                    // As liquid spreads decrease the chances of it spreading
                    state.percentChanceOfLiquidSpread -= state.liquidSpreadChanceFalloff;
                    return Material.LIQUID
                }

            }

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
// TODO: There are many better ways to grow more interesting pools of liquid.  This one is too uniform
export interface ConwayState {
    percentChanceOfLiquidSpread: number;
    liquidSpreadChanceFalloff: number;
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
export function placeLiquidSources(tiles: Material[], widthOf2DArray: number, numberOfLiquidSources: number) {
    let candidatesForLiquidSource = [];
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        if (tile == Material.GROUND) {
            const neighbors = getNeighbors(i, tiles, widthOf2DArray);
            // If all of it's neighbors are ground it is a candidate for liquid pool
            if (neighbors.every(t => t && t == Material.GROUND)) {
                candidatesForLiquidSource.push(i);
            }
        }
    }
    for (let i = 0; i < numberOfLiquidSources; i++) {
        const chosenIndex = candidatesForLiquidSource[randInt(globalThis.underworld.random, 0, candidatesForLiquidSource.length)];

        if (chosenIndex !== undefined && tiles[chosenIndex] !== undefined) {
            tiles[chosenIndex] = Material.LIQUID;
        } else {
            console.error('Attempted to place liquid tile but undefined')
        }
    }
}