import * as Unit from '../Unit';
import type { Spell } from '.';
import { CardType, cardTypeToProbability } from './cardUtils';

const id = 'heal';
const healAmount = 3;
const type = CardType.Common;

const spell: Spell = {
  card: {
    id,
    type,
    probability: cardTypeToProbability(type),
    thumbnail: 'heal.png',
    description: `
Heals all targets ${healAmount} HP.
Will not heal beyond maximum health.
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          const damage = -healAmount;
          Unit.takeDamage(unit, damage);
          state.aggregator.damageDealt =
            (state.aggregator.damageDealt || 0) + damage;
        }
      }
      return state;
    },
  },
};
export default spell;
