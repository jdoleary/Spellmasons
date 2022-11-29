import * as particles from '@pixi/particle-emitter'
import { takeDamage } from '../entity/Unit';
import * as Unit from '../entity/Unit';
import { Spell } from './index';
import { drawUICircle } from '../graphics/PlanningView';
import { forcePush, velocityStartMagnitude } from './push';
import { CardCategory } from '../types/commonTypes';
import { createParticleTexture, simpleEmitter } from '../graphics/Particles';
import { Vec2 } from '../jmath/Vec';
import * as colors from '../graphics/ui/colors';
import { CardRarity, probabilityMap } from '../types/commonTypes';

const id = 'Corpse Explosion';
const damage = 3;
const baseRadius = 140;

const spell: Spell = {
  card: {
    id,
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconCorpseExplosion.png',
    description: `When cast on a corpse, the corpse will explode damaging units around it by ${damage}. Stackable to increase explosion damage.`,
    effect: async (state, card, quantity, underworld, prediction) => {
      state.targetedUnits.forEach(unit => {
        if (unit.alive) {
          // Only explode corpses.
          return;
        }

        const adjustedRadius = baseRadius + (unit.modifiers[id]?.radius || 0);
        if (prediction) {
          drawUICircle(unit, adjustedRadius, colors.healthRed, 'Explosion Radius');
        } else {
          playSFXKey('bloatExplosion');
        }
        makeBloatExplosionWithParticles(unit, adjustedRadius / baseRadius, prediction);
        underworld.getUnitsWithinDistanceOfTarget(
          unit,
          adjustedRadius,
          prediction
        ).forEach(u => {
          // Deal damage to units
          takeDamage(u, damage * quantity, u, underworld, prediction);
          // Push units away from exploding unit
          forcePush(u, unit, velocityStartMagnitude, underworld, prediction);
        });
        underworld.getPickupsWithinDistanceOfTarget(
          unit,
          adjustedRadius,
          prediction
        ).forEach(p => {
          // Push pickups away
          forcePush(p, unit, velocityStartMagnitude, underworld, prediction);
        });

        // Remove corpse
        // Note: This must be called after all other explode logic or else it will affect the position
        // of the explosion
        Unit.cleanup(unit);
      });
      return state;
    },
  },
  modifiers: {
  },
  events: {
  }
};
function makeBloatExplosionWithParticles(position: Vec2, size: number, prediction: boolean) {
  if (prediction) {
    // Don't show if just a prediction
    return
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
      "maxParticles": 2000,
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
export default spell;
