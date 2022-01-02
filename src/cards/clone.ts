import type { Spell } from '.';
import * as Unit from '../Unit';
import * as Pickup from '../Pickup';
import * as Obstacle from '../Obstacle';
import { Coords, UnitSubType, UnitType } from '../commonTypes';
import { removeSubSprite } from '../Image';
import { COLLISION_MESH_RADIUS } from '../config';

const id = 'clone';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'clone.png',
    probability: 3,
    description: `
Clones each target into an adjecent cell if there is an open adjacent cell
    `,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      // Batch find targets that should be cloned and which empty cell to clone into
      // Note: They need to be batched so that the new clones don't get cloned
      const clonePairs: Coords[][] = [];
      for (let target of state.targets) {
        clonePairs.push([target, { x: target.x + COLLISION_MESH_RADIUS, y: target.y + COLLISION_MESH_RADIUS }]);
      }
      // Clone all the batched clone jobs
      for (let [target, cloneToCoords] of clonePairs) {
        const unit = window.underworld.getUnitAt(target);
        const pickup = window.underworld.getPickupAt(target);
        const obstacle = window.underworld.getObstacleAt(target);

        // If there is an empty cell to clone into
        if (cloneToCoords) {
          if (unit) {
            const clone = Unit.load(unit);
            // If the cloned unit is player controlled, make them be controlled by the AI
            if (clone.unitSubType == UnitSubType.PLAYER_CONTROLLED) {
              clone.unitType = UnitType.AI;
              clone.unitSubType = UnitSubType.AI_melee;
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
