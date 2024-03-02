import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

const soulBindId = 'Soul Bind';
const spell: Spell = {
  card: {
    id: soulBindId,
    category: CardCategory.Curses,
    sfx: 'debilitate',
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconSoulBind.png',
    animationPath: 'spell-effects/spellDebilitate',
    description: ['spell_soul_bind'],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        playDefaultSpellSFX(card, prediction);
        await playDefaultSpellAnimation(card, targets, prediction);
        for (let unit of targets) {
          Unit.addModifier(unit, soulBindId, underworld, prediction, quantity);
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
  },
  events: {
    onDamage: (unit, amount, underworld, prediction) => {
      // Split the amount among all soul bound units
      // To avoid creating an infinite loop here, we may have to temporarily disable the event for all units

      let units = prediction ? underworld.unitsPrediction : underworld.units;

      units = units.filter(u => !!u.modifiers[soulBindId] && u.alive && !u.flaggedForRemoval);

      for (let i = 0; i < units.length; i++) {
        const unit = units[i];
        if (unit) {
          const index = unit.onDamageEvents.findIndex(e => e == soulBindId);
          // Remove Soul Bind damage event to prevent infinite loop
          unit.onDamageEvents.splice(index, 1);
          // Deal damage to unit
          Unit.takeDamage(unit, Math.ceil(amount / units.length), undefined, underworld, prediction, undefined)
          // Return Soul Bind damage event
          unit.onDamageEvents.splice(index, 0, soulBindId)
        }
      }

      return 0;
    },
  },
};

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, soulBindId, { isCurse: true, quantity }, () => {
    unit.onDamageEvents.push(soulBindId);
  });
}
export default spell;
