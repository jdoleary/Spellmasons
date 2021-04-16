import type { Spell } from '.';

const id = 'chain';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'chain.png',
    probability: 10,
    effect: async (state, dryRun) => {
      let updatedTargets = [...state.targets];
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target);
        if (unit) {
          // Find all units touching the spell origin
          const chained_units = window.game.getTouchingUnitsRecursive(
            target.x,
            target.y,
            updatedTargets,
          );
          updatedTargets = updatedTargets.concat(chained_units);
        }
      }
      // deduplicate
      updatedTargets = updatedTargets.filter((coord, index) => {
        return (
          updatedTargets.findIndex(
            (findCoords) => findCoords.x == coord.x && findCoords.y === coord.y,
          ) === index
        );
      });
      // Update targets
      state.targets = updatedTargets;

      return state;
    },
  },
};
export default spell;
