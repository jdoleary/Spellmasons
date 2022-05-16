import type { Spell } from '.';
import * as Unit from '../Unit';
import { Faction, UnitType } from '../commonTypes';
import { allUnits } from '../units';

export const id = 'summon_decoy';
const spell: Spell = {
  card: {
    id,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 2,
    probability: 50,
    thumbnail: 'decoy.png',
    description: `
Summons a decoy to distract enemies
    `,
    allowNonUnitTarget: true,
    effect: async (state, prediction) => {
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
