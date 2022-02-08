import * as Unit from '../Unit';
import type { Spell } from '.';
import { CardType, cardTypeToProbability } from './cardUtils';

const id = 'damage';
const damageDone = 3;
const type = CardType.Common;
const spell: Spell = {
  card: {
    id,
    type,
    probability: cardTypeToProbability(type),
    thumbnail: 'damage.png',
    description: `
Deals ${damageDone} damage to all targets.    
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      let promises = [];
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          promises.push(Unit.takeDamage(unit, damageDone));
          state.aggregator.damageDealt =
            (state.aggregator.damageDealt || 0) + damageDone;
        }
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
