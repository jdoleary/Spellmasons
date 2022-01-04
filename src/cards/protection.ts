import type { Spell } from '.';
import { MANA_BASE_COST, MANA_MULTIPLIER_NONE } from '../config';

const id = 'protection';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'protection.png',
    probability: 10,
    description: 'Removes self from existing spell targets.',
    manaCost: MANA_BASE_COST * 10,
    manaMultiplier: MANA_MULTIPLIER_NONE,
    effect: async (state, dryRun) => {
      let updatedTargets = state.targets.filter(
        (coord) =>
          !(coord.x == state.casterUnit.x && coord.y == state.casterUnit.y),
      );
      // Update targets
      state.targets = updatedTargets;

      return state;
    },
  },
};
export default spell;
