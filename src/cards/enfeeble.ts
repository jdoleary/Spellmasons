import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

const enfeebleId = 'Enfeeble';
const statChange = -5;
const spell: Spell = {
  card: {
    id: enfeebleId,
    category: CardCategory.Curses,
    sfx: 'enfeeble',
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconEnfeeble.png',
    animationPath: 'spell-effects/spellEnfeeble',
    description: ['spell_enfeeble', (statChange).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        playDefaultSpellSFX(card, prediction);
        //await playDefaultSpellAnimation(card, targets, prediction);
        for (let unit of targets) {
          Unit.addModifier(unit, enfeebleId, underworld, prediction, quantity);
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
  },
};

function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) {
  const modifier = getOrInitModifier(unit, enfeebleId, { isCurse: true, quantity, }, () => {
    //no first time setup
  });

  unit.damage += statChange * quantity;

  // Ensure damage doesn't go below 0
  unit.damage = Math.max(unit.damage, 0);
}

function remove(unit: Unit.IUnit, underworld: Underworld) {
  const modifier = unit.modifiers[enfeebleId];
  if (!modifier) {
    console.error(`Missing modifier object for ${enfeebleId}; cannot remove.  This should never happen`);
    return
  }

  unit.damage -= statChange * modifier.quantity;
}

export default spell;