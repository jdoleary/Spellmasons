import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { Spell } from './index';

const id = 'heal';
const healAmount = 3;

const spell: Spell = {
  card: {
    id,
    category: CardCategory.Primary,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'heal.png',
    animationPath: 'spell-effects/potionPickup',
    description: `
Heals all targets ${healAmount} HP.
Will not heal beyond maximum health.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      for (let unit of state.targetedUnits) {
        const damage = -healAmount;
        Unit.takeDamage(unit, damage, underworld, prediction, state);
      }
      return state;
    },
  },
};
export default spell;
