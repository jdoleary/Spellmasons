import { chooseObjectWithProbability } from "./math";
import { add, equal, Vec2 } from "./Vec"

export enum Material {
    FLUID,
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
    materials: {
        top_left: Material,
        top_center: Material,
        top_right: Material,
        right_top: Material,
        right_center: Material,
        right_bottom: Material,
        bottom_right: Material,
        bottom_center: Material,
        bottom_left: Material,
        left_bottom: Material,
        left_center: Material,
        left_top: Material,
    };
    image: string;
    rotation: number;
    probability: number;
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
    materials: {
        top_left: Material.FLUID,
        top_center: Material.FLUID,
        top_right: Material.FLUID,
        right_top: Material.FLUID,
        right_center: Material.FLUID,
        right_bottom: Material.FLUID,
        bottom_right: Material.FLUID,
        bottom_center: Material.FLUID,
        bottom_left: Material.FLUID,
        left_bottom: Material.FLUID,
        left_center: Material.FLUID,
        left_top: Material.FLUID,
    },
    rotation: 0,
    probability: 10,
};
const sourceCells: Cell[] = [
    {
        image: 'tiles/all_wall.png',
        materials: {
            top_left: Material.WALL,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.WALL,
            bottom_right: Material.WALL,
            bottom_center: Material.WALL,
            bottom_left: Material.WALL,
            left_bottom: Material.WALL,
            left_center: Material.WALL,
            left_top: Material.WALL,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b1.png',
        materials: {
            top_left: Material.WALL,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.FLUID,
            right_center: Material.FLUID,
            right_bottom: Material.FLUID,
            bottom_right: Material.FLUID,
            bottom_center: Material.FLUID,
            bottom_left: Material.FLUID,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b2.png',
        materials: {
            top_left: Material.WALL,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.FLUID,
            right_bottom: Material.FLUID,
            bottom_right: Material.FLUID,
            bottom_center: Material.FLUID,
            bottom_left: Material.FLUID,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b3.png',
        materials: {
            top_left: Material.WALL,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.FLUID,
            bottom_right: Material.FLUID,
            bottom_center: Material.FLUID,
            bottom_left: Material.FLUID,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b4.png',
        materials: {
            top_left: Material.WALL,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.WALL,
            bottom_right: Material.FLUID,
            bottom_center: Material.FLUID,
            bottom_left: Material.FLUID,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b5.png',
        materials: {
            top_left: Material.WALL,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.WALL,
            bottom_right: Material.WALL,
            bottom_center: Material.FLUID,
            bottom_left: Material.FLUID,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b6.png',
        materials: {
            top_left: Material.WALL,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.WALL,
            bottom_right: Material.WALL,
            bottom_center: Material.WALL,
            bottom_left: Material.FLUID,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b7.png',
        materials: {
            top_left: Material.WALL,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.WALL,
            bottom_right: Material.WALL,
            bottom_center: Material.WALL,
            bottom_left: Material.WALL,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b8.png',
        materials: {
            top_left: Material.FLUID,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.FLUID,
            right_center: Material.FLUID,
            right_bottom: Material.FLUID,
            bottom_right: Material.FLUID,
            bottom_center: Material.FLUID,
            bottom_left: Material.FLUID,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b9.png',
        materials: {
            top_left: Material.FLUID,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.FLUID,
            right_bottom: Material.FLUID,
            bottom_right: Material.FLUID,
            bottom_center: Material.FLUID,
            bottom_left: Material.FLUID,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b10.png',
        materials: {
            top_left: Material.FLUID,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.FLUID,
            bottom_right: Material.FLUID,
            bottom_center: Material.FLUID,
            bottom_left: Material.FLUID,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b11.png',
        materials: {
            top_left: Material.FLUID,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.WALL,
            bottom_right: Material.FLUID,
            bottom_center: Material.FLUID,
            bottom_left: Material.FLUID,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b12.png',
        materials: {
            top_left: Material.FLUID,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.WALL,
            bottom_right: Material.WALL,
            bottom_center: Material.FLUID,
            bottom_left: Material.FLUID,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b13.png',
        materials: {
            top_left: Material.FLUID,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.WALL,
            bottom_right: Material.WALL,
            bottom_center: Material.WALL,
            bottom_left: Material.FLUID,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b14.png',
        materials: {
            top_left: Material.FLUID,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.WALL,
            bottom_right: Material.WALL,
            bottom_center: Material.WALL,
            bottom_left: Material.WALL,
            left_bottom: Material.FLUID,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b15.png',
        materials: {
            top_left: Material.FLUID,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.WALL,
            bottom_right: Material.WALL,
            bottom_center: Material.WALL,
            bottom_left: Material.WALL,
            left_bottom: Material.WALL,
            left_center: Material.FLUID,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    {
        image: 'tiles/b16.png',
        materials: {
            top_left: Material.FLUID,
            top_center: Material.WALL,
            top_right: Material.WALL,
            right_top: Material.WALL,
            right_center: Material.WALL,
            right_bottom: Material.WALL,
            bottom_right: Material.WALL,
            bottom_center: Material.WALL,
            bottom_left: Material.WALL,
            left_bottom: Material.WALL,
            left_center: Material.WALL,
            left_top: Material.FLUID,
        },
        rotation: 0,
        probability: 10,
    },
    // {
    //     image: 'tiles/8.png',
    //     materials: {
    //         top_left: Material.FLUID,
    //         top_center: Material.FLUID,
    //         top_right: Material.FLUID,
    //         right_top: Material.FLUID,
    //         right_center: Material.FLUID,
    //         right_bottom: Material.FLUID,
    //         bottom_right: Material.FLUID,
    //         bottom_center: Material.FLUID,
    //         bottom_left: Material.FLUID,
    //         left_bottom: Material.FLUID,
    //         left_center: Material.FLUID,
    //         left_top: Material.FLUID,
    //     },
    //     rotation: 0,
    //     probability: 10,
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

// Rotates a cell a quarter rotation clockwise
function rotateCell(c: Cell): Cell {
    const quarterRotation = Math.PI / 2;
    let rotation = c.rotation + quarterRotation;
    const materials = {
        top_left: c.materials.left_bottom,
        top_center: c.materials.left_center,
        top_right: c.materials.left_top,
        right_top: c.materials.top_left,
        right_center: c.materials.top_center,
        right_bottom: c.materials.top_right,
        bottom_right: c.materials.right_top,
        bottom_center: c.materials.right_center,
        bottom_left: c.materials.right_bottom,
        left_bottom: c.materials.bottom_right,
        left_center: c.materials.bottom_center,
        left_top: c.materials.bottom_left,
    };
    return {
        image: c.image,
        materials,
        rotation,
        probability: c.probability
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
    // const randomChoiceIndex = randInt(window.underworld.random, 0, possibleCells.length - 1);
    return chooseObjectWithProbability(possibleCells, window.underworld.random)
    // return possibleCells[randomChoiceIndex];
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
            return [cell.materials.left_top, cell.materials.left_center, cell.materials.left_bottom];
        } else {
            // Right Side
            return [cell.materials.right_top, cell.materials.right_center, cell.materials.right_bottom];
        }
    } else {
        if (side.y == -1) {
            // Top Side
            return [cell.materials.top_left, cell.materials.top_center, cell.materials.top_right];
        } else {
            // BottomSide
            return [cell.materials.bottom_left, cell.materials.bottom_center, cell.materials.bottom_right];
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