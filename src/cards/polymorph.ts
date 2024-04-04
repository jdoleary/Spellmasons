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
import { chooseObjectWithProbability, chooseOneOf, chooseOneOfSeeded } from '../jmath/rand';

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

      for (let target of targets) {

        if (Unit.isUnit(target)) {
          const unit = target as Unit.IUnit;
          const unitSource = allUnits[unit.unitSourceId]

          let possibleUnitTypes = Object.values(allUnits).filter(u => isModActive(u, underworld) && u.id != unitSource?.id);
          if (unit.isBoss) {
            possibleUnitTypes = possibleUnitTypes
              .filter(u => u.unitProps.isBoss);
          } else {
            // Get all units with budget and spawn chance
            possibleUnitTypes = possibleUnitTypes
              .filter(u => u.spawnParams && u.spawnParams.probability > 0 && u.spawnParams.budgetCost);
          }

          // We have to seed this to prevent multiplayer desync
          const seed = seedrandom(`${underworld.turn_number} -${target.id} `);
          const chosenIndex = chooseObjectWithProbability(possibleUnitTypes.map((p, index) => {
            // Units are weighted by their difference in budget.
            // Units twice as far away in the budget are half as likely to be chosen.
            const budgetDiff = Math.abs((unitSource?.spawnParams?.budgetCost || 0) - (p.spawnParams?.budgetCost || 0));
            return { index, probability: (budgetDiff == 0) ? 1 : 1 / budgetDiff }
          }), seed)?.index;

          const chosenUnitType = (chosenIndex != undefined) ? possibleUnitTypes[chosenIndex] : undefined;
          if (chosenUnitType) {
            // Replace current unit with new unit
            const newUnit = polymorphUnit(unit, chosenUnitType.id, underworld, prediction);
            if (newUnit) {
              // Visual aid only
              if (prediction) {
                // TODO - Show new unit?
              }

              // Keep Modifiers
              for (const modifierKey of Object.keys(unit.modifiers)) {
                const modifier = allModifiers[modifierKey];
                const modifierInstance = unit.modifiers[modifierKey];
                if (modifier && modifierInstance) {
                  if (modifier?.add) {
                    modifier.add(newUnit, underworld, prediction, modifierInstance.quantity, modifierInstance);
                  }
                } else {
                  console.error("Modifier doesn't exist? This shouldn't happen.");
                }
              }

              // Cleanup old unit and remove it from targets
              Unit.cleanup(unit, false);
              state.targetedUnits = state.targetedUnits.filter(u => u != unit);
              // Add new unit to targets
              addTarget(newUnit, state, underworld);
            }
          } else {
            console.error("Polymorph failed to choose a new unit type.");
          }
        } else if (isPickup(target)) {
          const pickup = target as IPickup;
          if (pickup.name == Pickup.PORTAL_PURPLE_NAME) continue;

          let possiblePickupTypes = pickups.filter(p => isModActive(p, underworld) && p.name != pickup.name
            && p.name != Pickup.PORTAL_PURPLE_NAME && p.name != Pickup.RECALL_POINT);

          // We have to seed this to prevent multiplayer desync
          const seed = seedrandom(`${underworld.turn_number} -${pickup.id} `);
          const chosenPickupType = chooseOneOfSeeded(possiblePickupTypes, seed);
          if (chosenPickupType) {
            // Replace current pickup with new pickup
            const newPickup = polymorphPickup(pickup, chosenPickupType, underworld, prediction);
            if (newPickup) {
              // Visual aid only
              if (prediction) {
                // TODO - Show new pickup?
              }
              // Cleanup old pickup and remove it from targets
              Pickup.removePickup(pickup, underworld, prediction);
              state.targetedPickups = state.targetedPickups.filter(p => p != pickup);
              // Add new pickup to targets
              addTarget(newPickup, state, underworld);
            }
          } else {
            console.error("Polymorph failed to choose a new unit type.");
          }
        }
      }

      return state;
    },
  },
};

function polymorphUnit(fromUnit: Unit.IUnit, toUnitId: string, underworld: Underworld, prediction: boolean): Unit.IUnit | undefined {
  const sourceUnit = allUnits[toUnitId];
  if (!sourceUnit) {
    console.error('Unit with id', toUnitId, 'does not exist. Have you registered it in src/units/index.ts?');
    return undefined;
  }

  let unit: Unit.IUnit = Unit.create(
    sourceUnit.id,
    fromUnit.x,
    fromUnit.y,
    fromUnit.faction,
    sourceUnit.info.image,
    UnitType.AI,
    sourceUnit.info.subtype,
    { ...sourceUnit.unitProps, isMiniboss: fromUnit.isMiniboss, originalLife: fromUnit.originalLife },
    underworld,
    prediction
  );
  return unit;
}

function polymorphPickup(fromPickup: IPickup, toPickupSource: Pickup.IPickupSource, underworld: Underworld, prediction: boolean): IPickup | undefined {
  const pickup = Pickup.create({ pos: fromPickup, pickupSource: toPickupSource, logSource: 'spawnPickup' }, underworld, prediction);
  if (!prediction) {
    setTimeout(() => {
      playSFXKey('spawnPotion');
      floatingText({ coords: fromPickup, text: toPickupSource.name });
    }, 500);
  }
  return pickup;
}

export default spell;