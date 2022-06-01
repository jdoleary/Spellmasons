import { randInt } from "./rand";
import { add, equal, subtract, Vec2 } from "./Vec"

export enum Material {
    EMPTY,
    LIQUID,
    GROUND,
    WALL,
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
export interface Cell {
    materials: Material[];
    image: string;
}
export type Tile = Cell & Vec2;
export interface Map {
    tiles: (Tile | undefined)[];
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
export const all_liquid: Cell = {
    image: 'tiles/blood.png',
    materials: [
        Material.LIQUID,
        Material.LIQUID,
        Material.LIQUID,
        Material.LIQUID,
        Material.LIQUID,
        Material.LIQUID,
        Material.LIQUID,
        Material.LIQUID,
    ]
};
export const baseCells = {
    empty: {
        image: '',
        materials: Array(8).fill(Material.EMPTY)
    },
    wall: {
        image: 'tiles/wall.png',
        materials: Array(8).fill(Material.WALL)
    },
    semiWall: {
        image: 'tiles/wall.png',
        materials: Array(8).fill(Material.WALL)
    },
    liquid: {
        image: 'tiles/lava.png',
        materials: Array(8).fill(Material.LIQUID)
    },
    ground: {
        image: 'tiles/ground.png',
        materials: Array(8).fill(Material.GROUND)
    },
}
export const all_ground = {
    image: 'tiles/bloodFloor.png',
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
};
export const sourceCells: Cell[] = [
    all_liquid,
    all_ground,
    {
        image: 'tiles/bloodSideBottom.png',
        materials: [
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.LIQUID,
        ]
    },
    {
        image: 'tiles/bloodSideBottomLeft.png',
        materials: [
            Material.GROUND,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/bloodSideBottomRight.png',
        materials: [
            Material.LIQUID,
            Material.LIQUID,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.LIQUID,
        ]
    },
    {
        image: 'tiles/bloodSideLeft.png',
        materials: [
            Material.GROUND,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/bloodSideRight.png',
        materials: [
            Material.LIQUID,
            Material.LIQUID,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
        ]
    },
    {
        image: 'tiles/bloodSideTop.png',
        materials: [
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
        ]
    },
    {
        image: 'tiles/bloodSideTopLeft.png',
        materials: [
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/bloodSideTopRight.png',
        materials: [
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
        ]
    },
    {
        image: 'tiles/bloodWallBtm.png',
        materials: [
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.WALL,
            Material.WALL,
            Material.WALL,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/bloodWallBtmLeft.png',
        materials: [
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.WALL,
            Material.WALL,
            Material.WALL,
            Material.WALL,
        ]
    },
    {
        image: 'tiles/bloodWallBtmRight.png',
        materials: [
            Material.GROUND,
            Material.GROUND,
            Material.WALL,
            Material.WALL,
            Material.WALL,
            Material.WALL,
            Material.WALL,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/bloodWallLeft.png',
        materials: [
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.WALL,
            Material.WALL,
        ]
    },
    {
        image: 'tiles/bloodWallBtmRight.png',
        materials: [
            Material.GROUND,
            Material.GROUND,
            Material.WALL,
            Material.WALL,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/bloodWallTop.png',
        materials: [
            Material.WALL,
            Material.WALL,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/bloodWallTopLeft.png',
        materials: [
            Material.WALL,
            Material.WALL,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
            Material.WALL,
            Material.WALL,
        ]
    },
    {
        image: 'tiles/bloodWallTopRight.png',
        materials: [
            Material.WALL,
            Material.WALL,
            Material.WALL,
            Material.WALL,
            Material.WALL,
            Material.GROUND,
            Material.GROUND,
            Material.GROUND,
        ]
    },
    {
        image: 'tiles/bloodInsideCornerNW.png',
        materials: [
            Material.GROUND,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
        ]
    },
    {
        image: 'tiles/bloodInsideCornerNE.png',
        materials: [
            Material.LIQUID,
            Material.LIQUID,
            Material.GROUND,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
        ]
    },
    {
        image: 'tiles/bloodInsideCornerSE.png',
        materials: [
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.GROUND,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
        ]
    },
    {
        image: 'tiles/bloodInsideCornerSW.png',
        materials: [
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.LIQUID,
            Material.GROUND,
            Material.LIQUID,
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
// Considers constraints as inclusive instead of exclusive, so if theres ground tile on top, it'll make sure it picks tiles
// where at least one of the top constraints is ground. This allows for imperfect WFC building over a map that already
// has GENERAL materials down.
function loosePickCell(map: Map, position: Vec2, possibleCells: Cell[], { looseMatchFor, exactMatchFor }: { looseMatchFor: string, exactMatchFor: string }): Cell | undefined {
    const currentCell = getCell(map, position);
    // Get neighbors and the sides they are on
    let neighbors = SIDES.flatMap(side => {
        const cell = getCell(map, add(position, side));
        // Checking for cell.image intentionally excludes the "empty" cell
        return cell && cell.image ? [{ cell, side }] : [];
    });

    // If there are no neighbors, do nothing
    if (!neighbors.length) {
        return undefined;
    }
    // const baseCellImages = Object.values(baseCells).map(x => x.image);
    for (let { side, cell: cellOnSide } of neighbors) {
        // Limit the current possible cells via it's constraint
        const otherCellConstraint = getCellConstraintsForSide(cellOnSide, opposideSide(side));
        if (otherCellConstraint.length == 0) {
            // Each side MUST provide a constraint for this algorithm to decide to
            // pick a cell
            return undefined;
        }
        possibleCells = possibleCells.filter(c => {
            const currentCellConstraint = getCellConstraintsForSide(c, side);
            if (cellOnSide.image == looseMatchFor) {
                console.log('jtest loose', cellOnSide.image)
                return doConstraintsMatchLoose(otherCellConstraint, currentCellConstraint)
            } else {
                console.log('jtest strict', cellOnSide.image)
                return doConstraintsMatch(otherCellConstraint, currentCellConstraint)
            }
        });
    }
    if (equal(position, { x: 3, y: 6 })) {
        console.log('jtest position', position, possibleCells);
        debugger;
    }
    if (possibleCells.length == 0) {
        console.error('Could not find cell for neighbors', SIDES.flatMap(side => {
            const cell = getCell(map, subtract(position, side));
            return cell && cell.image ? [`${cell.image}: ${side.x}, ${side.y}`] : [];
        }))
    } else if (possibleCells.length == 1) {
        console.log('jtest picked cell', possibleCells[0]);
        return possibleCells[0]
    } else {
        console.log('jtest too many to pick from', possibleCells)
        return undefined
    }
}
// Of all the possible cells for a position, pick one
function pickCell(map: Map, position: Vec2, possibleCells: Cell[], considerConstraints: Material[]): Cell | undefined {
    console.log('jtest -----------pickCell for position', position);

    const currentCell = getCell(map, position);
    // if (currentCell?.image == baseCells.wall.image) {
    //     console.log('jtest filter on wall')
    //     possibleCells = possibleCells.filter(c => c.materials.includes(Material.WALL));
    // }
    // Limit via side constraints
    let neighbors = SIDES.flatMap(side => {
        const cell = getCell(map, add(position, side));
        // Checking for cell.image intentionally excludes the "empty" cell
        return cell && cell.image ? [{ cell, side }] : [];
    });
    if (currentCell?.image == baseCells.ground.image) {
        // Don't consider neighbors that have walls when tile is a ground tile
        // TODO explain
        neighbors = neighbors.filter(n => n.cell.materials.every(m => m != Material.WALL))
    }
    // if(neighbors.some(n => n.cell.materials.includes(Material.LIQUID))){
    //     console.log('jtest filter on liquid');
    //     possibleCells = pos
    // }
    // If there are no neighbors, it remains undefined
    if (!neighbors.length) {
        return undefined;
    }
    // const baseCellImages = Object.values(baseCells).map(x => x.image);
    for (let { side, cell: cellOnSide } of neighbors) {
        // Skip base cells, base cells do not provide constraints:
        if (currentCell?.image == cellOnSide.image) {
            // console.log('jtest skip', cellOnSide.image);
            continue;
        }
        if (!cellOnSide.materials.some(m => considerConstraints.includes(m))) {
            continue;
        }
        // console.log('jtest check', 'side', side, 'cellONside', cellOnSide);
        // console.log('jtest side ----', side, cellOnSide, position)
        // if (equal(position, { x: 7, y: 0 }) && equal(side, { x: 0, y: 1 })) {
        //     debugger;
        // }
        // Limit the current possible cells via it's constraint
        const otherCellConstraint = getCellConstraintsForSide(cellOnSide, opposideSide(side));
        if (otherCellConstraint.length == 0) {
            // Each side MUST provide a constraint
            return undefined;
        }
        possibleCells = possibleCells.filter(c => {
            const currentCellConstraint = getCellConstraintsForSide(c, side);
            return doConstraintsMatch(otherCellConstraint, currentCellConstraint)
        });
        // Log constraints
        // possibleCells.forEach(c => {
        //     const currentCellConstraint = getCellConstraintsForSide(c, side);
        //     console.log('jtest constraint', otherCellConstraint, side, currentCellConstraint, doConstraintsMatch(otherCellConstraint, currentCellConstraint), c);
        // })
    }
    // Of the possible cells remaining, choose an random one
    const randomChoiceIndex = randInt(window.underworld.random, 0, possibleCells.length - 1);
    if (possibleCells.length == 0) {
        console.error('Could not find cell for neighbors', SIDES.flatMap(side => {
            const cell = getCell(map, subtract(position, side));
            return cell && cell.image ? [`${cell.image}: ${side.x}, ${side.y}`] : [];
        }))
    } else if (possibleCells.length == 1) {
        console.log('jtest picked cell', possibleCells[randomChoiceIndex], 'of options', possibleCells)
        return possibleCells[0]
    } else {
        console.log('jtest too many to pick from', possibleCells)
        return undefined
    }
    // console.log('jtest: neighbors', SIDES.flatMap(side => {
    //     const cell = getCell(map, subtract(position, side));
    //     return cell && cell.image ? [`${cell.image}: ${side.x}, ${side.y}`] : [];
    // }), possibleCells)
    return possibleCells[randomChoiceIndex];
}

export function getCell(map: Map, position: Vec2): Cell | undefined {
    return map.tiles[vec2ToOneDimentionIndex(position, map.width)];
}

function doConstraintsMatchLoose(constraint1: Material[], constraint2: Material[]): boolean {
    if (
        constraint1[0] == constraint2[0] ||
        constraint1[1] == constraint2[1] ||
        constraint1[2] == constraint2[2]
    ) {
        return true;
    }
    return false;
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
export function resolveConflicts(map: Map) {
    const { width } = map;
    // 1: All lava tiles turn to blood
    for (let i = 0; i < width * width; i++) {
        const position = oneDimentionIndexToVec2(i, width);
        const cell = getCell(map, position);
        if (cell?.image == baseCells.liquid.image) {
            const tile = map.tiles[i];
            if (tile) {
                tile.materials = all_liquid.materials;
                tile.image = all_liquid.image;
            } else {
                console.error('tile not found at ', i, width)
            }

        }
    }
    // 2: All tiles with >= 3 lava tile neighbors turn to blood
    for (let i = 0; i < width * width; i++) {
        const position = oneDimentionIndexToVec2(i, width);
        const neighbors = SIDES.flatMap(side => {
            const cell = getCell(map, add(position, side));
            // Checking for cell.image intentionally excludes the "empty" cell
            return cell && cell.image ? [{ cell, side }] : [];
        });
        if (neighbors.filter(n => n.cell.image == all_liquid.image).length >= 3) {
            const tile = map.tiles[i];
            if (tile) {
                tile.materials = all_liquid.materials;
                tile.image = all_liquid.image;
            } else {
                console.error('tile not found at ', i, width)
            }

        }
    }

    return;
    // 3: All ground tiles with >= 1 liquid neighbor change based on constraints
    for (let j = 0; j < 2; j++) {

        for (let i = 0; i < width * width; i++) {
            const position = oneDimentionIndexToVec2(i, width);
            const cell = getCell(map, position);
            if (cell?.image == baseCells.ground.image) {
                const neighbors = SIDES.flatMap(side => {
                    const cell = getCell(map, add(position, side));
                    // Checking for cell.image intentionally excludes the "empty" cell
                    return cell && cell.image ? [{ cell, side }] : [];
                });
                if (neighbors.filter(n => n.cell.image == all_liquid.image).length >= 1) {
                    const possibleCells = sourceCells.filter(c => c.materials.some(m => m == Material.GROUND || m == Material.LIQUID)).filter(c => c != all_liquid)
                    const cell = loosePickCell(map, position, possibleCells, { looseMatchFor: baseCells.ground.image, exactMatchFor: all_liquid.image });
                    const tile = map.tiles[i];
                    if (tile) {
                        if (cell) {
                            tile.materials = cell.materials;
                            tile.image = cell.image;
                        }
                    }


                }
            }
        }
    }
    return
    // 4: All wall tiles with >= 1 ground neighbors pick via constraints
    for (let i = 0; i < width * width; i++) {
        const position = oneDimentionIndexToVec2(i, width);
        const cell = getCell(map, position);
        if (cell?.image == baseCells.wall.image) {
            const neighbors = SIDES.flatMap(side => {
                const cell = getCell(map, add(position, side));
                // Checking for cell.image intentionally excludes the "empty" cell
                return cell && cell.image ? [{ cell, side }] : [];
            });
            if (neighbors.filter(n => n.cell.materials.some(m => m == Material.GROUND)).length >= 1) {
                const possibleCells = sourceCells.filter(c => c.materials.some(m => m == Material.GROUND || m == Material.WALL)).filter(c => c != all_ground && c.materials.every(m => m != Material.LIQUID))
                const cell = pickCell(map, position, possibleCells);
                const tile = map.tiles[i];
                if (tile) {
                    if (cell) {
                        tile.materials = cell.materials;
                        tile.image = cell.image;
                    }
                }


            }
        }
    }
    // 5: All ground tiles with 4 ground neighbors become ground
    for (let i = 0; i < width * width; i++) {
        const position = oneDimentionIndexToVec2(i, width);
        const cell = getCell(map, position);
        if (cell?.image == baseCells.ground.image) {
            const neighbors = SIDES.flatMap(side => {
                const cell = getCell(map, add(position, side));
                // Checking for cell.image intentionally excludes the "empty" cell
                return cell && cell.image ? [{ cell, side }] : [];
            });
            if (neighbors.filter(n => n.cell.materials.some(m => m == Material.GROUND)).length == 4) {
                const tile = map.tiles[i];
                if (tile) {
                    tile.materials = all_ground.materials;
                    tile.image = all_ground.image;
                } else {
                    console.error('tile not found at ', i, width)
                }

            }
        }
    }


    ///////
    // Step1: Find all ground tiles with liquid neighbors and change them:
    // for (let i = 0; i < width * width; i++) {
    //     const position = oneDimentionIndexToVec2(i, width);
    //     const cell = getCell(map, position);
    //     if (cell?.image == baseCells.ground.image) {
    //         // Ensure it stays a cell with ground in it 
    //         // and without walls in it (ground tiles need to stay walkable)
    //         const possibleCells = sourceCells.filter(c => c.materials.some(m => m == Material.GROUND || m == Material.LIQUID))
    //         const cell = pickCell(map, position, possibleCells);
    //         const tile = map.tiles[i];
    //         if (tile) {
    //             if (cell) {
    //                 tile.materials = cell.materials;
    //                 tile.image = cell.image;
    //             }
    //         }

    //     }
    // }
    // // StepX: Find all ground tiles with wall neighbors and change them:
    // for (let i = 0; i < width * width; i++) {
    //     const position = oneDimentionIndexToVec2(i, width);
    //     const cell = getCell(map, position);
    //     if (cell?.image == baseCells.ground.image) {
    //         const possibleCells = sourceCells.filter(c => c.materials.some(m => m == Material.GROUND)).filter(c => c.materials.every(m => m != Material.LIQUID))
    //         const cell = pickCell(map, position, possibleCells);
    //         const tile = map.tiles[i];
    //         if (tile) {
    //             if (cell) {
    //                 tile.materials = cell.materials;
    //                 tile.image = cell.image;
    //             }
    //         }

    //     }
    // }
    // // Step2: Process walls next to ground tiles
    // // TODO explain
    // for (let i = 0; i < width * width; i++) {
    //     const position = oneDimentionIndexToVec2(i, width);
    //     const cell = getCell(map, position);
    //     if (cell?.image == baseCells.wall.image) {
    //         // Ensure it stays a cell with ground in it 
    //         // and without walls in it (ground tiles need to stay walkable)
    //         const possibleCells = sourceCells.filter(c => c.materials.some(m => m == Material.WALL));
    //         const cell = pickCell(map, position, possibleCells);
    //         const tile = map.tiles[i];
    //         if (tile) {
    //             if (cell) {
    //                 tile.materials = cell.materials;
    //                 tile.image = cell.image;
    //             }
    //         }

    //     }
    // }
    // Step2, Iterate and fill remaining cells:
    // for (let i = 0; i < width * width; i++) {
    //     // test
    //     // if (i > 7) {
    //     //     break;
    //     // }
    //     const pos = oneDimentionIndexToVec2(i, width);
    //     const cell = pickCell(map, pos)
    //     const tile = map.tiles[i];
    //     if (tile) {
    //         if (cell) {
    //             tile.materials = cell.materials;
    //             tile.image = cell.image;
    //         } else {
    //             if (tile.image == "") {
    //                 // Ignore, empty on purpose
    //             } else {
    //                 // console.error('Cell could not be chosen for', pos.x, pos.y, tile.image);
    //             }
    //         }
    //     } else {
    //         // console.error('Tile not found at index', i, width, map.tiles.length);
    //     }
    // }
    console.log('jtest map', map);

}
