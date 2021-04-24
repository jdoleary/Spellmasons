import type { Spell } from '.';

const id = 'AOE';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'aoe.png',
    probability: 20,
    description: `
Adds targets for the following cards to effect by "growing" existing targets
by 1 grid cell in each direction.
    `,
    effect: async (state, dryRun) => {
      let updatedTargets = [...state.targets];
      for (let target of state.targets) {
        const withinRadius = window.underworld.getCoordsWithinDistanceOfTarget(
          target.x,
          target.y,
          1,
        );
        updatedTargets = updatedTargets.concat(withinRadius);
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
