import { addTarget, getCurrentTargets, Spell } from './index';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import * as Doodad from '../entity/Doodad';
import { CardCategory, UnitSubType, UnitType } from '../types/commonTypes';
import { jitter, Vec2 } from '../jmath/Vec';
import * as config from '../config';
import floatingText from '../graphics/FloatingText';
import { returnToDefaultSprite } from '../entity/Unit';
import { IImageAnimated } from '../graphics/Image';
import { raceTimeout } from '../Promise';
import { CardRarity, probabilityMap } from '../types/commonTypes';

const id = 'clone';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Primary,
    manaCost: 80,
    healthCost: 0,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    expenseScaling: 2,
    thumbnail: 'spellIconClone.png',
    description: `
Clones each target
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      // Batch find targets that should be cloned
      // Note: They need to be batched so that the new clones don't get cloned
      const clonePairs: Vec2[][] = [];
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      for (let target of targets) {
        clonePairs.push([target, { x: target.x, y: target.y }]);
      }
      let animationPromise = Promise.resolve();
      // Animate all the clonings
      for (let [target, cloneSourceCoords] of clonePairs) {
        if (target) {
          animationPromise = animateMitosis((target as any).image);
        }
      }
      if (!prediction) {
        playSFXKey('clone');
      }
      // Note: animationPromise is overwritten over and over because each animateMitosis will take the same amount of time
      // and they are all triggered at once so we only need to wait for one of them.
      await animationPromise;
      // Clone all the batched clone jobs
      for (let [target, cloneSourceCoords] of clonePairs) {
        if (target) {
          // If there is are clone coordinates to clone into
          if (cloneSourceCoords) {
            if (Unit.isUnit(target)) {
              const validSpawnCoords = underworld.findValidSpawn(cloneSourceCoords, 5, 10);
              if (validSpawnCoords) {
                const clone = Unit.load(Unit.serialize(target), underworld, prediction);
                if (!prediction) {
                  // Change id of the clone so that it doesn't share the same
                  // 'supposed-to-be-unique' id of the original
                  clone.id = ++underworld.lastUnitId;
                }
                // If the cloned unit is player controlled, make them be controlled by the AI
                if (clone.unitSubType == UnitSubType.PLAYER_CONTROLLED) {
                  clone.unitType = UnitType.AI;
                  clone.unitSubType = UnitSubType.RANGED_RADIUS;
                  returnToDefaultSprite(clone);
                }
                clone.x = validSpawnCoords.x;
                clone.y = validSpawnCoords.y;
                // Add the clone as a target
                addTarget(clone, state);
              }
            }
            if (Pickup.isPickup(target)) {
              const validSpawnCoords = underworld.findValidSpawn(cloneSourceCoords, 5, 20)
              if (validSpawnCoords) {
                const clone = Pickup.load(target, underworld, prediction);
                if (clone) {
                  Pickup.setPosition(clone, validSpawnCoords.x, validSpawnCoords.y);
                }
              } else {
                floatingText({ coords: cloneSourceCoords, text: 'No space to clone into!' });
              }
            }
            if (Doodad.isDoodad(target)) {
              const validSpawnCoords = underworld.findValidSpawn(cloneSourceCoords, 5, 20)
              if (validSpawnCoords) {
                const clone = Doodad.load(Doodad.serialize(target), underworld, prediction);
                if (clone) {
                  target.x = validSpawnCoords.x;
                  target.y = validSpawnCoords.y;
                }
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
export async function animateMitosis(image?: IImageAnimated) {
  if (!image) {
    return;
  }
  const iterations = 100;
  const millisBetweenIterations = 3;
  const startScaleX = image.sprite.scale.x || 1.0;
  const startScaleY = image.sprite.scale.y || 1.0;
  // "iterations + 10" gives it a little extra time so it doesn't timeout right when the animation would finish on time
  return raceTimeout(millisBetweenIterations * (iterations + 10), 'animatedMitosis', new Promise<void>(resolve => {
    for (let i = 0; i < iterations; i++) {

      setTimeout(() => {
        // Stretch
        if (image) {
          image.sprite.scale.x *= 1.01;
          image.sprite.scale.y -= 0.001;
          if (i >= iterations - 1) {
            resolve();
          }

        }
      }, millisBetweenIterations * i)
    }
  })).then(() => {
    // Restore scale
    image.sprite.scale.x = startScaleX;
    image.sprite.scale.y = startScaleY;
  });
}
export default spell;
