import type { Spell } from '.';
import * as Unit from '../Unit';
import * as Pickup from '../Pickup';
import { UnitSubType, UnitType } from '../commonTypes';
import type { Vec2 } from '../Vec';
import * as config from '../config';
import { removeSubSprite } from '../Image';
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
      const targets = state.targetedUnits.length ? state.targetedUnits : [state.castLocation]
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
          const pickup = prediction ? undefined : window.underworld.getPickupAt(target);

          // If there is are clone coordinates to clone into
          if (cloneSourceCoords) {
            if (unit) {
              const clone = Unit.load(Unit.serialize(unit), prediction);
              // If the cloned unit is player controlled, make them be controlled by the AI
              if (clone.unitSubType == UnitSubType.PLAYER_CONTROLLED) {
                clone.unitType = UnitType.AI;
                clone.unitSubType = UnitSubType.MELEE;
                removeSubSprite(clone.image, 'ownCharacterMarker');
              }
              await Unit.moveTowards(clone, { x: unit.x + config.COLLISION_MESH_RADIUS, y: unit.y });
            }
            if (pickup) {
              const validSpawnCoords = window.underworld.findValidSpawn(cloneSourceCoords)
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
