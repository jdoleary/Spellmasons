import { distance, lerp, similarTriangles } from "./math";
import { randFloat } from "./rand";
import * as Vec from "./Vec";

const minThickness = 50;
const startThickness = 300;
const startpointjitter = 700;
const iterations = 10;
const velocity = 300;
const directionRandomAmount = Math.PI / 2;
export function generateCave(): ProcessedCrawler[] {
    const minDirection = randFloat(window.underworld.random, Math.PI, Math.PI / 2);
    const maxDirection = 0;
    const crawlers = [];
    const processedCrawlers: ProcessedCrawler[] = []
    const NUMBER_OF_CRAWLERS = 2;//randInt(window.underworld.random, 2, 4);
    for (let c = 0; c < NUMBER_OF_CRAWLERS - 1; c++) {
        const previousCrawler = crawlers[c - 1];
        const cc: CaveCrawler = {
            direction: randFloat(window.underworld.random, minDirection, maxDirection),
            thickness: startThickness,
            position: Vec.random(-startpointjitter, startpointjitter),
            path: [],
            left: [],
            right: [],
        }
        processedCrawlers.push(crawl(cc, previousCrawler ? previousCrawler.path[1] as Vec.Vec2 : Vec.random(-startpointjitter, startpointjitter)));
        crawlers.push(cc);
    }

    const previousCrawler = crawlers[crawlers.length - 1];
    const firstCrawler = crawlers[0];
    if (previousCrawler && firstCrawler) {

        // Connect first crawler and last crawler:
        const cc: CaveCrawler = {
            direction: randFloat(window.underworld.random, minDirection, maxDirection),
            thickness: startThickness,
            position: firstCrawler.path[firstCrawler.path.length - 1] as Vec.Vec2,
            path: [],
            left: [],
            right: [],
        }
        processedCrawlers.push(crawl(cc, previousCrawler.path[1] as Vec.Vec2));
        crawlers.push(cc);
    }
    return processedCrawlers

}

interface CaveCrawler {
    // In radians
    direction: number,
    thickness: number,
    position: Vec.Vec2,
    path: Vec.Vec2[],
    left: Vec.Vec2[],
    right: Vec.Vec2[]
}
interface ProcessedCrawler {
    poly: Vec.Vec2[];
}
function movePointInDirection(cc: CaveCrawler, turnRadians: number, velocity: number) {
    cc.direction += turnRadians;
    const nextPointDirection = { x: cc.position.x + Math.cos(cc.direction), y: cc.position.y + Math.sin(cc.direction) };
    const dist = distance(cc.position, nextPointDirection);
    cc.path.push(cc.position);
    cc.position = Vec.add(cc.position, similarTriangles(nextPointDirection.x - cc.position.x, nextPointDirection.y - cc.position.y, dist, velocity));

}
function crawl(cc: CaveCrawler, endPosition: Vec.Vec2): ProcessedCrawler {
    // Start the path with a circle so that the biggest part of the cave is 
    // like an octogon or someing, not just a flat line
    const eachTurnRadians = Math.PI / 4
    for (let i = 0; i < Math.round(Math.PI * 2 / eachTurnRadians) + 1; i++) {
        movePointInDirection(cc, eachTurnRadians, 1);
    }

    // Generate path
    for (let i = 0; i < iterations; i++) {
        const turnRadians = randFloat(window.underworld.random, -directionRandomAmount, directionRandomAmount);
        movePointInDirection(cc, turnRadians, velocity);
    }
    if (endPosition) {
        // At the end make it return to origin
        while (distance(cc.position, endPosition) > velocity + velocity * .25) {
            cc.position = Vec.add(cc.position, similarTriangles(endPosition.x - cc.position.x, endPosition.y - cc.position.y, distance(cc.position, endPosition), velocity));
            cc.position = Vec.jitter(cc.position, velocity / 2);
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
            const direction = Vec.getAngleBetweenVec2s(prevPoint, nextPoint)
            const left = { x: p.x + Math.cos(direction + Math.PI / 2), y: p.y + Math.sin(direction + Math.PI / 2) };
            const right = { x: p.x + Math.cos(direction - Math.PI / 2), y: p.y + Math.sin(direction - Math.PI / 2) };
            const tangentDist = distance(p, left);
            // cc.thickness += randInt(window.underworld.random, -40, 5);
            cc.thickness = lerp(startThickness, minThickness, i / cc.path.length);
            // Don't let thickness be lessthan minThickness 
            cc.thickness = Math.max(minThickness, cc.thickness);
            let newLeft = Vec.add(p, similarTriangles(left.x - p.x, left.y - p.y, tangentDist, cc.thickness));
            // Jitter the left and right sides so they are not perfectly parallel
            newLeft = Vec.jitter(newLeft, cc.thickness / 4);
            cc.left.push(newLeft);
            let newRight = Vec.add(p, similarTriangles(right.x - p.x, right.y - p.y, tangentDist, cc.thickness));
            // Jitter the left and right sides so they are not perfectly parallel
            newRight = Vec.jitter(newRight, cc.thickness / 4);
            cc.right.push(newRight);
        }
    }
    const poly = [...cc.left, ...cc.right.reverse(), cc.left[0] as Vec.Vec2].map(point => Vec.round(point))
    return {
        poly
    }

}