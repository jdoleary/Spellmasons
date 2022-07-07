import type { Spell } from '.';
import * as Unit from '../Unit';
import * as Pickup from '../Pickup';
import { UnitSubType, UnitType } from '../commonTypes';
import { jitter, Vec2 } from '../Vec';
import * as config from '../config';
import floatingText from '../FloatingText';

const id = 'clone';
const spell: Spell = {
  card: {
    id,
    manaCost: 80,
    healthCost: 0,
    probability: 1,
    expenseScaling: 1,
    thumbnail: 'clone.png',
    description: `
Clones each target
    `,
    effect: async (state, prediction) => {
      // Batch find targets that should be cloned
      // Note: They need to be batched so that the new clones don't get cloned
      const clonePairs: Vec2[][] = [];
      let targets: Vec2[] = [...state.targetedUnits, ...state.targetedPickups];
      targets = targets.length ? targets : [state.castLocation];
      for (let target of targets) {
        clonePairs.push([target, { x: target.x, y: target.y }]);
      }
      // Clone all the batched clone jobs
      for (let [target, cloneSourceCoords] of clonePairs) {
        if (target) {
          const unit = window.underworld.getUnitAt(target, prediction);
          // Since pickups aren't currently considered in prediction predictions just return undefined
          // if this is a prediction or else it will ACTUALLY clone pickups when just making predictions
          // 2022-05-09
          const pickup = prediction ? undefined : window.underworld.getPickupAt(target, prediction);

          // If there is are clone coordinates to clone into
          if (cloneSourceCoords) {
            if (unit) {
              // Jitter prevents multiple clones from spawning on top of each other
              const validSpawnCoords = window.underworld.findValidSpawn(jitter(cloneSourceCoords, config.COLLISION_MESH_RADIUS / 2), 5);
              if (validSpawnCoords) {
                const clone = Unit.load(Unit.serialize(unit), prediction);
                if (!prediction) {
                  // Change id of the clone so that it doesn't share the same
                  // 'supposed-to-be-unique' id of the original
                  clone.id = ++window.underworld.lastUnitId;
                }
                // If the cloned unit is player controlled, make them be controlled by the AI
                if (clone.unitSubType == UnitSubType.PLAYER_CONTROLLED) {
                  clone.unitType = UnitType.AI;
                  clone.unitSubType = UnitSubType.MELEE;
                }
                clone.x = validSpawnCoords.x;
                clone.y = validSpawnCoords.y;
              }
            }
            if (pickup) {
              const validSpawnCoords = window.underworld.findValidSpawn(cloneSourceCoords, 5)
              if (validSpawnCoords) {
                const clone = Pickup.load(pickup);
                Pickup.setPosition(clone, validSpawnCoords.x, validSpawnCoords.y);
              } else {
                floatingText({ coords: cloneSourceCoords, text: 'No space to clone into!' });
              }
            }
          }
        }
      }
      return state;
    },
  },
};
export default spell;
