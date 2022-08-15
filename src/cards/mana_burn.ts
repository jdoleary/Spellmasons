import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellAnimation } from './cardUtils';
import { Spell } from './index';

const id = 'mana_burn';
const mana_burnt = 30;
const health_burn_ratio = .1;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Mana,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'spellIconManaBurn.png',
    animationPath: 'spell-effects/spellManaBurn',
    description: `
Burn up to ${mana_burnt} of the targets' mana, causing the target take ${health_burn_ratio * 10} damage per 10 mana burnt.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      for (let unit of state.targetedUnits) {
        const unitManaBurnt = Math.min(unit.mana, mana_burnt);
        unit.mana -= unitManaBurnt;
        const damage = unitManaBurnt * health_burn_ratio
        await playDefaultSpellAnimation(card, state.targetedUnits, prediction);
        Unit.takeDamage(unit, damage, unit, underworld, prediction, state);
      }
      return state;
    },
  },
};
export default spell;
