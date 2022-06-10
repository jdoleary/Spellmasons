import { randInt } from "./rand";
import { equal, subtract, Vec2 } from "./Vec"

export enum Material {
    WATER,
    GROUND,
    WALL,
    VOID
}

/*
Materials by index correspond to image as such:
0,1,2
7   3
6,5,4
So the west size is 0,7,6,
north size is 0,1,2,
etc
*/
interface Cell {
    materials: Material[]
    image: string
}
interface Map {
    cells: (Cell | undefined)[];
    width: number;
}
// Convert a 1d array index to a 2d array index
// width: the width of the first dimention of the 2d array
export function oneDimentionIndexToVec2(index: number, width: number): Vec2 {
    return {
        x: index % width,
        y: Math.floor(index / width)
    }
}
// Disallows negative x or x > last column which would "wrap" and return a valid index that isn't a true neighbor
export function vec2ToOneDimentionIndexPreventWrap(pos: Vec2, width: number): number {
    if (pos.x < 0 || pos.x > width - 1) {
        return -1;
    }
    return pos.y * width + pos.x

}
// Convert a 2d array index to a 1d array index
export function vec2ToOneDimentionIndex(pos: Vec2, width: number): number {
    return pos.y * width + pos.x

}
const void_cell = {
    image: 'tiles/8.png',
    materials: [
        Material.WATER,
        Material.WATER,
        Material.WATER,
        Material.WATER,
        Material.WATER,
        Material.WATER,
        Material.WATER,
        Material.WATER,
    ]
};
const sourceCells: Cell[] = [
    {
        image: 'tiles/1.png',
        materials: [
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/2.png',
        materials: [
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/3.png',
        materials: [
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/4.png',
        materials: [
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/5.png',
        materials: [
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.WALL,
        ]
    },
    {
        image: 'tiles/6.png',
        materials: [
            Material.WATER,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.WALL,
            Material.WATER,
            Material.WATER,
        ]
    },
    {
        image: 'tiles/7.png',
        materials: [
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    void_cell,
    {
        image: 'tiles/9.png',
        materials: [
            Material.WATER,
            Material.WALL,
            Material.GROUND,
            Material.WALL,
            Material.WATER,
            Material.WATER,
            Material.WATER,
            Material.WATER,
        ]
    },
    {
        image: 'tiles/10.png',
        materials: [
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/11.png',
        materials: [
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/12.png',
        materials: [
            Material.GROUND,
            Material.WALL,
            Material.WATER,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    // {
    //     image: 'tiles/SAMPLE.png',
    //     materials: [
    //         Material.UPLEFT,
    //         Material.TOP,
    //         Material.UPRIGHT,
    //         Material.RIGHT,
    //         Material.BOTRIGHT,
    //         Material.BOTTOM,
    //         Material.BOTLEFT,
    //         Material.LEFT,
    //     ]
    // },
];

const LEFT_SIDE: Vec2 = { x: -1, y: 0 };
const RIGHT_SIDE: Vec2 = { x: 1, y: 0 };
const TOP_SIDE: Vec2 = { x: 0, y: -1 };
const BOTTOM_SIDE: Vec2 = { x: 0, y: 1 };
const SIDES = [LEFT_SIDE, RIGHT_SIDE, TOP_SIDE, BOTTOM_SIDE];

function opposideSide(side: Vec2): Vec2 {
    if (equal(LEFT_SIDE, side)) {
        return RIGHT_SIDE;
    }
    if (equal(RIGHT_SIDE, side)) {
        return LEFT_SIDE;
    }
    if (equal(TOP_SIDE, side)) {
        return BOTTOM_SIDE;
    }
    return TOP_SIDE;
}
// Of all the possible cells for a position, pick one
function pickCell(map: Map, position: Vec2): Cell | undefined {
    // Get all possible cells and limit them via constraints
    let possibleCells = [...sourceCells];
    // Limit via side constraints
    for (let side of SIDES) {
        const cellOnSide = getCell(map, subtract(position, side));
        // If there is another cell adjacent to current possible cell...
        if (cellOnSide) {
            // Limit the current possible cells via it's constraint
            const otherCellConstraint = getCellConstraintsForSide(cellOnSide, opposideSide(side));
            possibleCells = possibleCells.filter(c => {
                const currentCellConstraint = getCellConstraintsForSide(c, side);
                return doConstraintsMatch(otherCellConstraint, currentCellConstraint)
            });
        }
    }
    // Of the possible cells remaining, choose an random one
    const randomChoiseIndex = randInt(window.underworld.random, 0, possibleCells.length - 1);
    return possibleCells[randomChoiseIndex];
}

function getCell(map: Map, position: Vec2): Cell | undefined {
    return map.cells[vec2ToOneDimentionIndexPreventWrap(position, map.width)];
}

function doConstraintsMatch(constraint1: Material[], constraint2: Material[]): boolean {
    // Note: Cells are 3x3 so we only check the first 3 indicies of a constraint (they only 
    // have a length of 3)
    if (
        constraint1[0] == constraint2[0] &&
        constraint1[1] == constraint2[1] &&
        constraint1[2] == constraint2[2]
    ) {
        return true;
    }
    return false;
}


function getCellConstraintsForSide(cell: Cell, side: Vec2): Material[] {
    if (side.y == 0) {
        if (side.x == -1) {
            // Left Side
            // @ts-expect-error All cells will have the same length array of materials
            // so this index validation needs not be verified by typescript
            return [cell.materials[0], cell.materials[7], cell.materials[6]];
        } else {
            // Right Side
            // @ts-expect-error All cells will have the same length array of materials
            // so this index validation needs not be verified by typescript
            return [cell.materials[2], cell.materials[3], cell.materials[4]];
        }
    } else {
        if (side.y == -1) {
            // Top Side
            // @ts-expect-error All cells will have the same length array of materials
            // so this index validation needs not be verified by typescript
            return [cell.materials[0], cell.materials[1], cell.materials[2]];
        } else {
            // BottomSide
            // @ts-expect-error All cells will have the same length array of materials
            // so this index validation needs not be verified by typescript
            return [cell.materials[6], cell.materials[5], cell.materials[4]];
        }
    }
}

function generateNewMap(width: number): Map {
    const map: Map = {
        width,
        cells: []
    }
    // Step 1, fill the border:
    for (let i = 0; i < width * width; i++) {
        const pos = oneDimentionIndexToVec2(i, width);
        if (pos.x == 0 || pos.x == width - 1 || pos.y == 0 || pos.y == width - 1) {
            map.cells.push(void_cell);
        } else {
            map.cells.push(undefined);
        }
    }

    // Step2, Iterate and fill remaining cells:
    for (let i = 0; i < width * width; i++) {
        const pos = oneDimentionIndexToVec2(i, width);
        const cell = pickCell(map, pos)
        if (cell) {
            map.cells[i] = cell;
        } else {
            console.error('Cell could not be chosen for', pos.x, pos.y);
        }
    }

    return map;

}