import { getCurrentTargets, Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardCategory, UnitSubType, UnitType } from '../types/commonTypes';
import { jitter, Vec2 } from '../jmath/Vec';
import * as config from '../config';
import { returnToDefaultSprite } from '../entity/Unit';
import Underworld from '../Underworld';
import { animateMitosis } from './clone';

import { CardRarity, probabilityMap } from '../graphics/ui/CardUI';
const id = 'split';
function changeStatWithCap(unit: Unit.IUnit, statKey: 'health' | 'healthMax' | 'mana' | 'manaMax' | 'stamina' | 'staminaMax' | 'moveSpeed' | 'damage', multiplier: number) {
  if (unit[statKey] && typeof unit[statKey] === 'number') {

    // Do not let stats go below 1
    // Ensure stats are a whole number
    const newValue = Math.max(1, Math.floor(unit[statKey] * multiplier));
    unit[statKey] = newValue;
  }

}
const addMultiplier = 0.5;
const removeMultiplier = 1 / addMultiplier;
const scaleMultiplier = 0.75;
const removeScaleMultiplier = 1 / scaleMultiplier;
function remove(unit: Unit.IUnit, underworld: Underworld) {
  const stacks = unit.modifiers[id]?.stacks || 1;
  for (let i = 0; i < stacks; i++) {
    if (unit.image) {
      unit.image.sprite.scale.x *= removeScaleMultiplier;
      unit.image.sprite.scale.y *= removeScaleMultiplier;
    }
    changeStatWithCap(unit, 'health', removeMultiplier);
    changeStatWithCap(unit, 'healthMax', removeMultiplier);
    changeStatWithCap(unit, 'mana', removeMultiplier);
    changeStatWithCap(unit, 'manaMax', removeMultiplier);
    changeStatWithCap(unit, 'stamina', removeMultiplier);
    changeStatWithCap(unit, 'staminaMax', removeMultiplier);
    changeStatWithCap(unit, 'damage', removeMultiplier);
    unit.moveSpeed *= removeMultiplier;
  }
}
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = {
      isCurse: true,
    };
  }
  if (unit.image) {
    unit.image.sprite.scale.x *= scaleMultiplier;
    unit.image.sprite.scale.y *= scaleMultiplier;
  }
  changeStatWithCap(unit, 'health', addMultiplier);
  changeStatWithCap(unit, 'healthMax', addMultiplier);
  changeStatWithCap(unit, 'mana', addMultiplier);
  changeStatWithCap(unit, 'manaMax', addMultiplier);
  changeStatWithCap(unit, 'stamina', addMultiplier);
  changeStatWithCap(unit, 'staminaMax', addMultiplier);
  changeStatWithCap(unit, 'damage', addMultiplier);
  unit.moveSpeed *= addMultiplier;
  // Increment the number of stacks
  const modifier = unit.modifiers[id];
  if (modifier) {
    modifier.stacks = (modifier.stacks || 0) + quantity;
    console.log('jtest 2 stacks', modifier.stacks);
  } else {
    console.error(`${id} modifier does not exist`)
  }
}
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    manaCost: 80,
    healthCost: 0,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    expenseScaling: 2,
    thumbnail: 'spellIconSplit.png',
    description: `
Splits the unit into 2 smaller weaker versions of itself.
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
              // Jitter prevents multiple clones from spawning on top of each other
              const validSpawnCoords = underworld.findValidSpawn(jitter(cloneSourceCoords, config.COLLISION_MESH_RADIUS / 2, underworld.random), 5, 10);
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

                // Add the curse to both the target and the clone
                Unit.addModifier(target, id, underworld, prediction, quantity);
                Unit.addModifier(clone, id, underworld, prediction, quantity);
              }
            }
            // TODO: Make split for for doodads and pickups
            // if (Pickup.isPickup(target)) {
            //   const validSpawnCoords = underworld.findValidSpawn(cloneSourceCoords, 5, 20)
            //   if (validSpawnCoords) {
            //     const clone = Pickup.load(target, underworld, prediction);
            //     if (clone) {
            //       Pickup.setPosition(clone, validSpawnCoords.x, validSpawnCoords.y);
            //     }
            //   } else {
            //     floatingText({ coords: cloneSourceCoords, text: 'No space to clone into!' });
            //   }
            // }
            // if (Doodad.isDoodad(target)) {
            //   const validSpawnCoords = underworld.findValidSpawn(cloneSourceCoords, 5, 20)
            //   if (validSpawnCoords) {
            //     const clone = Doodad.load(Doodad.serialize(target), underworld, prediction);
            //     if (clone) {
            //       target.x = validSpawnCoords.x;
            //       target.y = validSpawnCoords.y;
            //     }
            //   } else {
            //     floatingText({ coords: cloneSourceCoords, text: 'No space to clone into!' });
            //   }
            // }
          }
        }
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove
  }
};
export default spell;
