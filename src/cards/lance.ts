import type { Coords } from 'src/commonTypes';
import type { Spell } from '.';

const id = 'lance';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'lance.png',
    probability: 10,
    description: `
Adds targets towards the initial target if
the initial target is on the same vertical or horizontal axis
as the caster.
    `,
    effect: async (state, dryRun) => {
      let updatedTargets = [...state.targets];
      for (let target of state.targets) {
        // If target is on same vertical
        let targetsOnSameVerticalOrHorizontal: Coords[] = [];
        if (state.caster.unit.x == target.x) {
          const startY =
            state.caster.unit.y >= target.y
              ? target.y
              : state.caster.unit.y + 1;
          const endY =
            state.caster.unit.y >= target.y ? state.caster.unit.y : target.y;
          for (let y = startY; y < endY; y++) {
            targetsOnSameVerticalOrHorizontal.push({
              x: state.caster.unit.x,
              y,
            });
          }
        }
        // If target is on same horizontal
        if (state.caster.unit.y == target.y) {
          const startX =
            state.caster.unit.x >= target.x
              ? target.x
              : state.caster.unit.x + 1;
          const endX =
            state.caster.unit.x >= target.x ? state.caster.unit.x : target.x;
          for (let x = startX; x < endX; x++) {
            targetsOnSameVerticalOrHorizontal.push({
              x,
              y: state.caster.unit.y,
            });
          }
        }
        updatedTargets = updatedTargets.concat(
          targetsOnSameVerticalOrHorizontal,
        );
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

function isOnSameVerticalOrHorizondal(unit: Coords, coords: Coords) {
  const isOnSameHorizontal = coords.x === unit.x;
  const isOnSameVertical = coords.y === unit.y;
  return isOnSameHorizontal || isOnSameVertical;
}
