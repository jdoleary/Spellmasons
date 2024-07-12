import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { Spell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

const id = 'Debilitate';
const imageName = 'spellIconDebilitate.png';
const percentDamageIncrease = 100;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    sfx: 'debilitate',
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 3,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconDebilitate.png',
    animationPath: 'spell-effects/spellDebilitate',
    description: ['spell_debilitate', percentDamageIncrease.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive);
      if (targets.length) {
        playDefaultSpellSFX(card, prediction);
        await playDefaultSpellAnimation(card, targets, prediction);
        for (let unit of targets) {
          Unit.addModifier(unit, id, underworld, prediction, 100);
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
  },
  events: {
    onTakeDamage: (unit, amount, _underworld, damageDealer) => {
      const modifier = unit.modifiers[id];
      if (modifier) {
        // Will only increase damage (doesn't affect incoming healing)
        if (amount > 0) {
          // Each quantity = 1% damage boost
          amount = Math.floor(amount * CalcMult(modifier.quantity));
        }
      }

      return amount;
    },
  },
};

function add(unit: Unit.IUnit, _underworld: Underworld, _prediction: boolean, quantity: number = 1) {
  getOrInitModifier(unit, id, { isCurse: true, quantity }, () => {
    Unit.addEvent(unit, id);
  });

  updateTooltip(unit);
}

function updateTooltip(unit: Unit.IUnit) {
  const modifier = unit.modifiers[id];
  if (modifier) {
    // Set tooltip:
    modifier.tooltip = `${CalcMult(modifier.quantity)}x ${i18n('Incoming')} ${i18n('Damage')}`;
  }
}

function CalcMult(quantity: number): number {
  // Each Quantity = 1% damage boost
  return 1 + (quantity / 100);
}
export default spell;
