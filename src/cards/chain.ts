import type { Spell } from '.';

const spell: Spell = {
  card: {
    id: 'chain',
    thumbnail: 'images/spell/chain.png',
    probability: 10,
    effect: (state) => {
      let updatedTargets = [...state.targets];
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
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
