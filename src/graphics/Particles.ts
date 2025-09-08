import * as particles from 'jdoleary-fork-pixi-particle-emitter'
import * as Vec from '../jmath/Vec';
import { Vec2 } from '../jmath/Vec';
import { prng, randFloat, randInt } from '../jmath/rand';
import { raceTimeout } from '../Promise';
import { BloodParticle, graphicsBloodSmear, tickParticle } from './PixiUtils';
import type Underworld from '../Underworld';
import { Container, ParticleContainer } from 'pixi.js';
import { emitterStopFrequency, stopAndDestroyForeverEmitter } from './ParticleCollection';
import { JEmitter } from '../types/commonTypes';
import { distance } from '../jmath/math';

export const containerParticles = !globalThis.pixi ? undefined : new globalThis.pixi.ParticleContainer(5000, {
    scale: true,
    position: true,
    rotation: false,
    uvs: false,
    tint: true
});
export const containerParticlesUnderUnits = !globalThis.pixi ? undefined : new globalThis.pixi.ParticleContainer(5000, {
    scale: true,
    position: true,
    rotation: false,
    uvs: false,
    tint: true
});

// Since emitters create particles in the same container the emitter is in, it is beneficial to have a wrapped
// emitter that only creates particles in its own container.  Since containerUnits is always sorting itself
// so it has proper z-index draw order, I don't want hundreds of particles to all be sorted individually.
// For optimization, I'd rather just a parent container specifically for them be sorted.
export function wrappedEmitter(config: particles.EmitterConfigV3, container: Container, resolver?: () => void) {
    if (!container) {
        if (resolver) {
            resolver();
        }
        return undefined;
    }
    if (!globalThis.pixi) {
        if (resolver) {
            resolver();
        }
        return undefined;
    }
    if (globalThis.emitters && exists(globalThis.limitParticleEmitters) && globalThis.limitParticleEmitters !== -1 && globalThis.emitters?.length >= globalThis.limitParticleEmitters) {
        if (resolver) {
            resolver();
        }
        return undefined;
    }

    const emitterContainer = new globalThis.pixi.Container();
    container.addChild(emitterContainer);
    const emitter = new particles.Emitter(emitterContainer, config);
    // This function is so far only used for the bossmasons's cape and so it is
    // a "level lifetime" emitter
    globalThis.emitters?.push(emitter);
    emitter.updateOwnerPos(0, 0);
    emitter.playOnceAndDestroy(() => {
        if (resolver) {
            resolver();
        }
    });
    return {
        container: emitterContainer,
        emitter
    };

}
export function simpleEmitter(position: Vec2, config: particles.EmitterConfigV3, resolver?: () => void, container?: ParticleContainer) {
    if (!containerParticles) {
        if (resolver) {
            resolver();
        }
        return undefined
    }
    if (globalThis.emitters && exists(globalThis.limitParticleEmitters) && globalThis.limitParticleEmitters !== -1 && globalThis.emitters?.length >= globalThis.limitParticleEmitters) {
        if (resolver) {
            resolver();
        }
        return undefined;
    }
    const emitter: JEmitter = new particles.Emitter(container || containerParticles, config);
    emitter.cleanAfterTurn = true;
    globalThis.emitters?.push(emitter);
    emitter.updateOwnerPos(position.x, position.y);
    emitter.playOnceAndDestroy(() => {
        if (resolver) {
            resolver();
        }
    })
    return emitter;

}
interface Trail {
    position: Vec2,
    velocity: Vec2,
    target: Vec2,
    emitter: particles.Emitter;
    resolver: () => void;
}
// written by ChatGPT:
function createCurveTowardsFunction(start: Vec2, end: Vec2, control: Vec2): (t: number) => Vec2 {
    // Calculate the coefficients of the cubic Bezier curve
    // using the start, end, and control points
    const cx = 3 * (control.x - start.x);
    const bx = 3 * (end.x - control.x) - cx;
    const ax = end.x - start.x - cx - bx;
    const cy = 3 * (control.y - start.y);
    const by = 3 * (end.y - control.y) - cy;
    const ay = end.y - start.y - cy - by;

    // Return a function that moves the start point towards the end point
    // by a given amount (t) along the curve
    return function moveTowards(t: number) {
        // Calculate the new point on the curve using the cubic Bezier formula
        const x = start.x + t * (cx + t * (bx + t * ax));
        const y = start.y + t * (cy + t * (by + t * ay));
        return { x, y };
    }
}
const trails: Trail[] = [];
const floatingParticles: FloatingParticle[] = [];
export function addTrail(position: Vec2, target: Vec2, underworld: Underworld, config: particles.EmitterConfigV3): Promise<void> {
    if (!containerParticles) {
        return Promise.resolve();
    }
    if (globalThis.emitters && exists(globalThis.limitParticleEmitters) && globalThis.limitParticleEmitters !== -1 && globalThis.emitters?.length >= globalThis.limitParticleEmitters) {
        return Promise.resolve();
    }
    const emitter: JEmitter = new particles.Emitter(containerParticles, config);
    emitter.cleanAfterTurn = true;
    globalThis.emitters?.push(emitter);
    emitter.updateOwnerPos(position.x, position.y);
    // 3000 is an arbitrary timeout for now
    return raceTimeout(3000, 'trail', new Promise<void>((resolve) => {
        trails.push({ emitter, resolver: resolve, ...spawnTrail(position, target, 10) })
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


function _updateTrailVelocity(trail: Trail, maxSpeed: number = 5, acceleration: number = 0.1): void {
    // Calculate direction vector from position to target
    const dx = trail.target.x - trail.position.x;
    const dy = trail.target.y - trail.position.y;

    // Calculate distance to target
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If we're very close to target, set velocity to zero to prevent overshooting
    if (distance < 0.1) {
        trail.velocity.x = 0;
        trail.velocity.y = 0;
        return;
    }

    // Normalize direction vector
    const dirX = dx / distance;
    const dirY = dy / distance;

    // Calculate desired velocity (pointing toward target)
    const desiredVelX = dirX * maxSpeed;
    const desiredVelY = dirY * maxSpeed;

    // Apply steering force (gradual acceleration toward desired velocity)
    const steerX = (desiredVelX - trail.velocity.x) * acceleration;
    const steerY = (desiredVelY - trail.velocity.y) * acceleration;

    // Update velocity
    trail.velocity.x += steerX;
    trail.velocity.y += steerY;

    // Limit velocity to prevent overshooting on next frame
    const currentSpeed = Math.sqrt(trail.velocity.x * trail.velocity.x + trail.velocity.y * trail.velocity.y);

    // If the velocity would take us past the target, clamp it
    if (currentSpeed > distance) {
        const scale = distance / currentSpeed;
        trail.velocity.x *= scale;
        trail.velocity.y *= scale;
    }
}

function spawnTrail(position: Vec2, target: Vec2, maxVelocity: number = 10): { position: Vec2, velocity: Vec2, target: Vec2 } {
    // Generate random direction
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDirX = Math.cos(randomAngle);
    const randomDirY = Math.sin(randomAngle);

    // Calculate direction to target
    const dx = target.x - position.x;
    const dy = target.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize target direction (handle case where position equals target)
    const targetDirX = distance > 0 ? dx / distance : 0;
    const targetDirY = distance > 0 ? dy / distance : 0;

    // Calculate dot product (how aligned the random direction is with target direction)
    // Dot product ranges from -1 (opposite) to 1 (same direction)
    const dotProduct = randomDirX * targetDirX + randomDirY * targetDirY;

    // Convert dot product to alignment factor
    // When dot = 1 (pointing toward target): alignment = 1
    // When dot = -1 (pointing away from target): alignment = 0
    // When dot = 0 (perpendicular): alignment = 0.5
    const alignment = (dotProduct + 1) / 2;

    // Inverse relationship: more aligned = less velocity magnitude
    // alignment = 1 -> velocityScale = 0.1 (very slow)
    // alignment = 0 -> velocityScale = 1.0 (full speed)
    const velocityScale = 1 - (alignment * 0.9); // Keep minimum of 0.1

    const velocityMagnitude = maxVelocity * velocityScale;

    return {
        position: { x: position.x, y: position.y },
        velocity: {
            x: randomDirX * velocityMagnitude,
            y: randomDirY * velocityMagnitude
        },
        target,
    };
}

function updateTrail(trail: Trail, deltaTime: number = 1): void {
    // Update velocity to seek target
    _updateTrailVelocity(trail, 20, 0.05);

    // Update position based on velocity
    trail.position.x += trail.velocity.x * deltaTime;
    trail.position.y += trail.velocity.y * deltaTime;
}
export function calculateMaxParticles(defaultMaxParticles: number, totalNumberOfTrails?: number): { maxParticles: number, ratioToDefault: number } {
    // Optimization, regularly there are 90 total particles,
    // however, when a spell creates LOTS of trails this can slow
    // down the game a lot, so by passing totalNumberOfTrails as an
    // arg, the below calculation will automatically adjust the max particles
    // and the lifetime so that it still remains a trail but doesn't create lag
    // ---
    // the "20" is arbitrary, but it means the maxParticles will be reduced in chunks of 20
    const maxParticles = totalNumberOfTrails ? Math.max(2, Math.min(defaultMaxParticles, Math.round(20 * defaultMaxParticles / totalNumberOfTrails))) : defaultMaxParticles;
    const ratioToDefault = maxParticles / defaultMaxParticles;
    return { maxParticles, ratioToDefault };

}
export function makeManaTrail(start: Vec2, target: Vec2, underworld: Underworld, colorStart: string, colorEnd: string, totalNumberOfTrails?: number): Promise<void> {
    const texture = createParticleTexture();
    if (!texture) {
        return Promise.resolve();
    }
    const { maxParticles, ratioToDefault } = calculateMaxParticles(90, totalNumberOfTrails);
    return addTrail(
        start,
        target,
        underworld,
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
                start: colorStart,
                end: colorEnd
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
                min: 0.4 * ratioToDefault,
                max: 0.4 * ratioToDefault
            },
            blendMode: "normal",
            frequency: 0.011,
            emitterLifetime: -1,
            maxParticles,
            pos: {
                x: 0,
                y: 0
            },
            addAtBack: false,
            spawnType: "point"
        }, [texture]));
}


export function updateParticles(delta: number, bloods: BloodParticle[], seedrandom: prng, underworld: Underworld) {

    // Emitters:
    for (let t of trails) {
        updateTrail(t, 1);
        if (!t.emitter.destroyed) {
            t.emitter.updateOwnerPos(t.position.x, t.position.y);
        }
        if (distance(t.position, t.target) < 15) {
            stopAndDestroyForeverEmitter(t.emitter);
            // resolve trail as soon as it reaches it's target
            t.resolver();
            if (t.emitter.frequency == emitterStopFrequency && t.emitter.particleCount == 0) {
                cleanUpTrail(t);
            }
        }
    }
    for (let p of floatingParticles) {
        updateFloatingParticleComplex(p, delta);
        if (!p.emitter.destroyed) {
            p.emitter.updateOwnerPos(p.position.x, p.position.y);
        }
        if (p.emitter.frequency == emitterStopFrequency && p.emitter.particleCount == 0) {
            cleanUpFloatingParticle(p);
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
        var blood_x_mod = randFloat(-10, 10);
        var blood_y_mod = randFloat(-10, 10);
        var blood_size_mod = blood.scale < 1 ? randFloat(blood.scale, 1) : randFloat(1, blood.scale);
        const drawBloodPosition = { x: blood.x + blood_x_mod, y: blood.y + blood_y_mod }

        let isInsideLiquid = underworld.isInsideLiquid(drawBloodPosition);
        // Only draw if blood isn't inside of liquid bounds
        if (!isInsideLiquid && graphicsBloodSmear) {
            graphicsBloodSmear.drawCircle(drawBloodPosition.x, drawBloodPosition.y, blood_size_mod);
        }

        // remove when inside liquid so it doesn't draw blood on top of liquid OR when done ticking
        if (isInsideLiquid || tickParticle(blood, underworld)) {
            bloods.splice(i, 1);
            i--;
        }

        if (graphicsBloodSmear) {
            graphicsBloodSmear.endFill();
        }

    }
}
export function logNoTextureWarning(where: string) {
    // Headless never uses textures
    if (!globalThis.headless) {
        console.error(`No texture ${where}`);
    }
}

export function createParticleTexture() {
    if (!globalThis.pixi) {
        return undefined;
    }
    const img = new Image();
    img.src = './images/particle.png';
    // Must ignore particle tracking because I cannot access the promise
    // used inside pixi.BaseTexture and I don't want it to errantly report
    // a hanging promise in my custom castCard promise tracker because this promise
    // isn't tied to the effect of castCards
    globalThis.test_ignorePromiseTracking = 'createParticleTexture';
    const base = new globalThis.pixi.BaseTexture(img);
    globalThis.test_ignorePromiseTracking = undefined;
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
export function auraEmitter(position: Vec2, size: number, prediction: boolean) {
    if (prediction) {
        // Don't show if just a prediction
        return undefined;
    }
    const texture = createParticleTexture();
    if (!texture) {
        logNoTextureWarning('makeBloatExplosion');
        return;
    }
    const config =
        particles.upgradeConfig({
            autoUpdate: true,
            "alpha": {
                "start": 1,
                "end": 0
            },
            "scale": {
                "start": 0.5,
                "end": 0.5,
                "minimumScaleMultiplier": 1
            },
            "color": {
                "start": "#ff0000",
                "end": "#ff0000"
            },
            "speed": {
                "start": 1,
                "end": -100,
                "minimumSpeedMultiplier": 1
            },
            "acceleration": {
                "x": 0,
                "y": -10
            },
            "maxSpeed": 0,
            "startRotation": {
                "min": 0,
                "max": 0
            },
            "noRotation": false,
            "rotationSpeed": {
                "min": 50,
                "max": 50
            },
            "lifetime": {
                "min": 2,
                "max": 2
            },
            "blendMode": "normal",
            "frequency": 0.01,
            "emitterLifetime": -1,
            "maxParticles": 999,
            "pos": {
                "x": 0,
                "y": 0
            },
            "addAtBack": true,
            "spawnType": "ring",
            "spawnCircle": {
                "x": 0,
                "y": 0,
                "r": 200,
                "minR": 200
            }
        }, [texture]);
    const shape = config.behaviors.find(b => b.type == "spawnShape");
    if (shape) {
        shape.config.data.semiMinorAxis = 3 * size;
        shape.config.data.semiMajorAxis = 2 * size;
        shape.config.type = 'oval';
    }
    return simpleEmitter(position, config, undefined, containerParticlesUnderUnits);

}

export function moveStreakEmitter(position: Vec2, prediction: boolean) {
    if (prediction) {
        // Don't show if just a prediction
        return undefined;
    }
    const texture = createParticleTexture();
    if (!texture) {
        logNoTextureWarning('makeBloatExplosion');
        return;
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
export function cleanUpEmitters(onlyTurnScopedEmitters: boolean) {
    if (globalThis.emitters) {
        // Remove cleaned emitters
        globalThis.emitters = globalThis.emitters.flatMap((emitter) => {
            if (onlyTurnScopedEmitters) {
                if (emitter.cleanAfterTurn) {
                    stopAndDestroyForeverEmitter(emitter);
                    return [];
                } else {
                    return [emitter]
                }
            } else {
                stopAndDestroyForeverEmitter(emitter);
                return [];

            }
        });
    }

}


interface FloatingParticle {
    position: Vec2;
    velocity: Vec2;
    center: Vec2;
    time: number;
    floatSpeed: number;
    swirlSpeed: number;
    floatAmplitude: number;
    swirlRadius: number;
    emitter: particles.Emitter;
}


function createFloatingParticle(
    center: Vec2,
    floatSpeed: number = 1,
    swirlSpeed: number = 2,
    floatAmplitude: number = 20,
    swirlRadius: number = 15
): FloatingParticle | undefined {
    if (!containerParticles) {
        return;
    }
    if (globalThis.emitters && exists(globalThis.limitParticleEmitters) && globalThis.limitParticleEmitters !== -1 && globalThis.emitters?.length >= globalThis.limitParticleEmitters) {
        return;
    }
    const texture = createParticleTexture();
    if (!texture) {
        return;
    }
    const { maxParticles, ratioToDefault } = calculateMaxParticles(90, floatingParticles.length);
    const colorStart = '#d9fff9';
    const colorEnd = '#566d70';
    const config = particles.upgradeConfig({
        autoUpdate: true,
        alpha: {
            start: 1,
            end: 0
        },
        scale: {
            start: 0.4,
            end: 0.2,
            minimumScaleMultiplier: 1
        },
        color: {
            start: colorStart,
            end: colorEnd,
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
            min: 0.8 * ratioToDefault,
            max: 0.8 * ratioToDefault
        },
        blendMode: "normal",
        frequency: 0.011,
        emitterLifetime: -1,
        maxParticles,
        pos: {
            x: 0,
            y: 0
        },
        addAtBack: false,
        spawnType: "point"
    }, [texture]);
    const emitter: JEmitter = new particles.Emitter(containerParticles, config);
    globalThis.emitters?.push(emitter);
    emitter.updateOwnerPos(center.x, center.y);
    return {
        position: { x: center.x, y: center.y },
        velocity: { x: 0, y: 0 },
        center: center,
        time: Math.random() * Math.PI * 2, // Random starting phase
        floatSpeed,
        swirlSpeed,
        floatAmplitude,
        swirlRadius,
        emitter
    };
}

// Variant that uses sine waves with different frequencies for more complex motion
function updateFloatingParticleComplex(particle: FloatingParticle, deltaTime: number = 0.016): void {
    particle.time += deltaTime;

    // Multiple sine waves for more organic motion
    const swirl1 = Math.cos(particle.time * particle.swirlSpeed) * particle.swirlRadius;
    const swirl2 = Math.sin(particle.time * particle.swirlSpeed * 1.3) * (particle.swirlRadius * 0.5);

    const float1 = Math.sin(particle.time * particle.floatSpeed) * particle.floatAmplitude;
    const float2 = Math.cos(particle.time * particle.floatSpeed * 0.7) * (particle.floatAmplitude * 0.3);

    // Combine motions
    const targetX = particle.center.x + swirl1 + swirl2;
    const targetY = particle.center.y + float1 + float2;

    // Smooth interpolation
    const smoothing = 0.08;
    particle.velocity.x = (targetX - particle.position.x) * smoothing;
    particle.velocity.y = (targetY - particle.position.y) * smoothing;

    particle.position.x += particle.velocity.x;
    particle.position.y += particle.velocity.y;
}

export function removeFloatingParticlesFor(target: Vec2, upTo?: number): Vec2[] {
    const positions = [];
    let i = 0;
    for (let p of floatingParticles) {
        i++;
        if (exists(upTo) && i > upTo) {
            return positions;
        }
        if (p.center == target) {
            positions.push(p.position);
            stopAndDestroyForeverEmitter(p.emitter);
        }
    }
    return positions;
}
// Create multiple floating particles with slight variations
export function createFloatingParticleSystem(center: Vec2, count: number = 1) {

    const magnitude = Math.min(4, Math.max(1, Math.floor(count / 2)));
    for (let i = 0; i < count; i++) {
        // Add some randomness to each particle's properties
        const floatSpeed = randFloat(0.007, 0.012) / magnitude;//0.005;//0.8 + Math.random() * 0.6; // 0.8 - 1.4
        const swirlSpeed = randFloat(0.007, 0.012) / magnitude;//0.005;//1.5 + Math.random() * 1.0; // 1.5 - 2.5
        const floatAmplitude = randInt(4, 8) * magnitude;//15 + Math.random() * 10; // 15 - 25
        const swirlRadius = randInt(2, 4) * magnitude;//10 + Math.random() * 10; // 10 - 20

        const particle = createFloatingParticle(center, floatSpeed, swirlSpeed, floatAmplitude, swirlRadius);
        if (particle)
            floatingParticles.push(particle);
    }

}
export function cleanUpFloatingParticle(p: FloatingParticle) {
    p.emitter.destroy();
    const i = floatingParticles.indexOf(p);
    if (i !== -1) {
        floatingParticles.splice(i, 1)
    }
}
