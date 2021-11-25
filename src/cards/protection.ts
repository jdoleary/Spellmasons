import type { Spell } from '.';

const id = 'protection';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'protection.png',
    probability: 10,
    description: 'Removes self from existing spell targets.',
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
