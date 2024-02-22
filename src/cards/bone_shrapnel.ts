import * as particles from '@pixi/particle-emitter'
import { takeDamage } from '../entity/Unit';
import * as Unit from '../entity/Unit';
import { Spell } from './index';
import { drawUICirclePrediction } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import { createParticleTexture, logNoTextureWarning, simpleEmitter } from '../graphics/Particles';
import { Vec2 } from '../jmath/Vec';
import * as colors from '../graphics/ui/colors';
import { CardRarity, probabilityMap } from '../types/commonTypes';

export const boneShrapnelCardId = 'Bone Shrapnel';
const damage = 30;
const baseRadius = 140;

const spell: Spell = {
  card: {
    id: boneShrapnelCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconCorpseExplosion.png',
    description: `When cast on a corpse, the corpse will explode damaging units around it by ${damage}. Stackable to increase explosion damage.`,
    effect: async (state, card, quantity, underworld, prediction) => {
      // Only explode corpses at time of cast
      const targetedUnits = state.targetedUnits.filter(u => !u.alive);
      targetedUnits.forEach(unit => {
        const adjustedRadius = baseRadius + (unit.modifiers[boneShrapnelCardId]?.radius || 0);
        if (prediction) {
          drawUICirclePrediction(unit, adjustedRadius, colors.healthRed, 'Explosion Radius');
        } else {
          playSFXKey('bloatExplosion');
        }
        makeShrapnelParticles(unit, adjustedRadius / baseRadius, prediction);
        underworld.getUnitsWithinDistanceOfTarget(
          unit,
          adjustedRadius,
          prediction
        ).forEach(u => {
          // Deal damage to units
          takeDamage(u, damage * quantity, u, underworld, prediction);
        });

        // Remove corpse
        // Note: This must be called after all other explode logic or else it will affect the position
        // of the explosion
        Unit.cleanup(unit, true);
      });
      return state;
    },
  },
  modifiers: {
  },
  events: {
  }
};
function makeShrapnelParticles(position: Vec2, size: number, prediction: boolean) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeCorpseExplosion');
    return;
  }
  const config = {
    autoUpdate: true,
    "alpha": {
      "start": 1,
      "end": 0.5
    },
    "scale": {
      "start": 0.5,
      "end": 0.5,
      "minimumScaleMultiplier": 1
    },
    "color": {
      "start": "#707070",
      "end": "#c2c2c2"
    },
    "speed": {
      "start": 600,
      "end": 600,
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
      "min": 50,
      "max": 50
    },
    "lifetime": {
      "min": 0.2,
      "max": 0.2
    },
    "blendMode": "normal",
    "frequency": 0.001,
    "emitterLifetime": 0.1,
    "maxParticles": 50,
    "pos": {
      "x": 0,
      "y": 0
    },
    "addAtBack": true,
    "spawnType": "point"
  }
  const scalar = Math.sqrt(size);
  config.speed.start *= scalar;
  config.speed.end *= scalar;
  config.lifetime.min *= scalar;
  config.lifetime.max *= scalar;
  simpleEmitter(position, particles.upgradeConfig(config, [texture]));
}

export default spell;
