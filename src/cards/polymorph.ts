import { CardCategory, UnitType } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { Spell, addTarget, refundLastSpell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as Unit from '../entity/Unit';
import { allUnits } from '../entity/units';
import { isModActive } from '../registerMod';
import Underworld from '../Underworld';

export const polymorphId = 'Polymorph';
const spell: Spell = {
  card: {
    id: polymorphId,
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 30,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconPolymorph.png',
    sfx: 'purify',
    description: ['spell_polymorph'],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target potions
      const targets = state.targetedUnits.filter(u => !u.flaggedForRemoval && u.unitType != UnitType.PLAYER_CONTROLLED);
      if (targets.length == 0) {
        refundLastSpell(state, prediction, 'No valid targets. Cost refunded.');
        return state;
      }

      playDefaultSpellSFX(card, prediction);

      // Go through the units in order of budget,
      // or alphabetically in the case of equal budget costs
      let possibleUnitTypes = Object.values(allUnits)
        .filter(u => u.spawnParams && u.spawnParams.probability > 0 && u.spawnParams.budgetCost && isModActive(u, underworld))
        .map(u => ({ id: u.id, budget: u.spawnParams?.budgetCost || 0 }))
        .sort((a, b) => a.budget - b.budget || a.id.localeCompare(b.id));

      for (let unit of targets) {
        // Find starting point in unit type cycle
        let unitIndex = possibleUnitTypes.findIndex(u => u.id == unit.unitSourceId);
        if (unitIndex == -1) {
          console.log("No polymorph entry for unit:", unit.unitSourceId);
        }

        // Loop through list and retrieve next unit type
        unitIndex += quantity;
        const chosenUnitType = possibleUnitTypes[unitIndex % possibleUnitTypes.length];
        if (chosenUnitType) {
          // Replace current unit with new unit
          const newUnit = polymorphEntity(unit, chosenUnitType.id, underworld, prediction);
          if (newUnit) {
            // Visual aid only
            if (prediction) {
              // TODO - Show new unit?
            }

            // Cleanup unit and remove from targets list. Add new unit to targets
            Unit.cleanup(unit, false);
            state.targetedUnits = state.targetedUnits.filter(u => u != unit);
            addTarget(newUnit, state, underworld);
          }
        }
      }

      return state;
    },
  },
};

function polymorphEntity(fromUnit: Unit.IUnit, toUnitId: string, underworld: Underworld, prediction: boolean): Unit.IUnit | undefined {
  const sourceUnit = allUnits[toUnitId];
  if (!sourceUnit) {
    console.error('Unit with id', toUnitId, 'does not exist.  Have you registered it in src/units/index.ts?');
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

export default spell;