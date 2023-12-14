import * as particles from '@pixi/particle-emitter'
import { IUnit, takeDamage } from '../entity/Unit';
import * as Unit from '../entity/Unit';
import { Spell } from './index';
import { drawUICircle, drawUICirclePrediction } from '../graphics/PlanningView';
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
export const baseRadius = 140;
function add(unit: IUnit, underworld: Underworld, prediction: boolean, quantity: number, extra?: any) {
  const modifier = getOrInitModifier(unit, id, {
    isCurse: true, quantity,
    originalStats: {
      scaleX: unit.image && unit.image.sprite.scale.x || 1,
      scaleY: unit.image && unit.image.sprite.scale.y || 1,
    }
  }, () => {
    // Add event
    if (!unit.onDeathEvents.includes(id)) {
      unit.onDeathEvents.push(id);
    }
    // Add event
    if (!unit.onDrawSelectedEvents.includes(id)) {
      unit.onDrawSelectedEvents.push(id);
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
      explode(unit, adjustedRadius, damage * quantity, prediction, underworld);
    },
    onDrawSelected: async (unit: IUnit, prediction: boolean, underworld: Underworld) => {
      if (globalThis.selectedUnitGraphics) {
        const adjustedRadius = baseRadius + (unit.modifiers[id]?.radius || 0);
        drawUICircle(globalThis.selectedUnitGraphics, unit, adjustedRadius, colors.healthRed, 'Explosion Radius');
      }
    }
  }
};
export function explode(location: Vec2, radius: number, damage: number, prediction: boolean, underworld: Underworld) {
  if (prediction) {
    drawUICirclePrediction(location, radius, colors.healthRed, 'Explosion Radius');
  } else {
    playSFXKey('bloatExplosion');
  }
  makeBloatExplosionWithParticles(location, radius / baseRadius, prediction);
  underworld.getUnitsWithinDistanceOfTarget(
    location,
    radius,
    prediction
  ).forEach(u => {
    // Deal damage to units
    takeDamage(u, damage, u, underworld, prediction);
    // Push units away from exploding location
    forcePush(u, location, velocityStartMagnitude, underworld, prediction);
  });
  underworld.getPickupsWithinDistanceOfTarget(
    location,
    radius,
    prediction
  ).forEach(p => {
    // Push pickups away
    forcePush(p, location, velocityStartMagnitude, underworld, prediction);
  })
}

export default spell;
