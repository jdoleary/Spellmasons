import { CardCategory, UnitType } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell, addTarget, allModifiers, getCurrentTargets, refundLastSpell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import { allUnits } from '../entity/units';
import { isModActive } from '../registerMod';
import Underworld from '../Underworld';
import { IPickup, isPickup, pickups } from '../entity/Pickup';
import { bossmasonUnitId } from '../entity/units/deathmason';
import floatingText from '../graphics/FloatingText';
import seedrandom from 'seedrandom';
import { chooseObjectWithProbability, chooseOneOf, chooseOneOfSeeded, getUniqueSeedString } from '../jmath/rand';

export const polymorphId = 'Polymorph';
const spell: Spell = {
  card: {
    id: polymorphId,
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconPolymorph.png',
    sfx: 'purify',
    description: ['spell_polymorph'],
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = getCurrentTargets(state);
      if (targets.length == 0) {
        refundLastSpell(state, prediction, 'No valid targets. Cost refunded.');
        return state;
      }

      playDefaultSpellSFX(card, prediction);

      for (let i = 0; i < quantity; i++) {
        for (const target of targets) {
          if (Unit.isUnit(target)) {
            const unit = target as Unit.IUnit;
            // Replace current unit with new unit
            const newUnit = polymorphUnit(unit, underworld, prediction);
            if (newUnit) {
              // Visual aid only
              if (prediction) {
                // TODO - Show new unit?
              }
              state.targetedUnits = state.targetedUnits.filter(u => u != unit);
              // Add new unit to targets
              addTarget(newUnit, state, underworld);
            }
          } else if (isPickup(target)) {
            const pickup = target as IPickup;
            // Replace current pickup with new pickup
            const newPickup = polymorphPickup(pickup, underworld, prediction);
            if (newPickup) {
              // Visual aid only
              if (prediction) {
                // TODO - Show new pickup?
              }
              state.targetedPickups = state.targetedPickups.filter(p => p != pickup);
              // Add new pickup to targets
              addTarget(newPickup, state, underworld);
            }
          }
        }
      }

      return state;
    },
  },
};

function polymorphUnit(fromUnit: Unit.IUnit, underworld: Underworld, prediction: boolean, toUnitId?: string): Unit.IUnit | undefined {
  // If a specific ID isn't passed in, choose a random one
  if (!toUnitId) {
    let possibleUnitTypes = Object.values(allUnits).filter(u => isModActive(u, underworld) && u.id != fromUnit.unitSourceId);
    if (Unit.isBoss(fromUnit.unitSourceId)) {
      // Get all boss units
      possibleUnitTypes = possibleUnitTypes
        .filter(u => Unit.isBoss(u.id));
    } else {
      // Get all units with budget and spawn chance
      possibleUnitTypes = possibleUnitTypes
        .filter(u => u.spawnParams && u.spawnParams.probability > 0 && u.spawnParams.budgetCost);
    }

    // We have to seed this to prevent multiplayer desync
    // ID is required here to ensure that every polymorph changes the seed to prevent looping
    const seed = seedrandom(`${getUniqueSeedString(underworld)} - ${fromUnit.id}`);
    toUnitId = chooseObjectWithProbability(possibleUnitTypes.map((p, index) => {
      // Units are weighted by their difference in budget.
      // Units twice as far away in the budget are half as likely to be chosen.
      const budgetDiff = Math.abs((allUnits[fromUnit.unitSourceId]?.spawnParams?.budgetCost || 0) - (p.spawnParams?.budgetCost || 0));
      return { unitSource: p, probability: (budgetDiff == 0) ? 1 : 1 / budgetDiff }
    }), seed)?.unitSource.id;

    if (toUnitId == undefined) {
      console.error("Polymorph failed to choose a new unit type.");
      return undefined;
    }
  }
  const toSourceUnit = allUnits[toUnitId];
  if (!toSourceUnit) {
    console.error('Unit with id', toUnitId, 'does not exist. Have you registered it in src/units/index.ts?');
    return undefined;
  }

  console.log(toSourceUnit);
  // Cases for polymorphing AI / Player
  if (fromUnit.unitType != UnitType.PLAYER_CONTROLLED) {
    let unit: Unit.IUnit = Unit.create(
      toSourceUnit.id,
      fromUnit.x,
      fromUnit.y,
      fromUnit.faction,
      toSourceUnit.info.image,
      UnitType.AI,
      toSourceUnit.info.subtype,
      { ...toSourceUnit.unitProps, isMiniboss: fromUnit.isMiniboss, originalLife: fromUnit.originalLife },
      underworld,
      prediction
    );

    console.log(unit);
    if (unit != undefined) {
      console.log("unit exists");
      // Keep Modifiers
      for (const modifierKey of Object.keys(unit.modifiers)) {
        const modifier = allModifiers[modifierKey];
        const modifierInstance = unit.modifiers[modifierKey];
        if (modifier && modifierInstance) {
          if (modifier?.add) {
            modifier.add(unit, underworld, prediction, modifierInstance.quantity, modifierInstance);
          }
        } else {
          console.error("Modifier doesn't exist? This shouldn't happen.");
        }
      }

      // Cleanup old unit and remove it from targets
      Unit.cleanup(fromUnit, false);
    }
    return unit;
  } else {
    // Only change img for player
    fromUnit.image = allUnits[toUnitId]?.unitProps.image;
    return fromUnit;
  }
}

function polymorphPickup(fromPickup: IPickup, underworld: Underworld, prediction: boolean, toPickupSource?: Pickup.IPickupSource): IPickup | undefined {
  // If a specific ID isn't passed in, choose a random one
  if (!toPickupSource) {
    // Don't polymorph purple portals
    if (fromPickup.name == Pickup.PORTAL_PURPLE_NAME) return undefined;

    let possiblePickupTypes = pickups.filter(p => isModActive(p, underworld) && p.name != fromPickup.name
      && p.name != Pickup.PORTAL_PURPLE_NAME && p.name != Pickup.RECALL_POINT);

    // We have to seed this to prevent multiplayer desync
    // ID is required here to ensure that every polymorph changes the seed to prevent looping
    const seed = seedrandom(`${getUniqueSeedString(underworld)} - ${fromPickup.id}`);
    toPickupSource = chooseOneOfSeeded(possiblePickupTypes, seed);
    if (toPickupSource == undefined) {
      console.error("Polymorph failed to choose a new pickup type.");
      return undefined;
    }
  }

  console.log(toPickupSource);
  const pickup = Pickup.create({ pos: fromPickup, pickupSource: toPickupSource, logSource: 'spawnPickup' }, underworld, prediction);
  if (pickup != undefined) {
    if (!prediction) {
      playSFXKey('spawnPotion');
      floatingText({ coords: fromPickup, text: toPickupSource.name });
    }
    // Cleanup old pickup and remove it from targets
    Pickup.removePickup(fromPickup, underworld, prediction);
  }
  return pickup;
}

export default spell;