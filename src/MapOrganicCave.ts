import { distance, similarTriangles } from "./math";
import { randFloat, randInt } from "./rand";
import * as Vec from "./Vec";

const minThickness = 40;
export function generateCave(): CaveCrawler[] {
    const minDirection = randFloat(window.underworld.random, Math.PI, Math.PI / 2);
    const maxDirection = 0;
    const crawlers = Array(2).fill(0).map<CaveCrawler>(x => {
        const position = { x: 0, y: 0 };
        return {
            direction: randFloat(window.underworld.random, minDirection, maxDirection),
            thickness: 80,
            position,
            path: [],
            left: [],
            right: [],
        }
    })
    const iterations = 20;
    const velocity = 80;
    const directionRandomAmount = Math.PI / 3;
    for (let cc of crawlers) {
        // Generate path
        for (let i = 0; i < iterations; i++) {
            cc.direction += randFloat(window.underworld.random, -directionRandomAmount, directionRandomAmount);
            const nextPointDirection = { x: cc.position.x + Math.cos(cc.direction), y: cc.position.y + Math.sin(cc.direction) };
            const dist = distance(cc.position, nextPointDirection);
            cc.path.push(cc.position);
            cc.position = Vec.add(cc.position, similarTriangles(nextPointDirection.x - cc.position.x, nextPointDirection.y - cc.position.y, dist, velocity));
        }
        const pathOrigin = cc.path[0];
        if (pathOrigin) {
            // At the end make it return to origin
            while (distance(cc.position, pathOrigin) > velocity + velocity * .25) {
                cc.position = Vec.add(cc.position, similarTriangles(pathOrigin.x - cc.position.x, pathOrigin.y - cc.position.y, distance(cc.position, pathOrigin), velocity));
                cc.position = Vec.jitter(cc.position, velocity / 2);
                cc.path.push(cc.position);
            }
            cc.path.push(pathOrigin);
            // And add a second one so that the left and right path's have a next point after getting all the way back
            cc.path.push(pathOrigin);

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
                cc.thickness += randInt(window.underworld.random, -20, 30);
                // Don't let thickness be lessthan minThickness 
                cc.thickness = Math.max(minThickness, cc.thickness);
                cc.left.push(Vec.add(p, similarTriangles(left.x - p.x, left.y - p.y, tangentDist, cc.thickness)))
                cc.right.push(Vec.add(p, similarTriangles(right.x - p.x, right.y - p.y, tangentDist, cc.thickness)))
            }
        }

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
function crawl(cc: CaveCrawler) {

}