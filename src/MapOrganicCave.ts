import { lineSegmentIntersection } from "./jmath/lineSegment";
import { distance, lerp, similarTriangles } from "./jmath/math";
import { isVec2InsidePolygon } from "./jmath/Polygon2";
import { randFloat, randInt } from "./jmath/rand";
import * as Vec from "./jmath/Vec";
import * as config from './config';
import { oneDimentionIndexToVec2, vec2ToOneDimentionIndex, vec2ToOneDimentionIndexPreventWrap } from "./jmath/ArrayUtil";
import { conway, ConwayState, placeLiquidSources } from "./Conway";
import type { IObstacle } from "./entity/Obstacle";
import Underworld, { Biome } from "./Underworld";

export const caveSizes: { [size: string]: CaveParams } = {
    'small': {
        minThickness: config.OBSTACLE_SIZE,
        startThickness: 150,
        startPointJitter: 400,
        iterations: 12,
        velocity: 60
    },
    'medium': {
        minThickness: config.OBSTACLE_SIZE,
        startThickness: 150,
        startPointJitter: 500,
        iterations: 15,
        velocity: 80
    }
}
interface CaveParams {
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
export function generateCave(params: CaveParams, biome: Biome, underworld: Underworld): { map: Map, limits: Limits } {
    // Debug: Draw caves
    globalThis.debugCave?.clear();
    const minDirection = randFloat(underworld.random, Math.PI, Math.PI / 2);
    const maxDirection = 0;
    let crawlers = [];
    const NUMBER_OF_CRAWLERS = randInt(underworld.random, 2, 4);
    for (let c = 0; c < NUMBER_OF_CRAWLERS - 1; c++) {
        const previousCrawler = crawlers[c - 1];
        const cc: CaveCrawler = {
            direction: randFloat(underworld.random, minDirection, maxDirection),
            thickness: params.startThickness,
            position: Vec.round(Vec.random(-params.startPointJitter, params.startPointJitter, underworld.random)),
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
            direction: randFloat(underworld.random, minDirection, maxDirection),
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
    // globalThis.debugCave.lineStyle(2, 0xff0000, 1.0);
    // globalThis.debugCave.moveTo(crawlerBounds.xMin, crawlerBounds.yMin);
    // globalThis.debugCave.lineTo(crawlerBounds.xMin, crawlerBounds.yMax);
    // globalThis.debugCave.lineTo(crawlerBounds.xMax, crawlerBounds.yMax);
    // globalThis.debugCave.lineTo(crawlerBounds.xMax, crawlerBounds.yMin);
    // globalThis.debugCave.lineTo(crawlerBounds.xMin, crawlerBounds.yMin);

    // + 2 leaves room on the right side and bottom side for surrounding walls
    const width = Math.ceil((crawlerBounds.xMax - crawlerBounds.xMin) / config.OBSTACLE_SIZE) + 2;
    const height = Math.ceil((crawlerBounds.yMax - crawlerBounds.yMin) / config.OBSTACLE_SIZE) + 2;
    const materials: Material[] = Array(width * height).fill(Material.EMPTY);
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
    //     globalThis.debugCave.lineStyle(4, style, opacity);
    //     if (path[0]) {
    //         globalThis.debugCave.moveTo(path[0].x, path[0].y);
    //         // @ts-expect-error
    //         globalThis.debugCave.drawCircle(path[1].x, path[1].y, 25);
    //         for (let point of path) {
    //             globalThis.debugCave.lineTo(point.x, point.y);
    //         }
    //     }

    // }
    // // Debug Fill
    // for (let i = 0; i < crawlers.length; i++) {
    //     const crawler = crawlers[i];
    //     if (crawler) {
    //         drawPathWithStyle(crawler.path, 0x000000, 0.1);
    //         globalThis.debugCave.beginFill(styles[i % styles.length], 0.1);
    //         for (let rect of crawler.rectangles) {
    //             // @ts-expect-error
    //             globalThis.debugCave.drawPolygon(rect);
    //         }
    //         globalThis.debugCave.endFill();
    //     }
    // }

    // // Debug Lines
    // for (let i = 0; i < crawlers.length; i++) {
    //     const crawler = crawlers[i];
    //     if (crawler) {
    //         drawPathWithStyle(crawler.path, styles[i % styles.length] as number, 0.1);
    //         globalThis.debugCave.lineStyle(1, 0x000000, 0.0);
    //     }
    // }
    let conwayState: ConwayState = {
        // 50%
        percentChanceOfLiquidSpread: 10,
        // how quickly the percentChanceOfLiquidSpread
        // will decrease
        liquidSpreadChanceFalloff: 2
    }
    // 1st pass for walls
    conway(materials, width, conwayState, underworld);
    // 2nd pass for semi-walls
    conway(materials, width, conwayState, underworld);
    // 3rd pass to grow liquid pools.  Number of pools is relative to map width
    placeLiquidSources(materials, width, Math.floor(width / 5), underworld);
    conway(materials, width, conwayState, underworld);


    // Convert array of materials into tiles for use by WFC
    let tiles: Tile[] = materials.map((m, i) => {
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
    const bounds = getLimits(tiles);
    const liquid = tiles.filter(t => t.image == baseTiles.liquid);


    const map = {
        biome,
        liquid,
        tiles,
        width,
        height
    };
    globalThis.map = JSON.parse(JSON.stringify(map));
    convertBaseTilesToFinalTiles(map);
    return { map, limits: bounds };

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
    function changeTileToLiquidIf3NeighborsAreLiquid(position: Vec.Vec2) {
        const neighbors = Object.values(SIDES).flatMap(side => {
            const cell = getCell(map, Vec.add(position, side));
            // Checking for cell.image intentionally excludes the "empty" cell
            return cell && cell.image ? [{ cell, side }] : [];
        });
        if (neighbors.filter(n => n.cell.image == baseTiles.liquid).length >= 3) {
            changeTile(vec2ToOneDimentionIndex(position, width), baseTiles.liquid);
            // Check all neighbors now that one of them might now be surrounded by 3
            neighbors.filter(n => n.cell.image == baseTiles.ground).forEach(n => changeTileToLiquidIf3NeighborsAreLiquid(cellCoordToIndexPosition(n.cell)));
        }

    }
    // All tiles with >= 3 base liquid tile neighbors turn to base liquid
    for (let i = 0; i < size; i++) {
        const position = oneDimentionIndexToVec2(i, width);
        changeTileToLiquidIf3NeighborsAreLiquid(position);
    }
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
                if (neighbors.west == baseTiles.liquid && neighbors.south == baseTiles.liquid) {
                    changeTile(i, finalTileImages.liquidInsideCornerNE);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.east == baseTiles.liquid && neighbors.south == baseTiles.liquid) {
                    changeTile(i, finalTileImages.liquidInsideCornerNW);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.east == baseTiles.liquid && neighbors.north == baseTiles.liquid) {
                    changeTile(i, finalTileImages.liquidInsideCornerSW);
                    map.liquid.push({ image: finalTileImages.all_liquid, x: tile.x, y: tile.y })
                } else if (neighbors.west == baseTiles.liquid && neighbors.north == baseTiles.liquid) {
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
            map.liquid.push({ image: finalTileImages.all_liquid, x: cell.x, y: cell.y })
        } else if (cell?.image == baseTiles.ground) {
            changeTile(i, finalTileImages.all_ground);
        }
    }
}

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
            // globalThis.debugCave.lineStyle(2, isInside ? 0x00ff00 : 0xff0000, 1.0);
            // if (isInside) {
            //     globalThis.debugCave.beginFill(0x00ff00, 0.5);
            //     globalThis.debugCave.drawRect(x, y, dotSize, dotSize);
            //     globalThis.debugCave.endFill();
            // } else {
            //     globalThis.debugCave.drawCircle(x, y, 4);
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
        const turnRadians = randFloat(underworld.random, -directionRandomAmount, directionRandomAmount);
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
enum Material {
    EMPTY,
    LIQUID,
    GROUND,
    WALL,
}
export const baseTiles = {
    empty: '',
    wall: 'tiles/wall.png',
    semiWall: 'tiles/wall.png',
    liquid: 'tiles/all_liquid.png',
    ground: 'tiles/ground.png',
}
export const makeFinalTileImages = (biome: string) => ({
    all_liquid: `tiles/${biome}/all_liquid.png`,
    all_ground: `tiles/${biome}/all_ground.png`,
    liquidInsideCornerNE: `tiles/${biome}/liquidInsideCornerNE.png`,
    liquidInsideCornerNW: `tiles/${biome}/liquidInsideCornerNW.png`,
    liquidInsideCornerSE: `tiles/${biome}/liquidInsideCornerSE.png`,
    liquidInsideCornerSW: `tiles/${biome}/liquidInsideCornerSW.png`,
    liquidNGroundS: `tiles/${biome}/liquidNGroundS.png`,
    liquidCornerNE: `tiles/${biome}/liquidCornerNE.png`,
    liquidCornerNW: `tiles/${biome}/liquidCornerNW.png`,
    liquidEGroundW: `tiles/${biome}/liquidEGroundW.png`,
    liquidWGroundE: `tiles/${biome}/liquidWGroundE.png`,
    liquidSGroundN: `tiles/${biome}/liquidSGroundN.png`,
    liquidCornerSE: `tiles/${biome}/liquidCornerSE.png`,
    liquidCornerSW: `tiles/${biome}/liquidCornerSW.png`,
    wall: `tiles/${biome}/wall.png`,
    wallN: `tiles/${biome}/wallN.png`,
});

export function toObstacle(t: Tile, biome: string): IObstacle | undefined {
    //   const width = config.OBSTACLE_SIZE;
    //   const height = config.OBSTACLE_SIZE;
    //   const _x = t.x - width / 2;
    //   const _y = t.y - height / 2;
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
                { x: 64, y: 50 },
                { x: 0, y: 50 },
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
                { x: 64, y: 39 },
                { x: 0, y: 39 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidCornerNE) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 29, y: 0 },
                { x: 64, y: 0 },
                { x: 64, y: 39 },
                { x: 29, y: 39 },
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
                { x: 29, y: 64 },
                { x: 29, y: 39 },
                { x: 0, y: 39 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidEGroundW) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 29, y: 0 },
                { x: 64, y: 0 },
                { x: 64, y: 64 },
                { x: 29, y: 64 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidCornerSE) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 29, y: 10 },
                { x: 64, y: 10 },
                { x: 64, y: 64 },
                { x: 29, y: 64 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidInsideCornerNW) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 29, y: 0 },
                { x: 64, y: 0 },
                { x: 64, y: 64 },
                { x: 0, y: 64 },
                { x: 0, y: 10 },
                { x: 29, y: 10 },
            ].reverse().map(({ x, y }) => ({ x: x + t.x - config.OBSTACLE_SIZE / 2, y: y + t.y - config.OBSTACLE_SIZE / 2 })),

        }
    } else if (t.image == finalTileImages.liquidSGroundN) {
        return {
            x: t.x,
            y: t.y,
            material: Material.LIQUID,
            bounds: [
                { x: 0, y: 10 },
                { x: 64, y: 10 },
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
                { x: 0, y: 10 },
                { x: 34, y: 10 },
                { x: 34, y: 64 },
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
                { x: 34, y: 0 },
                { x: 34, y: 64 },
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
                { x: 34, y: 0 },
                { x: 34, y: 10 },
                { x: 64, y: 10 },
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
                { x: 34, y: 0 },
                { x: 34, y: 39 },
                { x: 0, y: 39 },
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
                { x: 64, y: 39 },
                { x: 34, y: 39 },
                { x: 34, y: 64 },
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