import { distance } from "./math";
import { Vec2, vec2ToString } from "./Vec";

// spacialHashing is used to efficiently get a list (sorted by distance from a start point) of
// elements that extend Vec2.  Rather than interating the entire list of elements, we pre-hash
// the elements into cells.  Then the main function `getElementsSortedByDistance` can be used
// to pull elements only within a few cells of the source point OR `findNearestInList` which
// will stop searching once it finds the nearest

// returns the x,y coordinates of the cell that `element` is within given `cellSize`
function getCell(element: Vec2, cellSize: number): Vec2 {
    return {
        x: Math.floor(element.x / cellSize),
        y: Math.floor(element.y / cellSize)
    }
}
export type SpacialHash<T extends Vec2> = { [coordinate: string]: T[] };
export function generateHash<T extends Vec2>(elements: T[], cellSize: number): SpacialHash<T> {
    const hash: SpacialHash<T> = {};
    for (let element of elements) {
        const cellCoords = getCell(element, cellSize);
        // get cell or create empty array if it doesn't exist
        const cell = hash[vec2ToString(cellCoords)] ??= [];
        cell.push(element);
    }
    return hash;
}
function getRings(start: Vec2, ringsAway: number): string[] {
    const { x, y } = start;
    if (ringsAway === 0) return [`${x},${y}`];

    const result = [];
    let currentX = x + ringsAway;
    let currentY = y - ringsAway;

    // Move along the right edge, from bottom to top
    for (let i = 0; i < ringsAway * 2; i++) {
        result.push(`${currentX},${currentY + i}`);
    }

    currentY += ringsAway * 2;

    // Move along the top edge, from right to left
    for (let i = 0; i < ringsAway * 2; i++) {
        result.push(`${currentX - i},${currentY}`);
    }

    currentX -= ringsAway * 2;

    // Move along the left edge, from top to bottom
    for (let i = 0; i < ringsAway * 2; i++) {
        result.push(`${currentX},${currentY - i}`);
    }

    currentY -= ringsAway * 2;

    // Move along the bottom edge, from left to right
    for (let i = 0; i < ringsAway * 2; i++) {
        result.push(`${currentX + i},${currentY}`);
    }

    return result;

}
function getElementsInHash<T extends Vec2>(hash: SpacialHash<T>, startCell: Vec2, ringsDistance: number): T[] {
    const cells = [];
    for (let i = 0; i < ringsDistance + 1; i++) {
        cells.push(...getRings(startCell, i))
    }
    const elements = [];
    for (let c of cells) {
        elements.push(...(hash[c] || []));
    }
    return elements;
}
// Returns an array of elements sorted by closest to startPoint, limited search radius by distance
// Must be supplied with a spacial hash
export function getElementsSortedByDistance<T extends Vec2>(startPoint: Vec2, dist: number, hash: SpacialHash<T>, cellSize: number): T[] {
    const startCell = getCell(startPoint, cellSize);
    const ringsDistance = Math.floor(dist / cellSize);
    const elements = getElementsInHash(hash, startCell, ringsDistance);
    return elements.sort((a, b) => distance(a, startPoint) - distance(b, startPoint));
}
export function findNearestInList<T extends Vec2>(startPoint: Vec2, hash: SpacialHash<T>, filterFn?: (el: T) => boolean) {
    // TODO

}


export const testable = {
    getElementsInHash,
    getRings,
    getCell
}