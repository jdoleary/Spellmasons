import * as particles from 'jdoleary-fork-pixi-particle-emitter'
import * as Vec from '../jmath/Vec';
import { Vec2 } from '../jmath/Vec';
import { prng, randFloat } from '../jmath/rand';
import { raceTimeout } from '../Promise';
import { BloodParticle, graphicsBloodSmear, tickParticle } from './PixiUtils';
import type Underworld from '../Underworld';
import { Container, ParticleContainer } from 'pixi.js';
import { stopAndDestroyForeverEmitter } from './ParticleCollection';
import { JEmitter } from '../types/commonTypes';

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
    if (globalThis.emitters && globalThis.limitParticleEmitters !== undefined && globalThis.limitParticleEmitters !== -1 && globalThis.emitters?.length >= globalThis.limitParticleEmitters) {
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
    if (globalThis.emitters && globalThis.limitParticleEmitters !== undefined && globalThis.limitParticleEmitters !== -1 && globalThis.emitters?.length >= globalThis.limitParticleEmitters) {
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
    // lerp: 0.0 to 1.0; once lerp reaches 1.0 the angleRad will be set to the targetRadAngle
    lerp: number;
    position: Vec2,
    moveFn: (lerpValue: number) => Vec2;
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
export function addTrail(position: Vec2, target: Vec2, underworld: Underworld, config: particles.EmitterConfigV3): Promise<void> {
    if (!containerParticles) {
        return Promise.resolve();
    }
    if (globalThis.emitters && globalThis.limitParticleEmitters !== undefined && globalThis.limitParticleEmitters !== -1 && globalThis.emitters?.length >= globalThis.limitParticleEmitters) {
        return Promise.resolve();
    }
    const emitter: JEmitter = new particles.Emitter(containerParticles, config);
    emitter.cleanAfterTurn = true;
    globalThis.emitters?.push(emitter);
    emitter.updateOwnerPos(position.x, position.y);
    // 3000 is an arbitrary timeout for now
    return raceTimeout(3000, 'trail', new Promise<void>((resolve) => {
        const control = Vec.jitter(position, 300);
        trails.push({ lerp: 0, position, moveFn: createCurveTowardsFunction(position, target, control), emitter, resolver: resolve });
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
    const lerpSpeed = 0.02;
    for (let t of trails) {
        if (t.lerp <= 1.0) {
            t.position = t.moveFn(t.lerp)
            t.lerp += lerpSpeed;
            if (!t.emitter.destroyed) {
                t.emitter.updateOwnerPos(t.position.x, t.position.y);
            }
        } else {
            stopAndDestroyForeverEmitter(t.emitter);
            // resolve trail as soon as it reaches it's target
            t.resolver();
            if (t.emitter.particleCount == 0) {
                cleanUpTrail(t);
            }
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
        if (isInsideLiquid || tickParticle(blood)) {
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