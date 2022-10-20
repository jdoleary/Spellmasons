
import * as particles from '@pixi/particle-emitter'
import { rgb2hex } from '@pixi/utils';
import { easeOutCubic } from '../jmath/Easing';
import { lerp } from '../jmath/math';
import { Vec2 } from '../jmath/Vec';
import { createHardCircleParticleTexture, createParticleTexture, simpleEmitter } from './Particles';
// Max final scale should be 1
export function makeBurstParticles(position: Vec2, finalScale: number, prediction: boolean) {
    if (prediction) {
        // Don't show if just a prediction
        return
    }
    const texture = createHardCircleParticleTexture();
    if (!texture) {
        console.error('No texture for makeScrollDissapearParticles')
        return
    }
    const rings = 10;
    const millisBetweenRings = 50;
    const lifetime = 0.5;
    for (let ring = 0; ring < rings; ring++) {
        setTimeout(() => {
            // const startColor = 0x0d3f47;
            const startColor = [0.914, 1, 1];
            // const endColor = 0xe9ffff;
            const endColor = [0.051, 0.247, 0.278];
            const lerpValue = ring / rings;
            const cubicLerpValue = easeOutCubic(lerpValue);
            const scale = lerp(finalScale / 10, finalScale, cubicLerpValue);

            // Note: "|| 0" just prevents the compile time warning, the values are set
            // above and will exist
            const color = `#${Math.floor(rgb2hex([
                lerp(startColor[0] || 0, endColor[0] || 0, lerpValue),
                lerp(startColor[1] || 0, endColor[1] || 0, lerpValue),
                lerp(startColor[2] || 0, endColor[2] || 0, lerpValue),
            ])).toString(16)}`;
            const config =
                particles.upgradeConfig({
                    autoUpdate: true,
                    "alpha": {
                        "start": 1,
                        "end": 1
                    },
                    "scale": {
                        "start": scale,
                        "end": scale,
                        "minimumScaleMultiplier": 1
                    },
                    "color": {
                        "start": color,
                        "end": color,
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
                        "min": -45,
                        "max": -135
                    },
                    "noRotation": true,
                    "rotationSpeed": {
                        "min": 0,
                        "max": 0
                    },
                    "lifetime": {
                        "min": lifetime,
                        "max": lifetime
                    },
                    "blendMode": "normal",
                    "frequency": 0.001,
                    "emitterLifetime": lifetime - 0.1,
                    "maxParticles": 1,
                    "pos": {
                        "x": 0,
                        "y": 0
                    },
                    "addAtBack": true,
                    "spawnType": "point",
                }, [texture]);
            simpleEmitter(position, config);
        }, ring * millisBetweenRings);
    }
}
export function makeScrollDissapearParticles(position: Vec2, prediction: boolean) {
    if (prediction) {
        // Don't show if just a prediction
        return
    }
    const texture = createParticleTexture();
    if (!texture) {
        console.error('No texture for makeScrollDissapearParticles')
        return
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
                "end": 2.0,
                "minimumScaleMultiplier": 1
            },
            "color": {
                "start": "#bd9a71",
                "end": "#573e3d"
            },
            "speed": {
                "start": 100,
                "end": 50,
                "minimumSpeedMultiplier": 1
            },
            "acceleration": {
                "x": 0,
                "y": -100
            },
            "maxSpeed": 0,
            "startRotation": {
                "min": -45,
                "max": -135
            },
            "noRotation": false,
            "rotationSpeed": {
                "min": 0,
                "max": 0
            },
            "lifetime": {
                "min": 0.4,
                "max": 0.8
            },
            "blendMode": "normal",
            "frequency": 0.01,
            "emitterLifetime": 0.5,
            "maxParticles": 500,
            "pos": {
                "x": 0,
                "y": 0
            },
            "addAtBack": false,
            "spawnType": "circle",
            "spawnCircle": {
                "x": 0,
                "y": 0,
                "r": 15
            }
        }, [texture]);
    simpleEmitter(position, config);
}