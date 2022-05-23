import { distance, similarTriangles } from "./math";
import { randFloat, randInt } from "./rand";
import * as Vec from "./Vec";

export function generateCave(): CaveCrawler[] {
    const minDirection = randFloat(window.underworld.random, Math.PI, Math.PI / 2);
    const maxDirection = 0;
    const crawlers = Array(1).fill(0).map<CaveCrawler>(x => {
        const position = { x: 0, y: 0 };
        return {
            direction: randFloat(window.underworld.random, minDirection, maxDirection),
            thickness: 40,
            position,
            path: [],
            left: [],
            right: [],
        }
    })
    const iterations = 100;
    const velocity = 80;
    const directionRandomAmount = Math.PI / 3;
    for (let i = 0; i < iterations; i++) {
        for (let cc of crawlers) {
            cc.direction += randFloat(window.underworld.random, -directionRandomAmount, directionRandomAmount);
            const nextPointDirection = { x: cc.position.x + Math.cos(cc.direction), y: cc.position.y + Math.sin(cc.direction) };
            const left = { x: cc.position.x + Math.cos(cc.direction + Math.PI / 2), y: cc.position.y + Math.sin(cc.direction + Math.PI / 2) };
            const right = { x: cc.position.x + Math.cos(cc.direction - Math.PI / 2), y: cc.position.y + Math.sin(cc.direction - Math.PI / 2) };
            const tangentDist = distance(cc.position, left);
            const dist = distance(cc.position, nextPointDirection);
            cc.path.push(cc.position);
            cc.thickness += randInt(window.underworld.random, -30, 30);
            // Don't let thickness be lessthan 40
            cc.thickness = Math.max(40, cc.thickness);
            cc.left.push(Vec.add(cc.position, similarTriangles(left.x - cc.position.x, left.y - cc.position.y, tangentDist, cc.thickness)))
            cc.right.push(Vec.add(cc.position, similarTriangles(right.x - cc.position.x, right.y - cc.position.y, tangentDist, cc.thickness)))
            cc.position = Vec.add(cc.position, similarTriangles(nextPointDirection.x - cc.position.x, nextPointDirection.y - cc.position.y, dist, velocity));
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