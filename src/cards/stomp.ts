import { refundLastSpell, Spell } from './index';
import { distance } from '../jmath/math';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import * as config from '../config';
import { drawUICirclePrediction } from '../graphics/PlanningView';
import * as colors from '../graphics/ui/colors';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { forcePushAwayFrom, forcePushTowards } from '../effects/force_move';
import { Vec2 } from '../jmath/Vec';
import Underworld from '../Underworld';
import { IUnit, takeDamage } from '../entity/Unit';
import { makeParticleExplosion } from '../graphics/ParticleCollection';
import { createParticleTexture, logNoTextureWarning, simpleEmitter } from '../graphics/Particles';
import * as particles from '@pixi/particle-emitter'
import { baseExplosionRadius } from '../effects/explode';

export const stompCardId = 'stomp';
const stompMoveDistance = 100;
const stompRadius = 100;
const stompDamage = 20;
const spell: Spell = {
  card: {
    id: stompCardId,
    category: CardCategory.Movement,
    supportQuantity: true,
    allowNonUnitTarget: true,
    ignoreRange: true,
    sfx: 'stomp',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconStomp.png',
    description: 'spell_stomp',
    effect: async (state, card, quantity, underworld, prediction) => {
      const target = state.castLocation;

      if (target) {
        const moveDistance = Math.min(distance(state.casterUnit, target), stompMoveDistance * quantity)
        await forcePushTowards(state.casterUnit, target, moveDistance, underworld, prediction);

        const delayBetweenStomps = 400; //ms
        const radius = stompRadius * (1 + (0.25 * state.aggregator.radiusBoost));
        for (let i = 1; i <= quantity; i++) {
          if (prediction) {
            drawUICirclePrediction(state.casterUnit, radius, colors.errorRed, 'Stomp Radius');
          } else if (!globalThis.headless) {
            if (i < quantity) {
              // Play stomp particles
              makeStompExplodeParticles2(state.casterUnit, radius, false, prediction);
            } else {
              // For final stomp, play implosion and then big stomp particles
              makeStompWindupParticles(state.casterUnit, prediction);
              await new Promise(resolve => setTimeout(resolve, delayBetweenStomps));
              makeStompExplodeParticles2(state.casterUnit, radius, true, prediction);
            }
            playSFXKey('bloatExplosion');
          }

          if (i < quantity) {
            // Early Stomp - does not push
            stompExplode(state.casterUnit, radius, stompDamage, 0, underworld, prediction);
          } else {
            // Final Stomp - Does pushback = base stomp radius
            stompExplode(state.casterUnit, radius, stompDamage, stompRadius, underworld, prediction);
          }

          if (!prediction && !globalThis.headless) {
            // Await some delay before the next stomp
            await new Promise(resolve => setTimeout(resolve, delayBetweenStomps));
          }
          await underworld.awaitForceMoves(prediction);
        }
      }

      return state;
    },
  },
};

// Damages and pushes away nearby enemies
async function stompExplode(caster: IUnit, radius: number, damage: number, pushDistance: number, underworld: Underworld, prediction: boolean) {
  const units = underworld.getUnitsWithinDistanceOfTarget(caster, radius, prediction).filter(u => u.id != caster.id);

  units.forEach(u => {
    // Deal damage to units
    takeDamage(u, damage, u, underworld, prediction);
  });

  if (pushDistance > 0) {
    units.forEach(u => {
      // Push units away from exploding location
      forcePushAwayFrom(u, caster, pushDistance, underworld, prediction);
    })

    underworld.getPickupsWithinDistanceOfTarget(caster, radius, prediction)
      .forEach(p => {
        // Push pickups away
        forcePushAwayFrom(p, caster, pushDistance, underworld, prediction);
      })
  }
}

// Temporary particles for Stomp implementation
function makeStompExplodeParticles2(position: Vec2, radius: number, big: boolean, prediction: boolean) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }

  const explosionSize = radius / baseExplosionRadius * (big ? 1 : 0.7);
  makeParticleExplosion(position, explosionSize, colors.trueGrey, colors.trueWhite, prediction)
}

function makeStompExplodeParticles(position: Vec2, radius: number, big: boolean, prediction: boolean) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeStompParticleExplosion');
    return;
  }
  const config = {
    "alpha": {
      "start": 1,
      "end": 0.1
    },
    "scale": {
      "start": 2,
      "end": 1.5,
      "minimumScaleMultiplier": 0.01
    },
    "color": {
      "start": "#634d42",
      "end": "#26221f"
    },
    "speed": {
      "start": 800,
      "end": 0,
      "minimumSpeedMultiplier": 0.5
    },
    "acceleration": {
      "x": 0,
      "y": 3000
    },
    "maxSpeed": 1000,
    "startRotation": {
      "min": -110,
      "max": -70
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
    "frequency": 0.001,
    "emitterLifetime": 0.1,
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
      "r": 80
    }
  };
  if (big) {
    config.scale.start *= 2;
    config.scale.end *= 2;
    config.speed.start *= 1.5;
    config.lifetime.min *= 1.2;
    config.lifetime.max *= 1.2;
    config.spawnCircle.r *= 1.2;
  }
  simpleEmitter(position, particles.upgradeConfig(config, [texture]));
}

function makeStompWindupParticles(position: Vec2, prediction: boolean) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeStompParticleWindup');
    return;
  }
  const config = {
    "alpha": {
      "start": 0.8,
      "end": 0.1
    },
    "scale": {
      "start": 1.5,
      "end": 1,
      "minimumScaleMultiplier": 0.01
    },
    "color": {
      "start": "#634d42",
      "end": "#26221f"
    },
    "speed": {
      "start": 200,
      "end": 0,
      "minimumSpeedMultiplier": 0.5
    },
    "acceleration": {
      "x": 0,
      "y": 100
    },
    "maxSpeed": 0,
    "startRotation": {
      "min": 175,
      "max": 185
    },
    "noRotation": false,
    "rotationSpeed": {
      "min": 0,
      "max": 0
    },
    "lifetime": {
      "min": 0.2,
      "max": 0.4
    },
    "blendMode": "normal",
    "frequency": 0.002,
    "emitterLifetime": 0.5,
    "maxParticles": 500,
    "pos": {
      "x": 0,
      "y": 16
    },
    "addAtBack": false,
    "spawnType": "ring",
    "spawnCircle": {
      "x": 0,
      "y": 0,
      "r": 80,
      "minR": 32
    }
  };
  simpleEmitter(position, particles.upgradeConfig(config, [texture]));
}

export default spell;
