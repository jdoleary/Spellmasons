import * as Unit from '../Unit';
import type { Spell } from '.';
import floatingText from '../FloatingText';
import { findPath, pointsEveryXDistanceAlongPath } from '../Pathfinding';
import { isOutOfBounds } from '../ui/PlanningView';
import * as math from '../math';
import * as config from '../config';

const id = 'walk';
const spell: Spell = {
  card: {
    id,
    manaCost: 0,
    healthCost: 0,
    probability: 100,
    thumbnail: 'walk.png',
    description: `
Wizards walk one foot in front of the other just like the rest of us.    
    `,
    effect: async (state, dryRun) => {
      const originalTarget = state.targets[0]
      if (dryRun) {
        if (isOutOfBounds(originalTarget)) {
          // Don't show walk path if target is out of bounds
          return state;
        }
        // Show walk path:
        window.dryRunGraphics.clear();
        if (window.player) {
          // const originalTarget = window.underworld.getMousePos();
          const currentPlayerPath = findPath(window.player.unit, originalTarget, window.underworld.pathingPolygons);
          if (currentPlayerPath.length) {
            window.dryRunGraphics.lineStyle(4, 0xffffff, 1.0);
            // firstPoint in path is essentially the player units exact locaiton, but for the
            // dryRunGraphics, it should be a little beyond the player just for aesthetics
            const firstPointInPath = math.getCoordsAtDistanceTowardsTarget(window.player.unit, currentPlayerPath[0], config.COLLISION_MESH_RADIUS);
            window.dryRunGraphics.moveTo(firstPointInPath.x, firstPointInPath.y);
            for (let point of currentPlayerPath) {
              window.dryRunGraphics.lineTo(point.x, point.y);
            }
            const turnStopPoints = pointsEveryXDistanceAlongPath(window.player.unit, currentPlayerPath, window.player.unit.moveDistance);
            for (let point of turnStopPoints) {
              window.dryRunGraphics.drawCircle(point.x, point.y, 3);
            }
            // Always draw a stop circle at the end
            const lastPointInPath = currentPlayerPath[currentPlayerPath.length - 1]
            window.dryRunGraphics.drawCircle(lastPointInPath.x, lastPointInPath.y, 3);
          }
        }

        return state;
      }
      window.dryRunGraphics.clear();
      if (!state.casterUnit.thisTurnMoved) {
        const movePromise = Unit.moveTowards(state.casterUnit, originalTarget);
        if (state.casterPlayer == window.player) {
          window.playerWalkingPromise = movePromise;
        }
        await movePromise;
      } else {
        const elEndTurnBtn = document.querySelector('#end-turn-btn');
        // Remove then add 'shakeFy' class to the end turn button
        // it will restart the animation to grab the user's attention.
        if (elEndTurnBtn) {
          elEndTurnBtn.classList.remove('shake');
          setTimeout(() => {
            elEndTurnBtn.classList.add('shake');
          }, 10);

        }

      }
      return state;
    },
  },
};
export default spell;
