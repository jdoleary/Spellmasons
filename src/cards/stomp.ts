import type { Spell } from '.';

const id = 'stomp';
const range = 200;
const spell: Spell = {
  card: {
    id,
    thumbnail: 'stomp.png',
    probability: 10,
    description: 'Targets all the spaces directly around you',
    effect: async (state, dryRun) => {
      let withinRadius = window.underworld.getCoordsForUnitsWithinDistanceOfTarget(
        state.casterUnit,
        range,
      );
      // Remove self from radius (for the new targets of this spell only, not from existing targets)
      withinRadius = withinRadius.filter(
        (coord) =>
          !(coord.x == state.casterUnit.x && coord.y == state.casterUnit.y),
      );
      let updatedTargets = [...state.targets, ...withinRadius];
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
