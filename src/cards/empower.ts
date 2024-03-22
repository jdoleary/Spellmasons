import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

const empowerId = 'Empower';
const statChange = 5;
const spell: Spell = {
  card: {
    id: empowerId,
    category: CardCategory.Blessings,
    sfx: 'empower',
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconEmpower.png',
    animationPath: 'spell-effects/spellEmpower',
    description: ['spell_empower', (statChange).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        playDefaultSpellSFX(card, prediction);
        //await playDefaultSpellAnimation(card, targets, prediction);
        for (let unit of targets) {
          Unit.addModifier(unit, empowerId, underworld, prediction, quantity);
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
  const modifier = getOrInitModifier(unit, empowerId, { isCurse: false, quantity, }, () => {
    //no first time setup
  });

  unit.damage += statChange * quantity;
}

function remove(unit: Unit.IUnit, underworld: Underworld) {
  const modifier = unit.modifiers[empowerId];
  if (!modifier) {
    console.error(`Missing modifier object for ${empowerId}; cannot remove.  This should never happen`);
    return
  }

  unit.damage -= statChange * modifier.quantity;
}

export default spell;