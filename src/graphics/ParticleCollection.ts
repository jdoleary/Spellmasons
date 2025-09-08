
import * as particles from 'jdoleary-fork-pixi-particle-emitter'
import { rgb2hex } from '@pixi/utils';
import { easeOutCubic } from '../jmath/Easing';
import { lerp } from '../jmath/math';
import { clone, Vec2 } from '../jmath/Vec';
import * as config from '../config';
import * as colors from '../graphics/ui/colors';
import { containerParticles, containerParticlesUnderUnits, createHardCircleParticleTexture, createParticleTexture, logNoTextureWarning, simpleEmitter, wrappedEmitter } from './Particles';
import { bleedInstantKillProportion } from '../cards/bleed';
import { containerUnits } from './PixiUtils';
import { IUnit } from '../entity/Unit';
import Underworld from '../Underworld';
import { COLLISION_MESH_RADIUS } from '../config';
import { HEALTH_POTION, IPickup, MANA_POTION, STAMINA_POTION } from '../entity/Pickup';
import { primedCorpseId } from '../modifierPrimedCorpse';
export function makeAncientParticles(position: Vec2, prediction: boolean) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeAncientParticles');
    return;
  }
  position = clone(position);
  const config =
    particles.upgradeConfig({
      autoUpdate: true,
      "alpha": {
        "start": 1,
        "end": 0.28
      },
      "scale": {
        "start": 1.25,
        "end": 0.5,
        "minimumScaleMultiplier": 1
      },
      "color": {
        "start": "#5a7879",
        "end": "#304748"
      },
      "speed": {
        "start": 60,
        "end": 30,
        "minimumSpeedMultiplier": 1
      },
      "acceleration": {
        "x": 0,
        "y": 0
      },
      "maxSpeed": 0,
      "startRotation": {
        "min": 265,
        "max": 275
      },
      "noRotation": false,
      "rotationSpeed": {
        "min": 50,
        "max": 50
      },
      "lifetime": {
        "min": 1,
        "max": 1
      },
      "blendMode": "normal",
      "frequency": 0.02,
      "emitterLifetime": 0.8,
      "maxParticles": 60,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": false,
      "spawnType": "circle",
      "spawnCircle": {
        "x": 0,
        "y": 0,
        "r": 20
      }
    }, [texture]);
  simpleEmitter(position, config, () => { }, containerParticlesUnderUnits);
}
export function makeNova(position: Vec2, size: number, colorStart: number, colorEnd: number, prediction: boolean) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      const texture = createParticleTexture();
      if (!texture) {
        logNoTextureWarning('makeNova');
        return;
      }
      const config =
        particles.upgradeConfig({
          autoUpdate: true,
          "alpha": {
            "start": 1,
            "end": 0.5
          },
          "scale": {
            "start": 1,
            "end": 1,
          },
          "color": {
            "start": colors.convertToHashColor(colorStart),
            "end": colors.convertToHashColor(colorEnd)
          },
          "speed": {
            "start": 400,
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
          "noRotation": false,
          "rotationSpeed": {
            "min": 0,
            "max": 300
          },
          "lifetime": {
            "min": 0.5 * size,
            "max": 0.5 * size
          },
          "blendMode": "normal",
          "frequency": 0.0001,
          "emitterLifetime": 0.1,
          "maxParticles": 300,
          "pos": {
            "x": 0,
            "y": 0
          },
          "addAtBack": true,
          "spawnType": "circle",
          "spawnCircle": {
            "x": 0,
            "y": 0,
            "r": 0
          }
        }, [texture]);
      simpleEmitter(position, config);
    }, 30 * i);

  }
}

export function makeParticleExplosion(position: Vec2, size: number, colorStart: number, colorEnd: number, prediction: boolean) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeParticleExplosion');
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
        "start": 3,
        "end": 2,
      },
      "color": {
        "start": colors.convertToHashColor(colorStart),
        "end": colors.convertToHashColor(colorEnd)
      },
      "speed": {
        "start": 500,
        "end": 50,
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
      "noRotation": false,
      "rotationSpeed": {
        "min": 0,
        "max": 300
      },
      "lifetime": {
        "min": 0.5 * size,
        "max": 0.5 * size
      },
      "blendMode": "normal",
      "frequency": 0.0001,
      "emitterLifetime": 0.1,
      "maxParticles": 300,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": true,
      "spawnType": "circle",
      "spawnCircle": {
        "x": 0,
        "y": 0,
        "r": 0
      }
    }, [texture]);
  simpleEmitter(position, config);
}

export function makeBloatExplosionWithParticles(position: Vec2, size: number, prediction: boolean) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeBloatExplosion');
    return;
  }
  position = clone(position);
  const config =
    particles.upgradeConfig({
      autoUpdate: true,
      "alpha": {
        "start": 1,
        "end": 0
      },
      "scale": {
        "start": 3,
        "end": 2,
      },
      "color": {
        "start": "#d66437",
        "end": "#f5e8b6"
      },
      "speed": {
        "start": 900,
        "end": 50,
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
      "noRotation": false,
      "rotationSpeed": {
        "min": 0,
        "max": 300
      },
      "lifetime": {
        "min": 0.3 * size,
        "max": 0.3 * size
      },
      "blendMode": "normal",
      "frequency": 0.0001,
      "emitterLifetime": 0.1,
      "maxParticles": 300,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": true,
      "spawnType": "circle",
      "spawnCircle": {
        "x": 0,
        "y": 0,
        "r": 0
      }
    }, [texture]);
  simpleEmitter(position, config);
}
export function makeAlchemizeParticles(potion: IPickup, prediction: boolean, resolver?: () => void) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    if (resolver) {
      resolver();
    }
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeAlchemizeParticles');
    if (resolver) {
      resolver();
    }
    return
  }
  const colorMap = {
    [MANA_POTION]: colors.manaBrightBlue,
    [HEALTH_POTION]: colors.healthRed,
    [STAMINA_POTION]: colors.stamina,
  }
  const color = colors.convertToHashColor(colorMap[potion.name as keyof typeof colorMap] || 0xffffff);
  const particleConfig =
    particles.upgradeConfig({
      autoUpdate: true,
      "alpha": {
        "start": 0.7,
        "end": 0
      },
      "scale": {
        "start": 1.5,
        "end": 1.0,
        "minimumScaleMultiplier": 1
      },
      "color": {
        "start": color,
        "end": color
      },
      "speed": {
        "start": -40,
        "end": -40,
        "minimumSpeedMultiplier": 1
      },
      "acceleration": {
        "x": 0,
        "y": 0
      },
      "maxSpeed": 0,
      "startRotation": {
        "min": 80,
        "max": 100
      },
      "noRotation": false,
      "rotationSpeed": {
        "min": 50,
        "max": 50
      },
      "lifetime": {
        "min": 1,
        "max": 1
      },
      "blendMode": "normal",
      "frequency": 0.001,
      "emitterLifetime": 0.5,
      "maxParticles": 100,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": true,
      "spawnType": "circle",
      "spawnCircle": {
        "x": 0,
        "y": 0,
        "r": 10
      }
    }, [texture]);
  simpleEmitter({ x: potion.x, y: potion.y }, particleConfig, resolver);

}
export function makeBleedParticles(position: Vec2, prediction: boolean, proportion: number, resolver?: () => void) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    if (resolver) {
      resolver();
    }
    return;
  }
  // proportion goes from 0.0 to bleedInstantKillProportion;
  // convert to 0.0 to 1.0
  proportion = lerp(0, 1, proportion / bleedInstantKillProportion);
  if (proportion == 0) {
    // Do not emit particles if proportion is 0 because then bleed did no damage
    if (resolver) {
      resolver();
    }
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeBleedParticles');
    if (resolver) {
      resolver();
    }
    return
  }
  const particleConfig =
    particles.upgradeConfig({
      autoUpdate: true,
      "alpha": {
        "start": 1,
        "end": 1
      },
      "scale": {
        "start": 1.2 * Math.min(1, proportion * 2),
        "end": 0.25,
        "minimumScaleMultiplier": 1
      },
      "color": {
        "start": "#c72828",
        "end": "#870303"
      },
      "speed": {
        "start": 10,
        "end": 0,
        "minimumSpeedMultiplier": 1
      },
      "acceleration": {
        "x": 0,
        "y": 40
      },
      "maxSpeed": 0,
      "startRotation": {
        "min": 90,
        "max": 90
      },
      "noRotation": false,
      "rotationSpeed": {
        "min": 0,
        "max": 0
      },
      "lifetime": {
        "min": 1,
        "max": 1
      },
      "blendMode": "normal",
      "frequency": 0.01,
      "emitterLifetime": 1,
      "maxParticles": 100 * proportion * proportion,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": true,
      "spawnType": "circle",
      "spawnCircle": {
        "x": 0,
        "y": 0,
        "r": 10
      }
    }, [texture]);
  simpleEmitter({ x: position.x, y: position.y - config.COLLISION_MESH_RADIUS / 2 }, particleConfig, resolver);

}
export function makeRisingHeartParticles(position: Vec2, prediction: boolean, color: string = '#ffffff', emitterLifetime = 1.5) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  if (!globalThis.pixi) {
    return
  }
  const img = new Image();
  img.src = './images/heart.png';
  const base = new globalThis.pixi.BaseTexture(img);
  const texture = new globalThis.pixi.Texture(base);
  if (!texture) {
    logNoTextureWarning('makeRisingHeartParticles');
    return;
  }
  const particleConfig =
    particles.upgradeConfig({
      autoUpdate: true,
      "alpha": {
        "start": 1,
        "end": 1
      },
      "scale": {
        "start": 0.2,
        "end": 0.1,
        "minimumScaleMultiplier": 1
      },
      "color": {
        "start": "#520606",
        "end": "#e03636"
      },
      "speed": {
        "start": 40,
        "end": 20,
        "minimumSpeedMultiplier": 1
      },
      "acceleration": {
        "x": 0,
        "y": 0
      },
      "maxSpeed": 0,
      "startRotation": {
        "min": -90,
        "max": -90
      },
      "noRotation": false,
      "rotationSpeed": {
        "min": 0,
        "max": 0
      },
      "lifetime": {
        "min": emitterLifetime,
        "max": emitterLifetime
      },
      "blendMode": "normal",
      "frequency": 0.1,
      "emitterLifetime": emitterLifetime,
      "maxParticles": 20,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": false,
      "spawnType": "circle",
      "spawnCircle": {
        "x": 0,
        "y": 0,
        "r": 32
      }
    }, [texture]);
  return simpleEmitter(position, particleConfig, undefined, containerParticles);
}
export function makeRisingParticles(position: Vec2, prediction: boolean, color: string = '#ffffff', emitterLifetime = 0.7) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeRisingParticles');
    return;
  }
  const particleConfig =
    particles.upgradeConfig({
      autoUpdate: true,
      "alpha": {
        "start": 1,
        "end": 0
      },
      "scale": {
        "start": 0.25,
        "end": 0.25,
        "minimumScaleMultiplier": 1
      },
      "color": {
        "start": color,
        "end": color
      },
      "speed": {
        "start": 1,
        "end": 1,
        "minimumSpeedMultiplier": 1
      },
      "acceleration": {
        "x": 0,
        "y": -400
      },
      "maxSpeed": 0,
      "startRotation": {
        "min": 90,
        "max": 90
      },
      "noRotation": false,
      "rotationSpeed": {
        "min": 0,
        "max": 0
      },
      "lifetime": {
        "min": 0.81,
        "max": 0.4
      },
      "blendMode": "normal",
      "frequency": 0.004,
      "emitterLifetime": emitterLifetime,
      "maxParticles": 500,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": false,
      "spawnType": "rect",
      "spawnRect": {
        "x": -config.COLLISION_MESH_RADIUS / 2,
        "y": 0,
        "w": config.COLLISION_MESH_RADIUS,
        "h": 20
      }

    }, [texture]);
  return simpleEmitter(position, particleConfig, undefined, containerParticlesUnderUnits);
}
// Max final scale should be 1
export function makeBurstParticles(position: Vec2, finalScale: number, prediction: boolean, resolver?: () => void) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    if (resolver) {
      // Resolve immediately
      resolver();
    }
    return;
  }
  const texture = createHardCircleParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeBurstParticles');
    if (resolver) {
      // Resolve immediately
      resolver();
    }
    return;
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
      const color = colors.convertToHashColor(Math.floor(rgb2hex([
        lerp(startColor[0] || 0, endColor[0] || 0, lerpValue),
        lerp(startColor[1] || 0, endColor[1] || 0, lerpValue),
        lerp(startColor[2] || 0, endColor[2] || 0, lerpValue),
      ])));
      const particleConfig =
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
      simpleEmitter(position, particleConfig);
      // Resolve promise, animation is done
      if (resolver && ring == rings - 1) {
        resolver();
      }
    }, ring * millisBetweenRings);
  }
}
export function makeScrollDissapearParticles(position: Vec2, prediction: boolean) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeScrollDissapearParticles');
    return;
  }
  const particleConfig =
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
  simpleEmitter(position, particleConfig);
}
export function makeDarkPriestAttackParticles(position: Vec2, prediction: boolean, resolver?: () => void) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    if (resolver) {
      resolver();
    }
    return;
  }
  const texture = createHardCircleParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeDarkPriestAttackParticles');
    if (resolver) {
      resolver();
    }
    return;
  }
  const particleConfig =
    particles.upgradeConfig({
      autoUpdate: true,
      "alpha": {
        "start": 1,
        "end": 0
      },
      "scale": {
        "start": 0.1,
        "end": 0.08,
        "minimumScaleMultiplier": 1
      },
      "color": {
        "start": "#513b5f",
        "end": "#2c2134",
      },
      "speed": {
        "start": 200,
        "end": 0,
        "minimumSpeedMultiplier": 1
      },
      "acceleration": {
        "x": 0,
        "y": 0
      },
      "maxSpeed": 0,
      "startRotation": {
        "min": -90,
        "max": -90
      },
      "noRotation": false,
      "rotationSpeed": {
        "min": 0,
        "max": 0
      },
      "lifetime": {
        "min": 0.8,
        "max": 0.8
      },
      "blendMode": "normal",
      "frequency": 0.005,
      "emitterLifetime": 0.5,
      "maxParticles": 100,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": true,
      "spawnType": "point"
    }, [texture]);
  simpleEmitter({ x: position.x, y: position.y }, particleConfig, resolver);
}
const cursedEmitterConfig = (maxParticles: number) => ({
  autoUpdate: true,
  "alpha": {
    "start": 1,
    "end": 0
  },
  "scale": {
    "start": 1,
    "end": 0.2,
    "minimumScaleMultiplier": 1
  },
  "color": {
    "start": "#321d73",
    "end": "#9526cc"
  },
  "speed": {
    "start": 20,
    "end": 0,
    "minimumSpeedMultiplier": 1
  },
  "acceleration": {
    "x": 0,
    "y": 0
  },
  "maxSpeed": 0,
  "startRotation": {
    "min": -90,
    "max": -90
  },
  "noRotation": false,
  "rotationSpeed": {
    "min": 0,
    "max": 0
  },
  "lifetime": {
    "min": 3.5,
    "max": 4
  },
  "blendMode": "normal",
  // freqency is relative to max particles
  // so that it emits at a consistent rate
  // without gaps
  "frequency": 0.01 * (500 / maxParticles),
  "emitterLifetime": -1,
  "maxParticles": maxParticles,
  "pos": {
    "x": 0.5,
    "y": 0.5
  },
  "addAtBack": true,
  "spawnType": "circle",
  "spawnCircle": {
    "x": 0,
    "y": 0,
    "r": 15
  }

});

// The bossmason's "cape"
export const CORRUPTION_PARTICLES_JID = 'corruptionParticles';
export function makeCorruptionParticles(follow: IUnit, prediction: boolean, underworld: Underworld, resolver?: () => void) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    if (resolver) {
      resolver();
    }
    return
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeCorruptionParticles');
    if (resolver) {
      resolver();
    }
    return
  }
  // @ts-ignore: jid custom identifier
  const targetAlreadyHasEmitter = underworld.particleFollowers.find(x => x.target == follow && x.emitter && x.emitter.jid == CORRUPTION_PARTICLES_JID);
  if (targetAlreadyHasEmitter) {
    console.debug('Do not create makeCorruptionParticles emitter, target already has one');
    return;
  }
  const particleConfig =
    particles.upgradeConfig(cursedEmitterConfig(500), [texture]);
  if (containerUnits) {
    const wrapped = wrappedEmitter(particleConfig, containerUnits, resolver);
    if (wrapped) {
      const { container, emitter } = wrapped;
      // @ts-ignore: jid custom identifier
      emitter.jid = CORRUPTION_PARTICLES_JID;
      underworld.particleFollowers.push({
        displayObject: container,
        emitter,
        target: follow
      });
    } else {
      console.warn('Failed to create corruption particle emitter');
    }
  } else {
    return;
  }
}
export function makeCursedEmitter(position: Vec2, prediction: boolean) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('cursedEmitter');
    return;
  }
  const particleConfig = particles.upgradeConfig(cursedEmitterConfig(50), [texture]);
  return simpleEmitter(position, particleConfig, undefined, containerParticlesUnderUnits);
}

export const RED_PORTAL_JID = 'redPortal';
export const BLUE_PORTAL_JID = 'bluePortal';
export function makeDeathmasonPortal(position: Vec2, prediction: boolean, colorStart: string, colorEnd: string) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeRedPortal');
    return;
  }
  const particleConfig =
    particles.upgradeConfig({
      autoUpdate: true,
      "alpha": {
        "start": 1,
        "end": 1
      },
      "scale": {
        "start": 1.0,
        "end": 0.3,
        "minimumScaleMultiplier": 1
      },
      "color": {
        "start": colorStart,
        "end": colorEnd
      },
      "speed": {
        "start": 20,
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
      "noRotation": false,
      "rotationSpeed": {
        "min": 0,
        "max": 0
      },
      "lifetime": {
        "min": 1,
        "max": 1
      },
      "blendMode": "normal",
      "frequency": 0.005,
      "emitterLifetime": -1,
      "maxParticles": 1000,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": false,
      "spawnType": "rect",
      "spawnRect": {
        "x": -5 / 2,
        "y": -17 / 2,
        "w": 5,
        "h": 17
      }
    }, [texture]);
  return simpleEmitter(position, particleConfig);
}

export function makeLightBeamParticles(position: Vec2) {
  if (globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeLightBeamParticles');
    return;
  }
  const config =
    particles.upgradeConfig({
      autoUpdate: true,
      "alpha": {
        "start": 0.8,
        "end": 0
      },
      "scale": {
        "start": 0.8,
        "end": 0.4,
      },
      "color": {
        "start": '#ffffff',
        "end": '#ffffff',
      },
      "speed": {
        "start": 40,
        "end": 0,
        "minimumSpeedMultiplier": 0.1
      },
      "acceleration": {
        "x": 0,
        "y": -20
      },
      "maxSpeed": 0,
      "startRotation": {
        "min": -90,
        "max": -90
      },
      "noRotation": false,
      "rotationSpeed": {
        "min": 0,
        "max": 300
      },
      "lifetime": {
        "min": 0.3,
        "max": 2
      },
      "blendMode": "normal",
      "frequency": 0.0001,
      "emitterLifetime": 0.1,
      "maxParticles": 600,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": true,
      "spawnType": "circle",
      "spawnCircle": {
        "x": 0,
        "y": -10,
        "r": 30
      }
    }, [texture]);
  simpleEmitter({ x: position.x, y: position.y + COLLISION_MESH_RADIUS / 2 }, config, undefined, containerParticlesUnderUnits);
}



export function makePrimedCorpseParticles(follow: IUnit, underworld: Underworld, prediction: boolean, resolver?: () => void) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    if (resolver) {
      resolver();
    }
    return
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makePrimedCorpseParticles');
    if (resolver) {
      resolver();
    }
    return
  }
  const particleConfig = particles.upgradeConfig(
    {
      "alpha": {
        "start": 0.7,
        "end": 0
      },
      "scale": {
        "start": 1,
        "end": 0.001,
        "minimumScaleMultiplier": 2
      },
      "color": {
        "start": "#d9fff9",
        "end": "#566d70"
      },
      "speed": {
        "start": 20,
        "end": 20,
        "minimumSpeedMultiplier": 1
      },
      "acceleration": {
        "x": 0,
        "y": -150
      },
      "maxSpeed": 0,
      "startRotation": {
        "min": 265,
        "max": 265
      },
      "noRotation": false,
      "rotationSpeed": {
        "min": 0,
        "max": 0
      },
      "lifetime": {
        "min": 1,
        "max": 1
      },
      "blendMode": "normal",
      "frequency": 0.005,
      "emitterLifetime": -1,
      "maxParticles": 1000,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": false,
      "spawnType": "circle",
      "spawnCircle": {
        "x": 0,
        "y": 0,
        "r": 2
      }
    }, [texture]);

  if (containerUnits) {
    const wrapped = wrappedEmitter(particleConfig, containerUnits, resolver);
    if (wrapped) {
      const { container, emitter } = wrapped;
      const particleFollower = {
        displayObject: container,
        emitter,
        target: follow,
        keepOnDeath: true,
      }
      // @ts-ignore jid is a unique identifier that allows us to search for this pf later
      particleFollower.jid = primedCorpseId;
      underworld.particleFollowers.push(particleFollower);
    } else {
      console.warn('Failed to create primed corpse particle emitter');
    }
  } else {
    return;
  }
}

export const emitterStopFrequency = 15000;
// Turns up frequency so that it "stops" spawning new particles
// (at lease for a long time), then destroy and cleanup the emitter
export function stopAndDestroyForeverEmitter(emitter?: particles.Emitter) {
  // @ts-ignore flaggedForRemoval custom property
  if (!emitter || emitter.flaggedForRemoval) {
    return;
  }
  // @ts-ignore flaggedForRemoval custom property to make sure emitters aren't removed more
  // than once (and that the timeout isn't set more than once)
  emitter.flaggedForRemoval = true;

  const timeout = emitterStopFrequency;
  emitter.frequency = timeout;
  setTimeout(() => {
    emitter.cleanup();
    emitter.destroy();
  }, timeout - 1000)
}
