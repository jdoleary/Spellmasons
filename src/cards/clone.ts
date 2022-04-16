import type { Spell } from '.';
import * as Unit from '../Unit';
import * as Pickup from '../Pickup';
import * as Obstacle from '../Obstacle';
import { UnitSubType, UnitType } from '../commonTypes';
import type { Vec2 } from '../Vec';
import { removeSubSprite } from '../Image';
import { COLLISION_MESH_RADIUS } from '../config';

const id = 'clone';
const spell: Spell = {
  card: {
    id,
    manaCost: 80,
    healthCost: 0,
    probability: 1,
    thumbnail: 'clone.png',
    description: `
Clones each target
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      // Batch find targets that should be cloned
      // Note: They need to be batched so that the new clones don't get cloned
      const clonePairs: Vec2[][] = [];
      for (let unit of state.targetedUnits) {
        clonePairs.push([unit, { x: unit.x + COLLISION_MESH_RADIUS, y: unit.y + COLLISION_MESH_RADIUS }]);
      }
      // Clone all the batched clone jobs
      for (let [target, cloneToCoords] of clonePairs) {
        const unit = window.underworld.getUnitAt(target);
        const pickup = window.underworld.getPickupAt(target);
        const obstacle = window.underworld.getObstacleAt(target);

        // If there is are clone coordinates to clone into
        if (cloneToCoords) {
          if (unit) {
            const clone = Unit.load(unit);
            // If the cloned unit is player controlled, make them be controlled by the AI
            if (clone.unitSubType == UnitSubType.PLAYER_CONTROLLED) {
              clone.unitType = UnitType.AI;
              clone.unitSubType = UnitSubType.GOON;
              removeSubSprite(clone.image, 'ownCharacterMarker');
            }
            Unit.setLocation(clone, cloneToCoords);
          }
          if (pickup) {
            const clone = Pickup.load(pickup);
            Pickup.setPosition(clone, cloneToCoords.x, cloneToCoords.y);
          }
          if (obstacle) {
            const targetObstacle = { ...obstacle, ...cloneToCoords };
            Obstacle.load(targetObstacle);
          }
        }
      }
      return state;
    },
  },
};
export default spell;
