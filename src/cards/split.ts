import { addTarget, getCurrentTargets, refundLastSpell, Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardCategory, UnitSubType, UnitType } from '../types/commonTypes';
import { Vec2 } from '../jmath/Vec';
import { returnToDefaultSprite } from '../entity/Unit';
import Underworld from '../Underworld';
import { animateMitosis } from './clone';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import { isPickup } from '../entity/Pickup';
import { suffocateCardId, updateSuffocate } from './suffocate';
import { addScaleModifier, removeScaleModifier } from '../graphics/Image';

export const splitId = 'split';
const splitLimit = 3;
export function changeStatWithCap(unit: Unit.IUnit, statKey: 'health' | 'healthMax' | 'mana' | 'manaMax' | 'manaPerTurn' | 'manaCostToCast' | 'stamina' | 'staminaMax' | 'moveSpeed' | 'damage' | 'attackRange', multiplier: number) {
  if (unit[statKey] && typeof unit[statKey] === 'number') {

    // Do not let stats go below 1
    // Ensure stats are a whole number
    const newValue = Math.max(1, Math.floor(unit[statKey] * multiplier));
    unit[statKey] = newValue;
  }
}

const addMultiplier = 0.5;
const scaleMultiplier = 0.75;
function remove(unit: Unit.IUnit, underworld: Underworld) {
  if (!unit.modifiers[splitId]) {
    console.error(`Missing modifier object for ${splitId}; cannot remove.  This should never happen`);
    return;
  }
  // Safely restore unit's original properties
  const { healthMax, manaMax, manaPerTurn, staminaMax, damage, moveSpeed } = unit.modifiers[splitId].originalStats;
  removeScaleModifier(unit.image, splitId, unit.strength)
  const healthChange = healthMax / unit.healthMax;
  unit.health *= healthChange;
  unit.health = Math.floor(unit.health);
  unit.healthMax = healthMax;
  // Prevent unexpected overflow
  unit.health = Math.min(healthMax, unit.health);

  // || 1 prevents div by 0 since some units don't have mana
  const manaChange = manaMax / (unit.manaMax || 1);
  unit.mana *= manaChange;
  unit.mana = Math.floor(unit.mana);
  unit.manaMax = manaMax;
  // Prevent unexpected overflow
  unit.mana = Math.min(manaMax, unit.mana);
  unit.manaPerTurn = manaPerTurn;

  const staminaChange = staminaMax / unit.staminaMax;
  unit.stamina *= staminaChange;
  unit.stamina = Math.floor(unit.stamina);
  unit.staminaMax = staminaMax;
  // Prevent unexpected overflow
  unit.stamina = Math.min(staminaMax, unit.stamina);

  unit.damage = damage;
  unit.moveSpeed = moveSpeed;
}
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) {
  const { healthMax, manaMax, manaPerTurn, staminaMax, damage, moveSpeed } = unit;
  const modifier = getOrInitModifier(unit, splitId, {
    isCurse: true,
    quantity,
    keepOnDeath: true,
    originalStats: {
      healthMax,
      manaMax,
      manaPerTurn,
      staminaMax,
      damage,
      moveSpeed
    }
  }, () => { }); //no first time setup


  // modifier.quantity is after the new quantity has been added (due to getOrInitModifier)
  // math to find previous quantity and calc how many times I need to split
  const lastQuant = modifier.quantity - quantity;
  const timesToSplit = Math.min(splitLimit - lastQuant, quantity);
  modifier.quantity = Math.min(modifier.quantity, splitLimit);

  for (let i = 0; i < timesToSplit; i++) {
    addScaleModifier(unit.image, { x: scaleMultiplier, y: scaleMultiplier, id: splitId }, unit.strength)
    changeStatWithCap(unit, 'health', addMultiplier);
    changeStatWithCap(unit, 'healthMax', addMultiplier);
    changeStatWithCap(unit, 'mana', addMultiplier);
    //changeStatWithCap(unit, 'manaMax', addMultiplier);
    changeStatWithCap(unit, 'manaPerTurn', addMultiplier);
    changeStatWithCap(unit, 'stamina', addMultiplier);
    changeStatWithCap(unit, 'staminaMax', addMultiplier);
    changeStatWithCap(unit, 'damage', addMultiplier);
    unit.moveSpeed *= addMultiplier;
  }

  if (unit.modifiers[suffocateCardId]) {
    updateSuffocate(unit, underworld, prediction);
  }
}
const spell: Spell = {
  card: {
    id: splitId,
    category: CardCategory.Soul,
    manaCost: 80,
    healthCost: 0,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    expenseScaling: 2,
    thumbnail: 'spellIconSplit.png',
    description: ['spell_split', splitLimit.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // Batch find targets that should be cloned
      // Note: They need to be batched so that the new clones don't get cloned
      const clonePairs: Vec2[][] = [];
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      targets = targets
        // filter out targets that have reached the split limit
        .filter(x => !(Unit.isUnit(x) && x.modifiers[splitId] && x.modifiers[splitId].quantity >= splitLimit))
        // filter out pickups (not implemented)
        .filter(x => !(isPickup(x)));

      if (targets.length == 0) {
        refundLastSpell(state, prediction, 'No target, mana refunded')
        return state;
      }

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
        const clone = doSplit(target, underworld, quantity, prediction);
        if (clone) {
          // Add the clone as a target
          addTarget(clone, state, underworld, prediction);
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
export function doSplit(target: Vec2 | undefined, underworld: Underworld, quantity: number, prediction: boolean) {
  if (target) {
    // If there is are clone coordinates to clone into
    if (Unit.isUnit(target)) {
      const validSpawnCoords = underworld.findValidSpawn({ spawnSource: target, ringLimit: 5, prediction, radius: 10 });
      if (validSpawnCoords) {
        const clone = Unit.load(Unit.serialize(target), underworld, prediction);
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
        }
        // Always have the clone idle regardless of which animation was playing when they were cloned
        returnToDefaultSprite(clone);
        clone.x = validSpawnCoords.x;
        clone.y = validSpawnCoords.y;
        // Clones don't provide experience when killed
        clone.originalLife = false;

        // Add the curse to both the target and the clone
        Unit.addModifier(target, splitId, underworld, prediction, quantity);
        Unit.addModifier(clone, splitId, underworld, prediction, quantity);
        return clone;
      }
    }
    // TODO: Make split for for doodads and pickups
    // if (Pickup.isPickup(target)) {
    //   const validSpawnCoords = underworld.findValidSpawn({spawnSource:cloneSourceCoords, ringLimit: 5, prediction, radius:20})
    //   if (validSpawnCoords) {
    //     const clone = Pickup.load(Pickup.serialize(target), underworld, prediction);
    //     if (clone) {
    //       Pickup.setPosition(clone, validSpawnCoords.x, validSpawnCoords.y);
    //     }
    //     // Add the clone as a target
    //     addTarget(clone, state);
    //   } else {
    //     floatingText({ coords: cloneSourceCoords, text: 'No space to clone into!' });
    //   }
    // }
  }
  return undefined;

}
