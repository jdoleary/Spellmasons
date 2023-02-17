import * as particles from '@pixi/particle-emitter'
import { IUnit, takeDamage } from '../entity/Unit';
import * as Unit from '../entity/Unit';
import { Spell } from './index';
import { drawUICircle } from '../graphics/PlanningView';
import { forcePush, velocityStartMagnitude } from './push';
import type Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { createParticleTexture, logNoTextureWarning, simpleEmitter } from '../graphics/Particles';
import { Vec2 } from '../jmath/Vec';
import * as colors from '../graphics/ui/colors';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import { makeBloatExplosionWithParticles } from '../graphics/ParticleCollection';

const id = 'Bloat';
const imageName = 'explode-on-death.png';
const damage = 40;
const baseRadius = 140;
function add(unit: IUnit, underworld: Underworld, prediction: boolean, quantity: number, extra?: any) {
  const modifier = getOrInitModifier(unit, id, {
    isCurse: true, quantity, persistBetweenLevels: false,
    originalStats: {
      scaleX: unit.image && unit.image.sprite.scale.x || 1,
      scaleY: unit.image && unit.image.sprite.scale.y || 1,
    }
  }, () => {
    // Add event
    if (!unit.onDeathEvents.includes(id)) {
      unit.onDeathEvents.push(id);
    }
    // Add subsprite image
    if (unit.image) {
      // Visually "bloat" the image
      unit.image.sprite.scale.x *= 1.5;
    }
  });
  if (!modifier.radius) {
    modifier.radius = 0;
  }
  modifier.radius = extra && extra.radius || 0;

}
function remove(unit: IUnit, underworld: Underworld) {
  if (unit.modifiers && unit.modifiers[id] && unit.image) {
    // Safely restore unit's original properties
    const { scaleX, scaleY } = unit.modifiers[id].originalStats;
    if (unit.image) {
      unit.image.sprite.scale.x = scaleX;
      unit.image.sprite.scale.y = scaleY;
    }
  }
}

const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconBloat.png',
    description: ['spell_bloat', id, damage.toString(), id],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      for (let unit of state.targetedUnits.filter(u => u.alive)) {
        Unit.addModifier(unit, id, underworld, prediction, quantity, { radius: state.aggregator.radius });
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
    subsprite: {
      imageName,
      alpha: 1.0,
      anchor: {
        x: 0,
        y: 0,
      },
      scale: {
        x: 0.5,
        y: 0.5,
      },
    },
  },
  events: {
    onDeath: async (unit: IUnit, underworld: Underworld, prediction: boolean) => {
      const quantity = unit.modifiers[id]?.quantity || 1;
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
      })
    }
  }
};
export default spell;
