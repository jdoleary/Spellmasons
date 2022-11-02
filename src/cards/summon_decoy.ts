import { addUnitTarget, Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardCategory, Faction, UnitType } from '../types/commonTypes';
import { allUnits } from '../entity/units';
import { skyBeam } from '../VisualEffects';
import { playDefaultSpellSFX } from './cardUtils';
import floatingText from '../graphics/FloatingText';
import { addWarningAtMouse } from '../graphics/PlanningView';
import { CardRarity, probabilityMap } from '../types/commonTypes';

export const id = 'decoy';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Soul,
    sfx: 'summonDecoy',
    supportQuantity: true,
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 3,
    probability: probabilityMap[CardRarity.COMMON],
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
      const sourceUnit = allUnits[unitId];
      if (sourceUnit) {
        const summonLocation = {
          x: state.castLocation.x,
          y: state.castLocation.y
        }
        if (underworld.isCoordOnWallTile(summonLocation)) {
          if (prediction) {
            const WARNING = "Invalid Summon Location";
            addWarningAtMouse(WARNING);
          } else {
            floatingText({ coords: summonLocation, text: 'Invalid summon location!', style: { fill: 'red' } });
          }
          return state;
        }
        playDefaultSpellSFX(card, prediction);
        const decoyUnit = Unit.create(
          sourceUnit.id,
          summonLocation.x,
          summonLocation.y,
          Faction.ALLY,
          sourceUnit.info.image,
          UnitType.AI,
          sourceUnit.info.subtype,
          sourceUnit.unitProps,
          underworld,
          prediction
        );
        addUnitTarget(decoyUnit, state);

        if (!prediction) {
          // Animate effect of unit spawning from the sky
          skyBeam(decoyUnit);
        }

        decoyUnit.healthMax *= quantity;
        decoyUnit.health = decoyUnit.healthMax;
      } else {
        console.error(`Source unit ${unitId} is missing`);
      }
      return state;
    },
  },
};
export default spell;
