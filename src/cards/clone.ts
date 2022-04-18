import type { Spell } from '.';
import * as Unit from '../Unit';
import * as Pickup from '../Pickup';
import { UnitSubType, UnitType } from '../commonTypes';
import type { Vec2 } from '../Vec';
import { removeSubSprite } from '../Image';
import floatingText from '../FloatingText';

const id = 'clone';
const spell: Spell = {
  card: {
    id,
    manaCost: 0,
    healthCost: 0,
    probability: 1,
    expenseScaling: 1,
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
        clonePairs.push([unit, { x: unit.x, y: unit.y }]);
      }
      // Clone all the batched clone jobs
      for (let [target, cloneSourceCoords] of clonePairs) {
        const unit = window.underworld.getUnitAt(target);
        const pickup = window.underworld.getPickupAt(target);

        // If there is are clone coordinates to clone into
        if (cloneSourceCoords) {
          const validSpawnCoords = window.underworld.findValidSpawn(cloneSourceCoords, 3)
          if (validSpawnCoords) {
            if (unit) {
              const clone = Unit.load(unit);
              // If the cloned unit is player controlled, make them be controlled by the AI
              if (clone.unitSubType == UnitSubType.PLAYER_CONTROLLED) {
                clone.unitType = UnitType.AI;
                clone.unitSubType = UnitSubType.GOON;
                removeSubSprite(clone.image, 'ownCharacterMarker');
              }
              Unit.setLocation(clone, validSpawnCoords);
            }
            if (pickup) {
              const clone = Pickup.load(pickup);
              Pickup.setPosition(clone, validSpawnCoords.x, validSpawnCoords.y);
            }
          } else {
            floatingText({ coords: cloneSourceCoords, text: 'No space to clone into!' });
          }
        }
      }
      return state;
    },
  },
};
export default spell;
