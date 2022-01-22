import type { Vec2 } from 'src/commonTypes';
import type { Spell } from '.';
import { MANA_BASE_COST, MANA_MULTIPLIER_SM } from '../config';

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
    manaCost: MANA_BASE_COST,
    manaMultiplier: MANA_MULTIPLIER_SM,
    effect: async (state, dryRun) => {
      let updatedTargets = [...state.targets];
      for (let target of state.targets) {
        // If target is on same vertical
        let targetsOnSameVerticalOrHorizontal: Vec2[] = [];
        if (state.casterUnit.x == target.x) {
          const startY =
            state.casterUnit.y >= target.y
              ? target.y
              : state.casterUnit.y + 1;
          const endY =
            state.casterUnit.y >= target.y ? state.casterUnit.y : target.y;
          for (let y = startY; y < endY; y++) {
            targetsOnSameVerticalOrHorizontal.push({
              x: state.casterUnit.x,
              y,
            });
          }
        }
        // If target is on same horizontal
        if (state.casterUnit.y == target.y) {
          const startX =
            state.casterUnit.x >= target.x
              ? target.x
              : state.casterUnit.x + 1;
          const endX =
            state.casterUnit.x >= target.x ? state.casterUnit.x : target.x;
          for (let x = startX; x < endX; x++) {
            targetsOnSameVerticalOrHorizontal.push({
              x,
              y: state.casterUnit.y,
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

function isOnSameVerticalOrHorizondal(unit: Vec2, coords: Vec2) {
  const isOnSameHorizontal = coords.x === unit.x;
  const isOnSameVertical = coords.y === unit.y;
  return isOnSameHorizontal || isOnSameVertical;
}
