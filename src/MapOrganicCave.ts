import { lineSegmentIntersection } from "./jmath/lineSegment";
import { distance, lerp, similarTriangles } from "./jmath/math";
import { isVec2InsidePolygon } from "./jmath/Polygon2";
import { chooseOneOfSeeded, getUniqueSeedStringPerLevel, randBool, randFloat, randInt, randSign, seedrandom } from "./jmath/rand";
import * as Vec from "./jmath/Vec";
import * as config from './config';
import { oneDimentionIndexToVec2, vec2ToOneDimentionIndex, vec2ToOneDimentionIndexPreventWrap } from "./jmath/ArrayUtil";
import { conway, Material } from "./Conway";
import type { IObstacle } from "./entity/Obstacle";
import Underworld, { Biome } from "./Underworld";
import LiquidPools, { doStampsOverlap, stampMatricies, surround } from './LiquidPools';
import { fixLiquid, handmadeMaps } from "./MapsHandmade";

export const caveSizes: { [size: string]: CaveParams } = {
    'tutorial': {
        numberOfLiquidSources: 0,
        minThickness: config.OBSTACLE_SIZE,
        startThickness: 150,
        startPointJitter: 0,
        iterations: 1,
        velocity: 60,
    },
    'extrasmall': {
        minThickness: config.OBSTACLE_SIZE,
        startThickness: 150,
        startPointJitter: 200,
        iterations: 10,
        velocity: 40,
    },
    'small': {
        minThickness: config.OBSTACLE_SIZE,
        startThickness: 10,
        startPointJitter: 300,
        iterations: 20,
        velocity: 50,
    },
    'medium': {
        minThickness: config.OBSTACLE_SIZE,
        startThickness: 50,
        startPointJitter: 500,
        iterations: 20,
        velocity: 80,
    }
}
interface CaveParams {
    numberOfLiquidSources?: number;
    minThickness: number;
    startThickness: number;
    // How far apart the starting points of the cave
    // crawlers could be from the center
    startPointJitter: number;
    // How many steps the cave crawlers take,
    iterations: number;
    velocity: number;
    // How far each cave crawler step is
}
const directionRandomAmount = Math.PI / 2;
export interface Limits { xMin: number, xMax: number, yMin: number, yMax: number };


// Level generation happens in a few different steps
// An algorithm makes an array of Materials (Conway's Material.Ground and Material.Empty)
// The array has a width so that it can be expressed as a 2D array.
// Then stampLiquids is used to make pools of liquid in places where the ground is big enough
// Then the conway algorithm is used to place walls and semi-walls
// Then the materials array is converted into a tiles array
// Then convertBaseTilesToFinalTiles is used to turn the tiles into their final images
export function generateCave(params: CaveParams, biome: Biome, underworld: Underworld): { map: Map, limits: Limits } {
    const seed = seedrandom(getUniqueSeedStringPerLevel(underworld));
    // Currently an X% chance of using a handmade map
    // and levelIndex check since most handmade maps are large
    // TODO: eventually maybe do a check to see how many enemies are spawning
    // and choose an appropriately sized map
    const useHandmade = globalThis.forceCustomMapName || (underworld.levelIndex >= 5 && randInt(0, 100, seed) <= 20);
    let tiles: Tile[];
    let width: number = 16;
    let height: number = 16;
    let liquid;
    let handmadeMapData = useHandmade ? chooseOneOfSeeded(handmadeMaps, seed) : undefined
    if (globalThis.forceCustomMapName && underworld.pie.soloMode) {
        const foundMap = handmadeMaps.find(m => (m.name || '').toLowerCase() == globalThis.forceCustomMapName.toLowerCase())
        if (foundMap) {
            handmadeMapData = foundMap
        } else {
            console.error('Attempted to load handmade map with name', globalThis.forceCustomMapName, ' but was not found.')
        }
    }
    if (useHandmade && handmadeMapData) {
        handmadeMapData = fixLiquid(handmadeMapData)
        const _height = handmadeMapData.height;
        const _width = handmadeMapData.width;
        tiles = handmadeMapData.data.map((t, i) => ({
            image: ['', `${biome}/all_ground.png`,
                `${biome}/all_liquid.png`,
                `${biome}/liquidCornerNE.png`,
                `${biome}/liquidCornerNW.png`,
                `${biome}/liquidCornerSE.png`,
                `${biome}/liquidCornerSW.png`,
                `${biome}/liquidEGroundW.png`,
                `${biome}/liquidInsideCornerNE.png`,
                `${biome}/liquidInsideCornerNW.png`,
                `${biome}/liquidInsideCornerSE.png`,
                `${biome}/liquidInsideCornerSW.png`,
                `${biome}/liquidNGroundS.png`,
                `${biome}/liquidSGroundN.png`,
                `${biome}/liquidWGroundE.png`,
                `${biome}/wall.png`, `${biome}/wallN.png`][t] as string,
            x: 64 * (i % _width),
            y: 64 * Math.floor(i / _width)
        }));
        width = _width;
        height = Math.floor(tiles.length / _height);
        liquid = tiles.filter(t => t.image.includes('liquid')).map(x => ({ ...x, image: `${biome}/all_liquid.png` }));

    } else {

        let { materials, width: _width } = makeLevelMaterialsArray(params, underworld);
        width = _width;
        stampLiquids(materials, width, underworld);
        // Increase the size of the map on all sides so that no stamped liquid pools
        // touch the outside edge which would break the pathing polygons of the walls
        const { contents: matrixContents, width: newWidth } = surround(materials, width);
        // Reassign width, height and materials array now that it has grown
        width = newWidth;
        height = Math.floor(matrixContents.length / width);
        materials = matrixContents;

        // 1st pass for walls
        conway(materials, width, underworld);
        // 2nd pass for semi-walls
        conway(materials, width, underworld);

        // Convert array of materials into tiles
        tiles = materials.map((m, i) => {
            const dimentions = oneDimentionIndexToVec2(i, width);
            let image = baseTiles.empty;
            switch (m) {
                case Material.GROUND:
                    image = baseTiles.ground;
                    break;
                case Material.LIQUID:
                    image = baseTiles.liquid;
                    break;
                case Material.WALL:
                    image = baseTiles.wall;
                    break;
            }
            return { image, x: dimentions.x * config.OBSTACLE_SIZE, y: dimentions.y * config.OBSTACLE_SIZE }
        });
        liquid = tiles.filter(t => t.image == baseTiles.liquid);
    }
    const bounds = getLimits(tiles);


    const map = {
        biome,
        liquid,
        tiles,
        width,
        height
    };
    convertBaseTilesToFinalTiles(map);
    return { map, limits: bounds };

}


function stampLiquids(materials: Material[], width: number, underworld: Underworld) {
    const NUMBER_OF_POOLS = 4;
    let failedAttempts = 0;
    const stampedRecords = [];
    // Make a new liquid pool
    make_pool:
    for (let i = 0; i < NUMBER_OF_POOLS; i++) {
        // Prevent infinite loop if it cannot find a new place for a pool
        if (failedAttempts > 100) {
            return;
        }
        const stamp = LiquidPools[randInt(0, LiquidPools.length, underworld.random)];
        // Start the stamp
        const chosenIndex = randInt(0, materials.length, underworld.random);
        // Ensure that the start point is already a ground material to prevent
        // the liquid from being stamped in an "island" surrounded by walls
        if (materials[chosenIndex] !== Material.GROUND) {
            failedAttempts++;
            i--;
            continue make_pool;
        }
        const startStampPosition = oneDimentionIndexToVec2(chosenIndex, width);
        if (stamp) {
            const stampRecord = {
                start: startStampPosition,
                end: Vec.add(startStampPosition, oneDimentionIndexToVec2(stamp.contents.length - 1, stamp.width))
            };
            // Make sure there are no collisions with other stamps:
            for (let otherStamp of stampedRecords) {
                if (doStampsOverlap(stampRecord, otherStamp)) {
                    failedAttempts++;
                    i--;
                    continue make_pool;
                }
            }
            stampedRecords.push(stampRecord);
            // Override current materials:
            stampMatricies(materials, width, stamp.contents, stamp.width, startStampPosition);
        }
    }
}
function makeLevelMaterialsArray(params: CaveParams, underworld: Underworld) {
    return makeLevelMaterialsArrayCaveStyle(params, underworld);
    // return makeLevelMaterialsArrayRoomStyle(params, underworld);
}
function makeLevelMaterialsArrayRoomStyle(params: CaveParams, underworld: Underworld) {
    let width = 64;
    let height = 64;
    let materials: Material[] = Array(width * height).fill(Material.EMPTY);
    const NUMBER_OF_HALLS = 3;
    let lastStamp: { position: Vec.Vec2, width: number, height: number } | undefined;
    for (let i = 0; i < NUMBER_OF_HALLS; i++) {
        // Limit height and width so you don't get halls that
        // are too long
        const MAX_STAMP_SIZE = 16;
        let stampWidth = 1;
        let stampHeight = 1;
        if (i == 0) {
            // First one should be square
            stampWidth = randInt(5, 7, underworld.random);
            stampHeight = randInt(5, 7, underworld.random);
        } else if (i % 2 == 0) {
            // wide
            stampWidth = randInt(6, MAX_STAMP_SIZE, underworld.random);
            stampHeight = randInt(1, 3, underworld.random);
        } else {
            //tall
            stampWidth = randInt(1, 3, underworld.random);
            stampHeight = randInt(6, MAX_STAMP_SIZE, underworld.random);
        }
        let stamp: Material[] = Array(stampWidth * stampHeight).fill(Material.GROUND);
        let stampPosition: Vec.Vec2 = exists(lastStamp)
            // Ensure all stamps after the first stamp are touching each other so you get one cohesive map
            ? { x: randInt(lastStamp.position.x, lastStamp.position.x + lastStamp.width, underworld.random), y: randInt(lastStamp.position.y, lastStamp.position.y + lastStamp.height, underworld.random) }
            // First stamp can be put anywhere
            : { x: randInt(0, (width / 2) - 1 - stampWidth, underworld.random), y: randInt(0, (height / 2) - 1 - stampHeight, underworld.random) };
        lastStamp = {
            position: stampPosition,
            width: stampWidth,
            height: stampHeight
        }
        stampMatricies(materials, width, stamp, stampWidth, stampPosition);
    }
    return { width, materials }
}
// Returns a 1d array in the form {width:number, materials:Materials[]} which represents a 2d array
function makeLevelMaterialsArrayCaveStyle(params: CaveParams, underworld: Underworld) {
    // Debug: Draw caves
    globalThis.debugCave?.clear();
    const minDirection = randFloat(Math.PI, Math.PI / 2, underworld.random);
    const maxDirection = 0;
    let crawlers = [];
    const NUMBER_OF_CRAWLERS = 4;
    // Make crawlers start in 4 opposite corners so they don't start too
    // close to each other
    const signs = [
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: -1, y: -1 },
        { x: 1, y: -1 },
    ]
    for (let c = 0; c < NUMBER_OF_CRAWLERS - 1; c++) {
        const previousCrawler = crawlers[c - 1];
        const unsignedStartPosition = Vec.round(Vec.random(params.startPointJitter * 0.75, params.startPointJitter, underworld.random))
        const sign = signs[c % signs.length] || { x: 1, y: 1 };
        const cc: CaveCrawler = {
            direction: randFloat(minDirection, maxDirection, underworld.random),
            thickness: params.startThickness,
            position: {
                x: sign.x * unsignedStartPosition.x,
                y: sign.y * unsignedStartPosition.y,
            },
            path: [],
            left: [],
            right: [],
            rectangles: []
        }
        crawl(cc, previousCrawler ? previousCrawler.path[1] as Vec.Vec2 : Vec.round(Vec.random(-params.startPointJitter, params.startPointJitter, underworld.random)), params, underworld);
        crawlers.push(cc);
    }

    const previousCrawler = crawlers[crawlers.length - 1];
    const firstCrawler = crawlers[0];
    if (previousCrawler && firstCrawler) {

        // Connect first crawler and last crawler:
        const cc: CaveCrawler = {
            direction: randFloat(minDirection, maxDirection, underworld.random),
            thickness: params.startThickness,
            position: firstCrawler.path[firstCrawler.path.length - 1] as Vec.Vec2,
            path: [],
            left: [],
            right: [],
            rectangles: []
        }
        crawl(cc, previousCrawler.path[1] as Vec.Vec2, params, underworld);
        crawlers.push(cc);
    }
    // Get bounds
    const crawlerBounds = getLimits(crawlers.map(c => [...c.left, ...c.right]).flat());

    // Debug Draw bounds
    // globalThis.debugCave?.lineStyle(2, 0xff0000, 1.0);
    // globalThis.debugCave?.moveTo(crawlerBounds.xMin, crawlerBounds.yMin);
    // globalThis.debugCave?.lineTo(crawlerBounds.xMin, crawlerBounds.yMax);
    // globalThis.debugCave?.lineTo(crawlerBounds.xMax, crawlerBounds.yMax);
    // globalThis.debugCave?.lineTo(crawlerBounds.xMax, crawlerBounds.yMin);
    // globalThis.debugCave?.lineTo(crawlerBounds.xMin, crawlerBounds.yMin);

    // + 2 leaves room on the right side and bottom side for surrounding walls
    let width = Math.ceil((crawlerBounds.xMax - crawlerBounds.xMin) / config.OBSTACLE_SIZE) + 2;
    let height = Math.ceil((crawlerBounds.yMax - crawlerBounds.yMin) / config.OBSTACLE_SIZE) + 2;
    let materials: Material[] = Array(width * height).fill(Material.EMPTY);
    // Normalize crawlers to 0,0 in upper left corner
    function normalizeTo00(points: Vec.Vec2[]): Vec.Vec2[] {
        return points.map(p => ({ x: p.x - crawlerBounds.xMin, y: p.y - crawlerBounds.yMin }))
    }
    crawlers = crawlers.map(c =>
    ({
        ...c,
        path: normalizeTo00(c.path),
        rectangles: c.rectangles.map(normalizeTo00)
    }));

    crawlersChangeTilesToMaterial(crawlers, Material.GROUND, width, height, materials);


    // Debug draw caves
    // const styles = [0xff0000, 0x0000ff, 0xff00ff, 0x00ffff, 0xffff00];
    // function drawPathWithStyle(path: Vec.Vec2[], style: number, opacity: number) {
    //     globalThis.debugCave?.lineStyle(4, style, opacity);
    //     if (path[0]) {
    //         globalThis.debugCave?.moveTo(path[0].x, path[0].y);
    //         // @ts-expect-error
    //         globalThis.debugCave?.drawCircle(path[1].x, path[1].y, 25);
    //         for (let point of path) {
    //             globalThis.debugCave?.lineTo(point.x, point.y);
    //         }
    //     }

    // }
    // // Debug Fill
    // for (let i = 0; i < crawlers.length; i++) {
    //     const crawler = crawlers[i];
    //     if (crawler) {
    //         drawPathWithStyle(crawler.path, 0x000000, 0.1);
    //         globalThis.debugCave?.beginFill(styles[i % styles.length], 0.1);
    //         for (let rect of crawler.rectangles) {
    //             // @ts-expect-error
    //             globalThis.debugCave?.drawPolygon(rect);
    //         }
    //         globalThis.debugCave?.endFill();
    //     }
    // }

    // // Debug Lines
    // for (let i = 0; i < crawlers.length; i++) {
    //     const crawler = crawlers[i];
    //     if (crawler) {
    //         drawPathWithStyle(crawler.path, styles[i % styles.length] as number, 0.1);
    //         globalThis.debugCave?.lineStyle(1, 0x000000, 0.0);
    //     }
    // }
    return { materials, width }

}
const west: Vec.Vec2 = { x: -1, y: 0 };
const northwest: Vec.Vec2 = { x: -1, y: -1 };
const southwest: Vec.Vec2 = { x: -1, y: 1 };
const east: Vec.Vec2 = { x: 1, y: 0 };
const northeast: Vec.Vec2 = { x: 1, y: -1 };
const southeast: Vec.Vec2 = { x: 1, y: 1 };
const north: Vec.Vec2 = { x: 0, y: -1 };
const south: Vec.Vec2 = { x: 0, y: 1 };
const SIDES = {
    north,
    south,
    east,
    west
}
type SIDES_WITH_DIAG_KEYS = (keyof typeof SIDES_WITH_DIAG)
const SIDES_WITH_DIAG = {
    north,
    northeast,
    east,
    southeast,
    south,
    southwest,
    west,
    northwest
}
function cellCoordToIndexPosition(cell: Tile) {
    return { x: cell.x / config.OBSTACLE_SIZE, y: cell.y / config.OBSTACLE_SIZE }
}
export function convertBaseTilesToFinalTiles(map: Map) {
    const { width, height } = map;
    function changeTile(index: number, image: string) {
        const tile = map.tiles[index];
        if (tile) {
            tile.image = image;
        } else {
            console.error('tile not found at ', index, width)
        }
    }
    const size = width * height;
    // Outline all base tiles with finalized tiles:
    const originalMap = { ...map, tiles: JSON.parse(JSON.stringify(map.tiles)) };
    const finalTileImages = makeFinalTileImages(map.biome);
    for (let i = 0; i < size; i++) {
        const position = oneDimentionIndexToVec2(i, width);
        const currentCell = getCell(map, position);
        const neighbors = (Object.keys(SIDES_WITH_DIAG) as SIDES_WITH_DIAG_KEYS[]).reduce<Record<SIDES_WITH_DIAG_KEYS, string>>((neighbors, side) => {
            const sidePosition = SIDES_WITH_DIAG[side];
            if (sidePosition) {
                const cell = getCell(originalMap, Vec.add(position, sidePosition));
                // Checking for cell.image intentionally excludes the "empty" cell
                if (cell && cell.image) {
                    neighbors[side] = cell.image;

                }
            }
            return neighbors;
        }, {
            north: baseTiles.empty,
            northeast: baseTiles.empty,
            east: baseTiles.empty,
            southeast: baseTiles.empty,
            south: baseTiles.empty,
            southwest: baseTiles.empty,
            west: baseTiles.empty,
            northwest: baseTiles.empty,
        });
        // Change ground tiles
        if (currentCell?.image == baseTiles.ground) {
            const tile = map.tiles[i];
            if (tile) {
                if (neighbors.west == baseTiles.liquid && (neighbors.south == baseTiles.liquid || neighbors.southeast == baseTiles.liquid)) {
                    changeTile(i, finalTileImages.liquidInsideCornerNE);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.east == baseTiles.liquid && (neighbors.south == baseTiles.liquid || neighbors.southwest == baseTiles.liquid)) {
                    changeTile(i, finalTileImages.liquidInsideCornerNW);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.east == baseTiles.liquid && (neighbors.north == baseTiles.liquid || neighbors.northwest == baseTiles.liquid)) {
                    changeTile(i, finalTileImages.liquidInsideCornerSW);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.west == baseTiles.liquid && (neighbors.north == baseTiles.liquid || neighbors.northeast == baseTiles.liquid)) {
                    changeTile(i, finalTileImages.liquidInsideCornerSE);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.north == baseTiles.liquid) {
                    changeTile(i, finalTileImages.liquidNGroundS);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.east == baseTiles.liquid) {
                    changeTile(i, finalTileImages.liquidEGroundW);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.west == baseTiles.liquid) {
                    changeTile(i, finalTileImages.liquidWGroundE);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.south == baseTiles.liquid) {
                    changeTile(i, finalTileImages.liquidSGroundN);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.northeast == baseTiles.liquid) {
                    changeTile(i, finalTileImages.liquidCornerNE);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.northwest == baseTiles.liquid) {
                    changeTile(i, finalTileImages.liquidCornerNW);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.southeast == baseTiles.liquid) {
                    changeTile(i, finalTileImages.liquidCornerSE);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.southwest == baseTiles.liquid) {
                    changeTile(i, finalTileImages.liquidCornerSW);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                }
            } else {
                console.error('Unexpected map generation error, tile is undefined.')
            }
        }
        // change wall tiles
        if (currentCell?.image == baseTiles.wall) {
            if (neighbors.south == baseTiles.ground) {
                changeTile(i, finalTileImages.wallN);
            } else {
                changeTile(i, finalTileImages.wall);
            }
        }
    }

    // Change all remaining base tiles to final tiles
    for (let i = 0; i < size; i++) {
        const position = oneDimentionIndexToVec2(i, width);
        const cell = getCell(map, position);
        if (cell?.image == baseTiles.liquid) {
            changeTile(i, finalTileImages.all_liquid);
            // Add tile to liquid array if it isn't already
            if (!map.liquid.find(tile => tile.x == cell.x && tile.y == cell.y)) {
                map.liquid.push({ image: finalTileImages.all_liquid, x: cell.x, y: cell.y })
            }
        } else if (cell?.image == baseTiles.ground) {
            changeTile(i, finalTileImages.all_ground);
        }
    }
}

// Uses crawler objects to create a Material array
// Mutates caveMaterialsArray as the result
function crawlersChangeTilesToMaterial(crawlers: CaveCrawler[], material: Material, caveWidth: number, caveHeight: number, caveMaterialsArray: Material[]) {
    for (let x = 0; x < caveWidth; x++) {
        for (let y = 0; y < caveHeight; y++) {
            let isInside = false;
            for (let crawler of crawlers) {
                for (let rect of crawler.rectangles) {
                    if (isVec2InsidePolygon({ x: x * config.OBSTACLE_SIZE, y: y * config.OBSTACLE_SIZE }, rect)) {
                        isInside = true;
                        break;
                    }
                }
                if (isInside) {
                    break;
                }
            }
            if (isInside) {
                const index = vec2ToOneDimentionIndex({ x, y }, caveWidth)
                caveMaterialsArray[index] = material;
            }
            // Debug Draw dot grid
            // globalThis.debugCave?.lineStyle(2, isInside ? 0x00ff00 : 0xff0000, 1.0);
            // if (isInside) {
            //     globalThis.debugCave?.beginFill(0x00ff00, 0.5);
            //     globalThis.debugCave?.drawRect(x, y, dotSize, dotSize);
            //     globalThis.debugCave?.endFill();
            // } else {
            //     globalThis.debugCave?.drawCircle(x, y, 4);
            // }
        }
    }
}
interface CaveCrawler {
    // In radians
    direction: number,
    thickness: number,
    position: Vec.Vec2,
    path: Vec.Vec2[],
    left: Vec.Vec2[],
    right: Vec.Vec2[],
    // Final form used to check if a cell is inside the cave
    rectangles: Vec.Vec2[][],
}
function movePointInDirection(cc: CaveCrawler, turnRadians: number, velocity: number) {
    cc.direction += turnRadians;
    cc.path.push(cc.position);
    cc.position = Vec.round(Vec.getEndpointOfMagnitudeAlongVector(cc.position, cc.direction, velocity));
}
function crawl(cc: CaveCrawler, endPosition: Vec.Vec2, params: CaveParams, underworld: Underworld) {
    // Start the path with a circle so that the biggest part of the cave is 
    // like an octogon or someing, not just a flat line
    const eachTurnRadians = Math.PI / 4
    for (let i = 0; i < Math.round(Math.PI * 2 / eachTurnRadians) + 1; i++) {
        movePointInDirection(cc, eachTurnRadians, 1);
    }

    // Generate path
    for (let i = 0; i < params.iterations; i++) {
        const turnRadians = randFloat(-directionRandomAmount, directionRandomAmount, underworld.random);
        movePointInDirection(cc, turnRadians, params.velocity);
    }
    if (endPosition) {
        // At the end make it return to origin
        while (distance(cc.position, endPosition) > params.velocity + params.velocity * .25) {
            cc.position = Vec.round(Vec.add(cc.position, similarTriangles(endPosition.x - cc.position.x, endPosition.y - cc.position.y, distance(cc.position, endPosition), params.velocity)));
            cc.position = Vec.round(Vec.jitter(cc.position, params.velocity / 2, underworld.random));
            cc.path.push(cc.position);
        }
        cc.path.push(endPosition);
        // And add a second one so that the left and right path's have a next point after getting all the way back
        cc.path.push(endPosition);

        // Generate left and right for thickness
        for (let i = 0; i < cc.path.length; i++) {
            const prevPoint = cc.path[i - 1];
            const p = cc.path[i];
            const nextPoint = cc.path[i + 1];
            if (!prevPoint || !p || !nextPoint) {
                continue;
            }
            const lastLeft = cc.left[cc.left.length - 1]
            const lastRight = cc.right[cc.right.length - 1]
            const direction = Vec.getAngleBetweenVec2s(prevPoint, nextPoint)
            const left = { x: p.x + Math.cos(direction + Math.PI / 2), y: p.y + Math.sin(direction + Math.PI / 2) };
            const right = { x: p.x + Math.cos(direction - Math.PI / 2), y: p.y + Math.sin(direction - Math.PI / 2) };
            const tangentDist = distance(p, left);
            // cc.thickness += randInt(underworld.random, -40, 5);
            cc.thickness = lerp(params.startThickness, params.minThickness, i / cc.path.length);
            // Don't let thickness be lessthan minThickness 
            cc.thickness = Math.max(params.minThickness, cc.thickness);
            let newLeft = Vec.add(p, similarTriangles(left.x - p.x, left.y - p.y, tangentDist, cc.thickness));
            // Jitter the left and right sides so they are not perfectly parallel
            newLeft = Vec.round(Vec.jitter(newLeft, cc.thickness / 4, underworld.random));
            cc.left.push(newLeft);
            let newRight = Vec.add(p, similarTriangles(right.x - p.x, right.y - p.y, tangentDist, cc.thickness));
            // Jitter the left and right sides so they are not perfectly parallel
            newRight = Vec.round(Vec.jitter(newRight, cc.thickness / 4, underworld.random));
            cc.right.push(newRight);
            if (lastLeft && lastRight) {
                let points = [lastLeft, newLeft, newRight, lastRight];
                // Ensure rectangle isn't twisted like a bowtie which will result in weird isVec2Inside results:

                if (lineSegmentIntersection({ p1: lastLeft, p2: newLeft }, { p1: newRight, p2: lastRight })) {
                    // if 1 to 2 crosses 3 to 4, flip 2 and 3
                    points = [lastLeft, newRight, newLeft, lastRight];
                } else if (lineSegmentIntersection({ p1: newLeft, p2: newRight }, { p1: lastLeft, p2: lastRight })) {
                    // If 2 and 3 crosses 1 and 4, flip 3 and 4
                    points = [lastLeft, newLeft, lastRight, newRight];
                }
                // Protect against chevron shaped rectangles:
                for (let p of points) {
                    const withoutP = points.filter(x => x !== p);
                    if (isVec2InsidePolygon(p, withoutP)) {
                        points = withoutP;
                        break;
                    }
                }

                cc.rectangles.push(points)
            }
        }
    }

}

export function getLimits(points: Vec.Vec2[]): Limits {
    let limits: Limits = {
        xMin: Number.MAX_SAFE_INTEGER,
        xMax: Number.MIN_SAFE_INTEGER,
        yMin: Number.MAX_SAFE_INTEGER,
        yMax: Number.MIN_SAFE_INTEGER
    }
    for (let p of points) {
        if (Number.isNaN(limits.xMin) || p.x < limits.xMin) {
            limits.xMin = Math.floor(p.x);
        }
        if (Number.isNaN(limits.yMin) || p.y < limits.yMin) {
            limits.yMin = Math.floor(p.y);
        }
        if (Number.isNaN(limits.xMax) || p.x > limits.xMax) {
            limits.xMax = Math.ceil(p.x);
        }
        if (Number.isNaN(limits.yMax) || p.y > limits.yMax) {
            limits.yMax = Math.ceil(p.y);
        }
    }
    limits.xMin -= config.OBSTACLE_SIZE / 2;
    limits.yMin -= config.OBSTACLE_SIZE / 2;
    limits.xMax += config.OBSTACLE_SIZE / 2;
    limits.yMax += config.OBSTACLE_SIZE / 2;
    return limits;

}
export type Tile = { image: string } & Vec.Vec2;
export interface Map {
    biome: Biome;
    liquid: Tile[];
    tiles: Tile[];
    width: number;
    height: number;
}
function getCell(map: Map, position: Vec.Vec2): Tile | undefined {
    return map.tiles[vec2ToOneDimentionIndexPreventWrap(position, map.width)];
}
export const baseTiles = {
    empty: '',
    wall: 'wall.png',
    semiWall: 'wall.png',
    liquid: 'all_liquid.png',
    ground: 'ground.png',
}
export const makeFinalTileImages = (biome: string) => ({
    all_liquid: `${biome}/all_liquid.png`,
    all_ground: `${biome}/all_ground.png`,
    liquidInsideCornerNE: `${biome}/liquidInsideCornerNE.png`,
    liquidInsideCornerNW: `${biome}/liquidInsideCornerNW.png`,
    liquidInsideCornerSE: `${biome}/liquidInsideCornerSE.png`,
    liquidInsideCornerSW: `${biome}/liquidInsideCornerSW.png`,
    liquidNGroundS: `${biome}/liquidNGroundS.png`,
    liquidCornerNE: `${biome}/liquidCornerNE.png`,
    liquidCornerNW: `${biome}/liquidCornerNW.png`,
    liquidEGroundW: `${biome}/liquidEGroundW.png`,
    liquidWGroundE: `${biome}/liquidWGroundE.png`,
    liquidSGroundN: `${biome}/liquidSGroundN.png`,
    liquidCornerSE: `${biome}/liquidCornerSE.png`,
    liquidCornerSW: `${biome}/liquidCornerSW.png`,
    wall: `${biome}/wall.png`,
    wallN: `${biome}/wallN.png`,
});

export function toObstacle(t: Tile, biome: Biome): IObstacle | undefined {
    //   const width = config.OBSTACLE_SIZE;
    //   const height = config.OBSTACLE_SIZE;
    //   const _x = t.x - width / 2;
    //   const _y = t.y - height / 2;
    const bounds = {
        'blood': {
            right: 29,
            left: 34,
            bottom: 39,
            top: 10,
        },
        'lava': {
            right: 16,
            left: 47,
            bottom: 45,
            top: 10,
        },
        'water': {
            right: 19,
            left: 44,
            bottom: 42,
            top: 10,
        },
        'ghost': {
            right: 19,
            left: 44,
            bottom: 40,
            top: 0,
        },
    }
    const finalTileImages = makeFinalTileImages(biome);
    if (t.image == finalTileImages.wall) {
        return {
            x: t.x,
            y: t.y,
            material: Material.WALL,
            bounds: [
                { x: 0, y: 0 },
                { x: 64, y: 0 },
                { x: 64, y: 64 },
                { x: 0, y: 64 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.wallN) {
        return {
            x: t.x,
            y: t.y,
            material: Material.WALL,
            bounds: [
                { x: 0, y: 0 },
                { x: 64, y: 0 },
                { x: 64, y: 64 - config.WALL_BOUNDS_OFFSET },
                { x: 0, y: 64 - config.WALL_BOUNDS_OFFSET },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidNGroundS) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 0, y: 0 },
                { x: 64, y: 0 },
                { x: 64, y: bounds[biome].bottom },
                { x: 0, y: bounds[biome].bottom },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidCornerNE) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: bounds[biome].right, y: 0 },
                { x: 64, y: 0 },
                { x: 64, y: bounds[biome].bottom },
                { x: bounds[biome].right, y: bounds[biome].bottom },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidInsideCornerSW) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 0, y: 0 },
                { x: 64, y: 0 },
                { x: 64, y: 64 },
                { x: bounds[biome].right, y: 64 },
                { x: bounds[biome].right, y: bounds[biome].bottom },
                { x: 0, y: bounds[biome].bottom },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidEGroundW) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: bounds[biome].right, y: 0 },
                { x: 64, y: 0 },
                { x: 64, y: 64 },
                { x: bounds[biome].right, y: 64 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidCornerSE) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: bounds[biome].right, y: bounds[biome].top },
                { x: 64, y: bounds[biome].top },
                { x: 64, y: 64 },
                { x: bounds[biome].right, y: 64 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidInsideCornerNW) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: bounds[biome].right, y: 0 },
                { x: 64, y: 0 },
                { x: 64, y: 64 },
                { x: 0, y: 64 },
                { x: 0, y: bounds[biome].top },
                { x: bounds[biome].right, y: bounds[biome].top },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidSGroundN) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 0, y: bounds[biome].top },
                { x: 64, y: bounds[biome].top },
                { x: 64, y: 64 },
                { x: 0, y: 64 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidCornerSW) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 0, y: bounds[biome].top },
                { x: bounds[biome].left, y: bounds[biome].top },
                { x: bounds[biome].left, y: 64 },
                { x: 0, y: 64 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidWGroundE) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 0, y: 0 },
                { x: bounds[biome].left, y: 0 },
                { x: bounds[biome].left, y: 64 },
                { x: 0, y: 64 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidInsideCornerNE) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 0, y: 0 },
                { x: bounds[biome].left, y: 0 },
                { x: bounds[biome].left, y: bounds[biome].top },
                { x: 64, y: bounds[biome].top },
                { x: 64, y: 64 },
                { x: 0, y: 64 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidCornerNW) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 0, y: 0 },
                { x: bounds[biome].left, y: 0 },
                { x: bounds[biome].left, y: bounds[biome].bottom },
                { x: 0, y: bounds[biome].bottom },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidInsideCornerSE) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 0, y: 0 },
                { x: 64, y: 0 },
                { x: 64, y: bounds[biome].bottom },
                { x: bounds[biome].left, y: bounds[biome].bottom },
                { x: bounds[biome].left, y: 64 },
                { x: 0, y: 64 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.all_liquid) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 0, y: 0 },
                { x: 64, y: 0 },
                { x: 64, y: 64 },
                { x: 0, y: 64 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else {
        return undefined;
    }

}