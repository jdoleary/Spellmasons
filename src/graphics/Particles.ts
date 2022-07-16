import * as PIXI from 'pixi.js';
import * as particles from '@pixi/particle-emitter'
import * as Vec from '../jmath/Vec';
import { Vec2 } from '../jmath/Vec';
import * as math from '../jmath/math';
import { randFloat } from '../jmath/rand';
import { normalizeAngle } from '../jmath/Angle';
import { app } from './PixiUtils';
import seedrandom from 'seedrandom';
import { raceTimeout } from '../Promise';

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
    angleRad: number;
    velocity: number;
    emitter: particles.Emitter;
    resolver: () => void;
}
const trails: Trail[] = [];
export function addTrail(position: Vec2, target: Vec2, startVelocity: number, angleRad: number, config: particles.EmitterConfigV3): Promise<void> {
    const emitter = new particles.Emitter(containerParticles, config);
    emitter.updateOwnerPos(position.x, position.y);
    // 3000 is an arbitrary timeout for now
    return raceTimeout(3000, 'trail', new Promise<void>((resolve) => {
        trails.push({ position, target, velocity: startVelocity, angleRad: normalizeAngle(angleRad), emitter, resolver: resolve });
    }));
}
export function cleanUpTrail(trail: Trail) {
    trail.emitter.destroy();
    trail.resolver();
    const i = trails.indexOf(trail);
    if (i !== -1) {
        trails.splice(i, 1)
    }
}
export function makeManaTrail(start: Vec2, target: Vec2) {
    const texture = createTexture();
    return addTrail(
        start,
        target,
        10,
        randFloat(seedrandom(), 0, Math.PI * 2),
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
                min: 0.3,
                max: 0.3
            },
            blendMode: "normal",
            frequency: 0.0008,
            emitterLifetime: -1,
            maxParticles: 400,
            pos: {
                x: 0,
                y: 0
            },
            addAtBack: false,
            spawnType: "point"
        }, [texture]));
}


export function updateParticlees(delta: number) {

    const inverseRotationSpeed = 10;
    const velocityIncrease = 0.1;
    for (let t of trails) {
        const movementDirectionPos = math.getPosAtAngleAndDistance(t.position, t.angleRad, 100);
        t.position = math.getCoordsAtDistanceTowardsTarget(t.position, movementDirectionPos, t.velocity);
        const distanceToTarget = math.distance(t.position, t.target);
        if (distanceToTarget <= t.velocity * 2) {
            // Stop moving and stop emitting new particles once it reaches it's destination
            t.position = Vec.clone(t.target);
            t.emitter.updateOwnerPos(t.position.x, t.position.y);
            // Essentially, stop spawning new particles
            t.emitter.frequency = 10000;
        }
        const targetRad = normalizeAngle(Vec.getAngleBetweenVec2s(t.position, t.target));
        const diffToTargetRad = Math.abs(targetRad - t.angleRad);
        if (Math.abs(diffToTargetRad) < 0.01) {
            t.angleRad = targetRad;
        } else {
            t.angleRad += diffToTargetRad / inverseRotationSpeed;
        }
        t.angleRad = normalizeAngle(t.angleRad);
        t.velocity += velocityIncrease;
        t.emitter.updateOwnerPos(t.position.x, t.position.y);
        if (Vec.equal(t.position, t.target) && t.emitter.particleCount == 0) {
            cleanUpTrail(t);
        }
    }
}

function createTexture() {
    const img = new Image();
    img.src = './images/particle.png';
    const base = new PIXI.BaseTexture(img);
    return new PIXI.Texture(base);
}
