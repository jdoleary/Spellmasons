import * as Unit from '../Unit';
import type { Spell } from '.';

const spell: Spell = {
  card: {
    id: 'heal',
    thumbnail: 'images/spell/heal.png',
    probability: 20,
    effect: (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
        if (unit) {
          const damage = -1;
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
