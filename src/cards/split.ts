import { addTarget, getCurrentTargets, refundLastSpell, Spell } from './index';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
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
import floatingText from '../graphics/FloatingText';

export const splitId = 'split';
const splitLimit = 3;
const splitStatMultiplier = 0.5;
const scaleMultiplier = 0.75;
function remove(unit: Unit.IUnit, underworld: Underworld) {
  const modifier = unit.modifiers[splitId];
  if (!modifier) {
    console.error(`Missing modifier object for ${splitId}; cannot remove.  This should never happen`);
    return;
  }

  const inverseMult = 1 / splitStatMultiplier;
  for (let i = 0; i < modifier.quantity; i++) {
    unit.healthMax = Math.max(1, Math.floor(unit.healthMax * inverseMult));
    unit.health = Math.max(1, Math.floor(unit.health * inverseMult));
    //unit.manaMax = Math.floor(unit.manaMax * inverseMult);
    unit.mana = Math.floor(unit.mana * inverseMult);
    unit.manaPerTurn = Math.floor(unit.manaPerTurn * inverseMult);
    unit.staminaMax = Math.floor(unit.staminaMax * inverseMult);
    unit.stamina = Math.floor(unit.stamina * inverseMult);
    unit.damage = Math.floor(unit.damage * inverseMult);
    unit.moveSpeed *= inverseMult;
  }

  removeScaleModifier(unit.image, splitId, unit.strength);

  if (unit.modifiers[suffocateCardId]) {
    updateSuffocate(unit, underworld, false);
  }
}
function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) {

  const modifier = getOrInitModifier(unit, splitId, { isCurse: true, quantity, keepOnDeath: true }, () => {
    // no first time setup
  });

  // modifier.quantity is after the new quantity has been added (due to getOrInitModifier)
  // math to find previous quantity and calc how many times I need to split
  const lastQuant = modifier.quantity - quantity;
  const timesToSplit = Math.min(splitLimit - lastQuant, quantity);
  modifier.quantity = Math.min(modifier.quantity, splitLimit);

  for (let i = 0; i < timesToSplit; i++) {
    unit.healthMax = Math.max(1, Math.floor(unit.healthMax * splitStatMultiplier));
    unit.health = Math.max(1, Math.floor(unit.health * splitStatMultiplier));
    //unit.manaMax = Math.floor(unit.manaMax * splitStatMultiplier);
    unit.mana = Math.floor(unit.mana * splitStatMultiplier);
    unit.manaPerTurn = Math.floor(unit.manaPerTurn * splitStatMultiplier);
    unit.staminaMax = Math.floor(unit.staminaMax * splitStatMultiplier);
    unit.stamina = Math.floor(unit.stamina * splitStatMultiplier);
    unit.damage = Math.floor(unit.damage * splitStatMultiplier);
    unit.moveSpeed *= splitStatMultiplier;
  }

  if (unit.modifiers[suffocateCardId]) {
    updateSuffocate(unit, underworld, prediction);
  }
}
const spell: Spell = {
  card: {
    id: splitId,
    category: CardCategory.Curses,
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
    remove,
    addModifierVisuals: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[splitId];
      if (modifier) {
        addScaleModifier(unit.image, { x: Math.pow(scaleMultiplier, modifier.quantity), y: Math.pow(scaleMultiplier, modifier.quantity), id: splitId }, unit.strength);
      }

    }
  }
};
export default spell;
export function doSplit(target: Vec2 | undefined, underworld: Underworld, quantity: number, prediction: boolean): Unit.IUnit | Pickup.IPickup | undefined {
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
    } else if (Pickup.isPickup(target)) {
      const validSpawnCoords = underworld.findValidSpawn({ spawnSource: target, ringLimit: 5, prediction, radius: 20 })
      if (validSpawnCoords) {
        // Since there is a safety for loading/creating pickups of duplicate id's
        const serializedPickup = Pickup.serialize(target);
        serializedPickup.id = ++underworld.lastPickupId;
        const clone = Pickup.load(serializedPickup, underworld, prediction);
        if (clone) {
          Pickup.setPosition(clone, validSpawnCoords.x, validSpawnCoords.y);
          Pickup.setPower(target, target.power * splitStatMultiplier);
          Pickup.setPower(clone, clone.power * splitStatMultiplier);
          return clone;
        }
      } else {
        floatingText({ coords: target, text: 'No space to clone into!' });
      }
    }
  }
  return undefined;

}
