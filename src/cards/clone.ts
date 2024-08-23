import { addTarget, EffectFn, EffectState, getCurrentTargets, ICard, refundLastSpell, Spell } from './index';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { CardCategory, UnitType } from '../types/commonTypes';
import { Vec2 } from '../jmath/Vec';
import floatingText from '../graphics/FloatingText';
import { returnToDefaultSprite } from '../entity/Unit';
import { IImageAnimated } from '../graphics/Image';
import { raceTimeout } from '../Promise';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import Underworld from '../Underworld';
import seedrandom from 'seedrandom';
import { getUniqueSeedString } from '../jmath/rand';
import * as config from '../config';
import { soulShardOwnerModifierId } from '../modifierSoulShardOwner';

export const clone_id = 'clone';
const spell: Spell = {
  card: {
    id: clone_id,
    category: CardCategory.Soul,
    manaCost: 80,
    healthCost: 0,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    expenseScaling: 4,
    supportQuantity: true,
    thumbnail: 'spellIconClone.png',
    description: 'spell_clone',
    effect: cloneEffect(false)
  },
};
export function cloneEffect(addClonesToTargetArray: boolean): EffectFn {
  return async (state: EffectState, _card: ICard, quantity: number, underworld: Underworld, prediction: boolean) => {
    // Batch find targets that should be cloned
    // Note: They need to be batched so that the new clones don't get cloned
    // Note: Limit max quantity to 10 or else is spawns so many units that it breaks the game
    for (let q = 0; q < Math.min(10, quantity); q++) {
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
      await raceTimeout(600, 'clone', animationPromise);
      // Clone all the batched clone jobs
      for (let [target, cloneSourceCoords] of clonePairs) {
        if (target) {
          // If there is are clone coordinates to clone into
          if (cloneSourceCoords) {
            if (Unit.isUnit(target)) {
              const clone = doCloneUnit(target, underworld, prediction, cloneSourceCoords);
              // This is super powerful as it allows for exponential clones
              if (clone && addClonesToTargetArray) {
                // Add clones to target list
                addTarget(clone, state, underworld, prediction);
              }
            } else if (Pickup.isPickup(target)) {
              const targetName = target.name;
              const seed = seedrandom(`${getUniqueSeedString(underworld)}-${target.id}`);
              const validSpawnCoords = underworld.findValidSpawnInRadius(target, prediction, seed, { allowLiquid: target.inLiquid, maxRadius: config.COLLISION_MESH_RADIUS });
              if (validSpawnCoords) {
                let foundPickup = Pickup.pickups.find((p) => p.name == targetName);
                if (foundPickup) {
                  const clone = Pickup.create({ pos: target, pickupSource: foundPickup, logSource: 'Clone' }, underworld, prediction);
                  if (clone) {
                    Pickup.setPosition(clone, validSpawnCoords.x, validSpawnCoords.y);
                    Pickup.setPower(clone, target.power);
                    // Add clones to target list
                    addTarget(clone, state, underworld, prediction);
                  }
                } else {
                  console.log('Pickup', target);
                  console.error('Could not clone pickup because source could not be found');
                }
              } else {
                floatingText({ coords: cloneSourceCoords, text: 'No space to clone into!' });
              }
            }
          }
        }
      }
      if (clonePairs.length == 0) {
        refundLastSpell(state, prediction, 'no target, mana refunded')
      }
    }
    return state;
  }
}
export function doCloneUnit(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, spawnSource?: Vec2): Unit.IUnit | undefined {
  const seed = seedrandom(`${getUniqueSeedString(underworld)}-${unit.id}`);
  const validSpawnCoords = underworld.findValidSpawnInRadius(unit, prediction, seed, { allowLiquid: unit.inLiquid });
  if (validSpawnCoords) {
    const clone = Unit.load(Unit.serialize(unit), underworld, prediction);
    if (!prediction) {
      // Change id of the clone so that it doesn't share the same
      // 'supposed-to-be-unique' id of the original
      clone.id = ++underworld.lastUnitId;
    } else {
      // Get a unique id for the clone
      clone.id = underworld.unitsPrediction.reduce((lastId, unit) => {
        if (unit.id > lastId) {
          return unit.id;
        }
        return lastId;
      }, 0) + 1;
    }
    // If the cloned unit is player controlled, make them be controlled by the AI
    if (clone.unitType == UnitType.PLAYER_CONTROLLED) {
      clone.unitType = UnitType.AI;
      returnToDefaultSprite(clone);
    }
    clone.x = validSpawnCoords.x;
    clone.y = validSpawnCoords.y;
    // // If cloned unit is a player unit, set the mana to be
    // // the value of the mana AFTER the player casts clone.
    // // This is to balance the infinite-mana clone merge exploit
    // if (target.unitType == UnitType.PLAYER_CONTROLLED && target.predictionCopy) {
    //   clone.mana = 0;
    // }
    // Clones don't provide experience when killed
    clone.originalLife = false;

    // Remove runes from clone:
    // Note: This MUST be invoked after originalLife is set to false
    // because it has a safeguard that won't operate on the player unit
    if (clone.modifiers) {
      Object.keys(clone.modifiers).forEach(modifierKey => Unit.removeRune(clone, modifierKey, underworld));
    }
    // Soul Shard Owner should not transfer to clones
    if (clone.modifiers[soulShardOwnerModifierId]) {
      Unit.removeModifier(clone, soulShardOwnerModifierId, underworld)
    }
    return clone;
  }
  return undefined;

}
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
