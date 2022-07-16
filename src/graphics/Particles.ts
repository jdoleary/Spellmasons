import * as PIXI from 'pixi.js';
import * as particles from '@pixi/particle-emitter'
import * as Vec from '../jmath/Vec';
import { Vec2 } from '../jmath/Vec';
import * as math from '../jmath/math';
import { randInt } from '../jmath/rand';

export const containerParticles = new PIXI.ParticleContainer(5000, {
    scale: true,
    position: true,
    rotation: false,
    uvs: false,
    tint: true
});
interface Trail {
    position: Vec2;
    target: Vec2;
    velocity: Vec2;
    acceleration: number;
    emitter: particles.Emitter;
}
const trails: Trail[] = [];
export function addTrail(position: Vec2, target: Vec2, startVelocity: Vec2, acceleration: number, config: particles.EmitterConfigV3) {
    const emitter = new particles.Emitter(containerParticles, config);
    emitter.updateOwnerPos(position.x, position.y);
    trails.push({ position, target, velocity: startVelocity, acceleration, emitter });
}
export function cleanUpTrail(trail: Trail) {
    trail.emitter.destroy();
    const i = trails.indexOf(trail);
    if (i !== -1) {
        trails.splice(i, 1)
    }
}
export function testTrail(app: PIXI.Application, position: Vec2) {
    const texture = createTexture(0, 8, app.renderer.resolution);
    addTrail(
        position,
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        // { x: randInt(window.underworld.random, -10, 10), y: randInt(window.underworld.random, -10, 10) },
        1.1,
        particles.upgradeConfig({
            autoUpdate: true,
            alpha: {
                start: 0.8,
                end: 0.15
            },
            scale: {
                start: 1,
                end: 0.2,
                minimumScaleMultiplier: 1
            },
            color: {
                start: "#2196F3",
                end: "#e3f9ff"
            },
            speed: {
                start: 0,
                end: 0,
                minimumSpeedMultiplier: 1
            },
            acceleration: {
                x: 0,
                y: 0
            },
            maxSpeed: 0,
            startRotation: {
                min: 0,
                max: 0
            },
            noRotation: true,
            rotationSpeed: {
                min: 0,
                max: 0
            },
            lifetime: {
                min: 0.6,
                max: 0.6
            },
            blendMode: "normal",
            frequency: 0.0008,
            emitterLifetime: -1,
            maxParticles: 5000,
            pos: {
                x: 0,
                y: 0
            },
            addAtBack: false,
            spawnType: "point"
        }, [texture]));

}


// window.addEventListener("resize", () => resized = true);

export function onTick(delta: number, pointer: Vec2) {

    // if (!Vec.equal(emitterPos, pointer)) {

    //     const dt = 1 - Math.pow(1 - sharpness, delta);
    //     const dx = pointer.x - emitterPos.x;
    //     const dy = pointer.y - emitterPos.y;

    //     if (Math.abs(dx) > minDelta) {
    //         emitterPos.x += dx * dt;
    //     } else {
    //         emitterPos.x = pointer.x;
    //     }

    //     if (Math.abs(dy) > minDelta) {
    //         emitterPos.y += dy * dt;
    //     } else {
    //         emitterPos.y = pointer.y;
    //     }
    // }

    for (let t of trails) {
        const changeInVelocity = Vec.subtract(math.getCoordsAtDistanceTowardsTarget(
            t.position,
            t.target,
            t.acceleration
        ), t.position);
        t.velocity.x += changeInVelocity.x;
        t.velocity.y += changeInVelocity.y;
        const nextX = t.position.x + t.velocity.x;
        const nextY = t.position.y + t.velocity.y;
        if (math.distance({ x: nextX, y: nextY }, t.position) >= math.distance(t.target, t.position)) {
            // Stop moving and stop emitting new particles once it reaches it's destination
            t.position = Vec.clone(t.target);
            t.emitter.updateOwnerPos(t.position.x, t.position.y);
            // Essentially, stop spawning new particles
            t.emitter.frequency = 10000;
        } else {
            t.position.x += t.velocity.x;
            t.position.y += t.velocity.y;

        }
        t.emitter.updateOwnerPos(t.position.x, t.position.y);
        console.log(t.emitter.particleCount, 'jtest')
        if (t.emitter.particleCount == 0) {
            cleanUpTrail(t);
        }
    }
}

function createTexture(r1: number, r2: number, resolution: number) {

    const c = (r2 + 1) * resolution;
    r1 *= resolution;
    r2 *= resolution;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    canvas.width = canvas.height = c * 2;

    const gradient = context.createRadialGradient(c, c, r1, c, c, r2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    return PIXI.Texture.from(canvas);
}
