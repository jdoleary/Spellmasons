import { Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardCategory, Faction, UnitType } from '../types/commonTypes';
import { allUnits } from '../entity/units';

export const id = 'decoy';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Primary,
    supportQuantity: true,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 3,
    probability: 50,
    thumbnail: 'spellIconDecoy.png',
    description: `
Summons a decoy.
The decoy attracts attacks for enemies that it is closer to that you are.
The decoy has health but cannot move.  It will be destroyed when its health reaches 0.
Multiple sequential decoy spells will create a decoy with more health.
    `,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction) => {
      const unitId = 'decoy';
      if (!prediction) {
        const sourceUnit = allUnits[unitId];
        if (sourceUnit) {
          const decoyUnit = Unit.create(
            sourceUnit.id,
            state.castLocation.x,
            state.castLocation.y,
            Faction.ALLY,
            sourceUnit.info.image,
            UnitType.AI,
            sourceUnit.info.subtype,
            0,
            sourceUnit.unitProps,
            underworld
          );
          decoyUnit.healthMax *= quantity;
          decoyUnit.health = decoyUnit.healthMax;
        } else {
          console.error(`Source unit ${unitId} is missing`);
        }
      }
      return state;
    },
  },
};
export default spell;
