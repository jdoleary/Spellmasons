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
// A square "ring" of coordinates around a start point
// In the below example, the number is the "ringsAway"
// while the coordinates of the upper left most will be
// {x:-2,y:-2}
//
// 2,2,2,2,2
// 2,1,1,1,2
// 2,1,0,1,2
// 2,1,1,1,2
// 2,2,2,2,2
function getRing(start: Vec2, ringsAway: number): string[] {
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
        cells.push(...getRing(startCell, i))
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

// Returns a nearby element in `hash`
// ---
// Returns the near~~est~~"ish" element in the hash that meets the filterFn criteria.
// Super efficient thanks to the hash and non perfect accurracy (it doesn't return the
// nearEST so that it can stop as soon as it finds a match within the square rings without
// checking the next ring and sorting for closest.
export function quickFindNearish<T extends Vec2>(self: T, hash: SpacialHash<T>, filterFn?: (el: T) => boolean): T | undefined {
    // The number of elements in the hash that could potentially be checked
    let checksLeft = Object.values(hash).flat().length;
    let ringNumber = 0;
    while (checksLeft > 0) {
        const cells = getRing(self, ringNumber);
        const s2 = performance.now();
        for (let c of cells) {
            const elements = hash[c];
            if (elements) {
                const s3 = performance.now();
                for (let e of elements) {
                    checksLeft--;
                    // Do not match self as near neighbor
                    if (e === self) {
                        continue;
                    }
                    // if no filter function return the first element found
                    if (!filterFn) {
                        return e;
                    } else if (filterFn(e)) {
                        // if there is a filter function return the first element that satisfies it
                        return e;
                    }
                }
                console.log('jtest checkElements', performance.now() - s3);
            }
        }
        console.log('jtest checkCells', performance.now() - s2);
        ringNumber++;
    }
    return undefined;
}


export const testable = {
    getElementsInHash,
    getRings: getRing,
    getCell
}