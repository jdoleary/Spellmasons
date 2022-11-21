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
// export function placeLiquidSources(tiles: Material[], widthOf2DArray: number, numberOfLiquidSources: number, underworld: Underworld) {
//     if (numberOfLiquidSources == 0) {
//         return;
//     }
//     let candidatesForLiquidSource = [];
//     for (let i = 0; i < tiles.length; i++) {
//         const tile = tiles[i];
//         if (tile == Material.GROUND) {
//             const neighbors = getNeighbors(i, tiles, widthOf2DArray);
//             // If all of it's neighbors are ground it is a candidate for liquid pool
//             if (neighbors.every(t => t && t == Material.GROUND)) {
//                 candidatesForLiquidSource.push(i);
//             }
//         }
//     }
//     const chosenLiquidIndexes: number[] = [];
//     choose_random_liquid:
//     for (let i = 0; (i < tiles.length && chosenLiquidIndexes.length < numberOfLiquidSources); i++) {
//         const chosenIndex = candidatesForLiquidSource[randInt(underworld.random, 0, candidatesForLiquidSource.length)];

//         const goodIndex = tryToChooseIndex(chosenIndex, chosenLiquidIndexes, tiles, widthOf2DArray);
//         if (goodIndex) {
//             chosenLiquidIndexes.push(goodIndex);

//         }
//     }
//     for (let index of chosenLiquidIndexes) {
//         if (index !== undefined && tiles[index] !== undefined) {
//             tiles[index] = Material.LIQUID
//         }
//     }
// }

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

function tryToChooseIndex(chosenIndex: number | undefined, chosenLiquidIndexes: number[], tiles: Material[], widthOf2DArray: number): number | undefined {
    if (chosenIndex !== undefined && tiles[chosenIndex] !== undefined) {
        // Ensure the chosenIndex isn't bad in relation to other liquid pools which would cause
        // malformed ground and liquid walls
        // for (let preLiquidIndex of chosenLiquidIndexes) {
        //     const otherPosition = oneDimentionIndexToVec2(preLiquidIndex, widthOf2DArray);
        //     const position = oneDimentionIndexToVec2(chosenIndex, widthOf2DArray);
        //     const dist = distance(position, otherPosition);
        //     if (dist <= Math.SQRT2 * 2 && dist > Math.SQRT2) {
        //         // Bad location, too close to other liquid (but not touching) and could cause abberant liquid borders
        //         return undefined;
        //     }
        // }
        return chosenIndex;
    } else {
        console.error('Attempted to place liquid tile but undefined');
        return undefined;
    }

}