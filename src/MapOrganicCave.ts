import { distance, lerp, similarTriangles } from "./math";
import { randFloat, randInt } from "./rand";
import * as Vec from "./Vec";

const minThickness = 40;
const startThickness = 200;
const NUMBER_OF_CRAWLERS = 3;
const startpointjitter = 1000;
const iterations = 50;
const velocity = 200;
const directionRandomAmount = Math.PI / 2;
export function generateCave(): CaveCrawler[] {
    const minDirection = randFloat(window.underworld.random, Math.PI, Math.PI / 2);
    const maxDirection = 0;
    let endPosition = Vec.random(-startpointjitter, startpointjitter);
    const crawlers = [];
    for (let c = 0; c < NUMBER_OF_CRAWLERS; c++) {
        const previousCrawler = crawlers[c - 1];
        const cc: CaveCrawler = {
            direction: randFloat(window.underworld.random, minDirection, maxDirection),
            thickness: startThickness,
            position: previousCrawler ? previousCrawler.path[previousCrawler.path.length - 1] as Vec.Vec2 : Vec.random(-startpointjitter, startpointjitter),
            path: [],
            left: [],
            right: [],
        }
        // Return to the start of the first crawler
        if (c == NUMBER_OF_CRAWLERS - 1 && crawlers[0]) {
            endPosition = crawlers[0].path[1] as Vec.Vec2;
        }
        crawl(cc, endPosition);
        crawlers.push(cc);

    }
    return crawlers

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
function crawl(cc: CaveCrawler, endPosition: Vec.Vec2) {

    // Generate path
    for (let i = 0; i < iterations; i++) {
        cc.direction += randFloat(window.underworld.random, -directionRandomAmount, directionRandomAmount);
        const nextPointDirection = { x: cc.position.x + Math.cos(cc.direction), y: cc.position.y + Math.sin(cc.direction) };
        const dist = distance(cc.position, nextPointDirection);
        cc.path.push(cc.position);
        cc.position = Vec.add(cc.position, similarTriangles(nextPointDirection.x - cc.position.x, nextPointDirection.y - cc.position.y, dist, velocity));
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
            cc.left.push(Vec.add(p, similarTriangles(left.x - p.x, left.y - p.y, tangentDist, cc.thickness)))
            cc.right.push(Vec.add(p, similarTriangles(right.x - p.x, right.y - p.y, tangentDist, cc.thickness)))
        }
    }

}