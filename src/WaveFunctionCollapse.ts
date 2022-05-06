import { randInt } from "./rand";
import { add, equal, subtract, Vec2 } from "./Vec"

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
    materials: Material[];
    image: string;
    rotation: number;
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
// Convert a 2d array index to a 1d array index
export function vec2ToOneDimentionIndex(pos: Vec2, width: number): number {
    return pos.y * width + pos.x

}
const void_cell: Cell = {
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
    ],
    rotation: 0
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
        ],
        rotation: 0
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
        ],
        rotation: 0
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
        ],
        rotation: 0
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
        ],
        rotation: 0
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
        ],
        rotation: 0
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
        ],
        rotation: 0
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
        ],
        rotation: 0
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
        ],
        rotation: 0
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
        ],
        rotation: 0
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
        ],
        rotation: 0
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
        ],
        rotation: 0
    },
    {
        image: 'tiles/13.png',
        materials: [
            Material.WATER,
            Material.WALL,
            Material.GROUND,
            Material.WALL,
            Material.GROUND,
            Material.WALL,
            Material.WATER,
            Material.WATER,
        ],
        rotation: 0
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
    //     ],
    //     rotation: 0
    // },
].map(c => {
    // Return 4 copies, each rotated 90 degrees
    const rotatedOnce = rotateCell(c);
    const rotatedTwice = rotateCell(rotatedOnce);
    const rotatedThrice = rotateCell(rotatedTwice);
    return [
        c,
        rotatedOnce,
        rotatedTwice,
        rotatedThrice,
    ].filter(x => {
        // Remove perfect duplicates where rotating it does nothing to
        // change it's constraints.
        // Note: x==c always keep the unrotated copy
        return x == c || JSON.stringify(x.materials) != JSON.stringify(c.materials)
    })
}).flat();
console.log('source cells', sourceCells)

function rotateCell(c: Cell): Cell {
    const quarterRotation = Math.PI / 2;
    let rotation = c.rotation + quarterRotation;
    const materials: Material[] = [];
    // @ts-ignore we know that all cells have 8 materials
    // so we don't need to index check
    materials[0] = c.materials[6];
    // @ts-ignore we know that all cells have 8 materials
    // so we don't need to index check
    materials[1] = c.materials[7];
    // @ts-ignore we know that all cells have 8 materials
    // so we don't need to index check
    materials[2] = c.materials[0];
    // @ts-ignore we know that all cells have 8 materials
    // so we don't need to index check
    materials[3] = c.materials[1];
    // @ts-ignore we know that all cells have 8 materials
    // so we don't need to index check
    materials[4] = c.materials[2];
    // @ts-ignore we know that all cells have 8 materials
    // so we don't need to index check
    materials[5] = c.materials[3];
    // @ts-ignore we know that all cells have 8 materials
    // so we don't need to index check
    materials[6] = c.materials[4];
    // @ts-ignore we know that all cells have 8 materials
    // so we don't need to index check
    materials[7] = c.materials[5];
    return {
        image: c.image,
        materials,
        rotation
    }
}

const LEFT_SIDE: Vec2 = { x: -1, y: 0 };
const RIGHT_SIDE: Vec2 = { x: 1, y: 0 };
const TOP_SIDE: Vec2 = { x: 0, y: -1 };
const BOTTOM_SIDE: Vec2 = { x: 0, y: 1 };
const SIDES = [LEFT_SIDE, RIGHT_SIDE, TOP_SIDE, BOTTOM_SIDE];

function oppositeSide(side: Vec2): Vec2 {
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
        const cellOnSide = getCell(map, add(position, side));
        // If there is another cell adjacent to current possible cell...
        if (cellOnSide) {
            // Limit the current possible cells via it's constraint
            const otherCellConstraint = getCellConstraintsForSide(cellOnSide, oppositeSide(side));
            possibleCells = possibleCells.filter(c => {
                const currentCellConstraint = getCellConstraintsForSide(c, side);
                return doConstraintsMatch(otherCellConstraint, currentCellConstraint)
            });
        }
    }
    // Of the possible cells remaining, choose an random one
    const randomChoiceIndex = randInt(window.underworld.random, 0, possibleCells.length - 1);
    return possibleCells[randomChoiceIndex];
}

function getCell(map: Map, position: Vec2): Cell | undefined {
    return map.cells[vec2ToOneDimentionIndex(position, map.width)];
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

export function generateMap(width: number): Map {
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
        if (pos.x == 0 || pos.x == width - 1 || pos.y == 0 || pos.y == width - 1) {
            // This is a border cell and is already void
            continue;
        } else if (cell) {
            map.cells[i] = cell;
        } else {
            console.error('Cell could not be chosen for', pos.x, pos.y);
        }
    }

    return map;

}