import type { Spell } from '.';

const id = 'stomp';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'stomp.png',
    probability: 10,
    effect: async (state, dryRun) => {
      const withinRadius = window.game.getCoordsWithinDistanceOfTarget(
        state.caster.unit.x,
        state.caster.unit.y,
        1,
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
      // Remove self from target
      updatedTargets = updatedTargets.filter(
        (coord) =>
          !(coord.x == state.caster.unit.x && coord.y == state.caster.unit.y),
      );

      // Update targets
      state.targets = updatedTargets;

      return state;
    },
  },
};
export default spell;
