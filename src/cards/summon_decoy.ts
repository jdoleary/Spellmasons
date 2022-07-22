import type { Spell } from '.';
import * as Unit from '../entity/Unit';
import { Faction, UnitType } from '../types/commonTypes';
import { allUnits } from '../entity/units';

export const id = 'decoy';
const spell: Spell = {
  card: {
    id,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'decoy.png',
    description: `
Summons a decoy.
The decoy attracts attacks for enemies that it is closer to that you are.
The decoy has health but cannot move.  It will be destroyed when its health reaches 0.
    `,
    allowNonUnitTarget: true,
    effect: async (state, underworld, prediction) => {
      const unitId = 'decoy';
      if (!prediction) {
        const sourceUnit = allUnits[unitId];
        if (sourceUnit) {
          Unit.create(
            sourceUnit.id,
            state.castLocation.x,
            state.castLocation.y,
            Faction.ALLY,
            sourceUnit.info.image,
            UnitType.AI,
            sourceUnit.info.subtype,
            0,
            sourceUnit.unitProps
          );
        } else {
          console.error(`Source unit ${unitId} is missing`);
        }
      }
      return state;
    },
  },
};
export default spell;
