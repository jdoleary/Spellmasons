import { magnitude, Vec2 } from '../../jmath/Vec';
import { getNextCameraPosition, getNextCameraVelocity } from '../PixiUtils';

describe('camera', () => {
    describe('camera speed', () => {
        it('distance traveled should be roughly even at various framerates', () => {
            const framerates = [30, 60, 120, 144, 300];
            const results: { framerate: number, dist: number }[] = [];
            framerates.forEach(framerate => {
                const realTime = 1;
                const totalFrames = realTime * framerate;
                const deltaTime = (1 / framerate) * 1000;

                const currentPos = { x: 0, y: 0 };
                const currentVelocity = { x: 0, y: 0 }
                const targetVelocity = { x: 0, y: 1 }
                const zoom = 1;

                for (let i = 0; i < totalFrames; i++) {
                    const nextVel = getNextCameraVelocity(currentVelocity, targetVelocity, deltaTime);
                    currentVelocity.x = nextVel.x;
                    currentVelocity.y = nextVel.y;

                    const nextPos = getNextCameraPosition(currentPos, currentVelocity, zoom, deltaTime);
                    currentPos.x = nextPos.x;
                    currentPos.y = nextPos.y;
                }
                results.push({ framerate, dist: magnitude(currentPos) });
            });

            expect(results.length).toBeGreaterThan(0);
            if (results.length) {
                // Get average distance
                let averageDist = 0;
                results.forEach(r => { averageDist += r.dist; });
                averageDist /= results.length;

                // Log results
                console.log("Average Distance: ", averageDist);
                console.log("Results: ", results);

                // Test fails if any framerates is more than 10% off from the average distance
                results.forEach(r => {
                    const maxErrorMargin = 0.1;
                    const errorMargin = (r.dist - averageDist) / averageDist;

                    console.log(`[${r.framerate} fps: ${r.dist}] = ${errorMargin * 100}%`);
                    expect(Math.abs(errorMargin)).toBeLessThan(maxErrorMargin);
                })
            }
        });
    });

});