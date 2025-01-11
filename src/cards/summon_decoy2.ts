import { addUnitTarget, refundLastSpell, Spell } from './index';
import * as config from '../config';
import * as Unit from '../entity/Unit';
import { CardCategory, Faction, UnitType } from '../types/commonTypes';
import { allUnits } from '../entity/units';
import { skyBeam } from '../VisualEffects';
import { playDefaultSpellSFX } from './cardUtils';
import floatingText from '../graphics/FloatingText';
import { addWarningAtMouse } from '../graphics/PlanningView';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { runeThornyDecoysId } from '../modifierThornyDecoys';
import { thornsId } from '../modifierThorns';
import { runeHardenedMinionsId } from '../modifierHardenedMinions';

const id = 'decoy 2';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Soul,
    sfx: 'summonDecoy',
    requires: ['decoy'],
    supportQuantity: true,
    manaCost: 80,
    healthCost: 0,
    expenseScaling: 2,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconSummon_decoy2.png',
    description: 'spell_summon_decoy',
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction) => {
      const unitId = 'decoy 2';
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
            refundLastSpell(state, prediction, 'Invalid summon location, mana refunded.')
          }
          return state;
        }
        playDefaultSpellSFX(card, prediction);
        const unit = Unit.create(
          sourceUnit.id,
          summonLocation.x,
          summonLocation.y,
          Faction.ALLY,
          sourceUnit.info.image,
          UnitType.AI,
          sourceUnit.info.subtype,
          {
            ...sourceUnit.unitProps,
            healthMax: (sourceUnit.unitProps.healthMax || config.UNIT_BASE_HEALTH) * quantity,
            health: (sourceUnit.unitProps.health || config.UNIT_BASE_HEALTH) * quantity,
            damage: (sourceUnit.unitProps.damage || 0) * quantity,
            strength: (sourceUnit.unitProps.strength || 1) * quantity
          },
          underworld,
          prediction,
          state.casterUnit
        );
        addUnitTarget(unit, state, prediction);

        const summonerThornyDecoys = state.casterUnit.modifiers[runeThornyDecoysId];
        if (summonerThornyDecoys) {
          Unit.addModifier(unit, thornsId, underworld, prediction, summonerThornyDecoys.quantity);
        }

        if (!prediction) {
          // Animate effect of unit spawning from the sky
          skyBeam(unit);
        }
      } else {
        console.error(`Source unit ${unitId} is missing`);
      }
      return state;
    },
  },
};
export default spell;
