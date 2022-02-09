import * as Unit from '../Unit';
import type { Spell } from '.';
import { CardType, cardTypeToProbability } from './cardUtils';

const id = 'mana_burn';
const mana_burnt = 8;
const type = CardType.Special;
const spell: Spell = {
  card: {
    id,
    type,
    probability: cardTypeToProbability(type),
    thumbnail: 'mana_burn.png',
    description: `
Burn ${mana_burnt} of the targets' mana, causing the target take damage and lose the mana.
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      let promises = [];
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          const unitManaBurnt = Math.min(unit.mana, mana_burnt);
          unit.mana -= unitManaBurnt;
          promises.push(Unit.takeDamage(unit, unitManaBurnt));
          state.aggregator.damageDealt =
            (state.aggregator.damageDealt || 0) + unitManaBurnt;
        }
      }
      await Promise.all(promises);
      return state;
    },
  },
};
export default spell;
