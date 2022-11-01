import * as particles from '@pixi/particle-emitter'
import * as Vec from '../jmath/Vec';
import { Vec2 } from '../jmath/Vec';
import * as math from '../jmath/math';
import { prng, randFloat } from '../jmath/rand';
import { normalizeAngle } from '../jmath/Angle';
import seedrandom from 'seedrandom';
import { raceTimeout } from '../Promise';
import { BloodParticle, graphicsBloodSmear, tickParticle } from './PixiUtils';
import type Underworld from '../Underworld';

export const containerParticles = !globalThis.pixi ? undefined : new globalThis.pixi.ParticleContainer(5000, {
    scale: true,
    position: true,
    rotation: false,
    uvs: false,
    tint: true
});
export function simpleEmitter(position: Vec2, config: particles.EmitterConfigV3, resolver?: () => void) {
    if (!containerParticles) {
        return undefined
    }
    const emitter = new particles.Emitter(containerParticles, config);
    emitter.updateOwnerPos(position.x, position.y);
    emitter.playOnceAndDestroy(() => {
        if (resolver) {
            resolver();
        }
    })
    return emitter;

}
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
    if (!containerParticles) {
        return Promise.resolve();
    }
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
    const texture = createParticleTexture();
    if (!texture) {
        return undefined
    }
    return addTrail(
        start,
        target,
        10,
        randFloat(seedrandom(), 0, Math.PI * 2),
        particles.upgradeConfig({
            autoUpdate: true,
            alpha: {
                start: 1,
                end: 0
            },
            scale: {
                start: 1,
                end: 0.2,
                minimumScaleMultiplier: 1
            },
            color: {
                start: "#e4f9ff",
                end: "#3fcbff"
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
                max: 360
            },
            noRotation: true,
            rotationSpeed: {
                min: 0,
                max: 0
            },
            lifetime: {
                min: 0.4,
                max: 0.4
            },
            blendMode: "normal",
            frequency: 0.021,
            emitterLifetime: -1,
            maxParticles: 30,
            pos: {
                x: 0,
                y: 0
            },
            addAtBack: false,
            spawnType: "point"
        }, [texture]));
}


export function updateParticlees(delta: number, bloods: BloodParticle[], seedrandom: prng, underworld: Underworld) {

    // Emitters:
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
    // "graphics" particles
    for (var i = 0; i < bloods.length; i++) {
        var blood = bloods[i];
        if (!blood) {
            continue;
        }
        if (graphicsBloodSmear) {
            graphicsBloodSmear.beginFill(blood?.color, 1.0);
            graphicsBloodSmear.lineStyle(0);
        }
        //shrink blood particle:
        blood.scale *= 0.7;
        var blood_x_mod = randFloat(seedrandom, -10, 10);
        var blood_y_mod = randFloat(seedrandom, -10, 10);
        var blood_size_mod = randFloat(seedrandom, 1, blood.scale);
        const drawBloodPosition = { x: blood.x + blood_x_mod, y: blood.y + blood_y_mod }

        let isInsideLiquid = underworld.isInsideLiquid(drawBloodPosition);
        // Only draw if blood isn't inside of liquid bounds
        if (!isInsideLiquid && graphicsBloodSmear) {
            graphicsBloodSmear.drawCircle(drawBloodPosition.x, drawBloodPosition.y, blood_size_mod);
        }

        // remove when inside liquid so it doesn't draw blood on top of liquid OR when done ticking
        if (isInsideLiquid || tickParticle(blood)) {
            bloods.splice(i, 1);
            i--;
        }

        if (graphicsBloodSmear) {
            graphicsBloodSmear.endFill();
        }

    }
}

export function createParticleTexture() {
    if (!globalThis.pixi) {
        return undefined;
    }
    const img = new Image();
    img.src = './images/particle.png';
    const base = new globalThis.pixi.BaseTexture(img);
    return new globalThis.pixi.Texture(base);
}
export function createHardCircleParticleTexture() {
    if (!globalThis.pixi) {
        return undefined;
    }
    const img = new Image();
    img.src = './images/hard-circle.png';
    const base = new globalThis.pixi.BaseTexture(img);
    return new globalThis.pixi.Texture(base);
}

export function moveStreakEmitter(position: Vec2, prediction: boolean) {
    if (prediction) {
        // Don't show if just a prediction
        return undefined
    }
    const texture = createParticleTexture();
    if (!texture) {
        console.error('No texture for makeBloatExplosion')
        return
    }
    const config =
        particles.upgradeConfig({
            autoUpdate: true,
            "alpha": {
                "start": 0.4,
                "end": 0
            },
            "scale": {
                "start": 10,
                "end": 1,
                "minimumScaleMultiplier": 1
            },
            "color": {
                "start": "#ffffff",
                "end": "#ffffff"
            },
            "speed": {
                "start": 0,
                "end": 0,
                "minimumSpeedMultiplier": 1
            },
            "acceleration": {
                "x": 0,
                "y": 0
            },
            "maxSpeed": 0,
            "startRotation": {
                "min": 0,
                "max": 360
            },
            "noRotation": true,
            "rotationSpeed": {
                "min": 0,
                "max": 0
            },
            "lifetime": {
                "min": 0.7,
                "max": 0.7
            },
            "blendMode": "normal",
            "frequency": 0.0001,
            "emitterLifetime": 1,
            "maxParticles": 2000,
            "pos": {
                "x": 0,
                "y": 0
            },
            "addAtBack": true,
            "spawnType": "point"
        }, [texture]);
    return simpleEmitter(position, config);
}