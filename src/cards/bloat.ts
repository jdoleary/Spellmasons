import { IUnit } from '../entity/Unit';
import * as Unit from '../entity/Unit';
import { Spell } from './index';
import { drawUICircle } from '../graphics/PlanningView';
import type Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import * as colors from '../graphics/ui/colors';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import { baseExplosionRadius, explode } from '../effects/explode';
import { defaultPushDistance } from '../effects/force_move';

const id = 'Bloat';
const imageName = 'explode-on-death.png';
const damage = 40;
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
  if (!modifier.radiusBoost) {
    modifier.radiusBoost = 0;
  }
  modifier.radiusBoost += extra && extra.radiusBoost || 0;
  modifier.sourceUnitId = extra.sourceUnitId;
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
        Unit.addModifier(unit, id, underworld, prediction, quantity, { radiusBoost: state.aggregator.radiusBoost, sourceUnitId: state.casterUnit.id });
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
      const modifier = unit.modifiers[id];
      if (!modifier) {
        console.error(`Should have ${id} modifier on unit but it is missing`);
        return;
      }

      const quantity = modifier.quantity || 1;
      const radiusBoost = modifier.radiusBoost;
      const sourceUnit = underworld.getUnitById(modifier.sourceUnitId, prediction);
      const adjustedRadius = getAdjustedRadius(radiusBoost);
      explode(unit, adjustedRadius, damage * quantity, getAdjustedPushDist(radiusBoost),
        sourceUnit,
        underworld, prediction,
        colors.bloatExplodeStart, colors.bloatExplodeEnd);
    },
    onDrawSelected: async (unit: IUnit, underworld: Underworld, prediction: boolean) => {
      if (globalThis.selectedUnitGraphics) {
        const radiusBoost = unit.modifiers[id]?.radiusBoost;
        const adjustedRadius = getAdjustedRadius(radiusBoost);
        drawUICircle(globalThis.selectedUnitGraphics, unit, adjustedRadius, colors.healthRed, 'Explosion Radius');
      }
    }
  }
};
function getAdjustedRadius(radiusBoost: number = 0) {
  // +50% radius per radius boost
  return baseExplosionRadius * (1 + (0.5 * radiusBoost));
}
function getAdjustedPushDist(radiusBoost: number = 0) {
  // +25% push distance per radius boost
  return defaultPushDistance * (1 + (0.25 * radiusBoost));
}
export default spell;
