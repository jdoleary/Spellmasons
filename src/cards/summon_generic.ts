import { addUnitTarget, refundLastSpell, Spell } from './index';
import * as config from '../config';
import * as Unit from '../entity/Unit';
import { CardCategory, Faction, UnitSubType, UnitType } from '../types/commonTypes';
import { allUnits } from '../entity/units';
import { skyBeam } from '../VisualEffects';
import { playDefaultSpellSFX } from './cardUtils';
import { addWarningAtMouse } from '../graphics/PlanningView';
import { CardRarity } from '../types/commonTypes';
import { bossmasonUnitId } from '../entity/units/deathmason';
import { spellmasonUnitId } from '../entity/units/playerUnit';
import { golem_unit_id } from '../entity/units/golem';
import { ARCHER_ID } from '../entity/units/archer';
import { ANCIENT_UNIT_ID } from '../entity/units/ancient';
import { GLOP_UNIT_ID } from '../entity/units/glop';
import { gripthulu_id } from '../entity/units/gripthulu';
import { BLOOD_GOLEM_ID } from '../entity/units/bloodGolem';
import { POISONER_ID } from '../entity/units/poisoner';
import { VAMPIRE_ID } from '../entity/units/vampire';
import { BLOOD_ARCHER_ID } from '../entity/units/blood_archer';
import { PRIEST_ID } from '../entity/units/priest';
import { SUMMONER_ID } from '../entity/units/summoner';
import { GHOST_ARCHER_ID } from '../entity/units/ghost_archer';
import { MANA_VAMPIRE_ID } from '../entity/units/manaVampire';
import { DARK_SUMMONER_ID } from '../entity/units/darkSummoner';
import { DARK_PRIEST_ID } from '../entity/units/darkPriest';


const overrides: { [unitId: string]: { exclude: boolean, properties: { manaCost?: number } } } = {
  'decoy': {
    exclude: true,
    properties: {}
  },
  [golem_unit_id]: {
    exclude: false,
    properties: { manaCost: 60 }
  },
  [ARCHER_ID]: {
    exclude: false,
    properties: { manaCost: 60 }
  },
  [ANCIENT_UNIT_ID]: {
    exclude: false,
    properties: { manaCost: 50 }
  },
  [GLOP_UNIT_ID]: {
    exclude: false,
    properties: { manaCost: 80 }
  },
  [gripthulu_id]: {
    exclude: false,
    properties: { manaCost: 80 }
  },
  [BLOOD_GOLEM_ID]: {
    exclude: false,
    properties: { manaCost: 100 }
  },
  [POISONER_ID]: {
    exclude: false,
    properties: { manaCost: 100 }
  },
  [VAMPIRE_ID]: {
    exclude: false,
    properties: { manaCost: 150 }
  },
  [BLOOD_ARCHER_ID]: {
    exclude: false,
    properties: { manaCost: 130 }
  },
  [PRIEST_ID]: {
    exclude: false,
    properties: { manaCost: 130 }
  },
  [SUMMONER_ID]: {
    exclude: false,
    properties: { manaCost: 150 }
  },
  [GHOST_ARCHER_ID]: {
    exclude: false,
    properties: { manaCost: 180 }
  },
  [MANA_VAMPIRE_ID]: {
    exclude: false,
    properties: { manaCost: 180 }
  },
  [DARK_SUMMONER_ID]: {
    exclude: false,
    properties: { manaCost: 210 }
  },
  [DARK_PRIEST_ID]: {
    exclude: false,
    properties: { manaCost: 210 }
  },
  [bossmasonUnitId]: {
    exclude: false,
    properties: { manaCost: 400 }
  },
  'Spellmason': {
    exclude: false,
    properties: {}
  },
}
export default function makeSpellForUnitId(unitId: string, asMiniboss: boolean, difficulty?: number): Spell | undefined {
  const override = overrides[unitId];
  const sourceUnit = allUnits[unitId];
  if (!sourceUnit) {
    console.error('Could not find source unit for ', unitId);
    return undefined;
  }
  if (override && override.exclude) {
    return undefined;
  }
  const unitAppearsAtLevelIndex = sourceUnit.spawnParams?.unavailableUntilLevelIndex || 1;
  let rarity = CardRarity.COMMON;
  if (unitAppearsAtLevelIndex < 4) {
    rarity = CardRarity.COMMON
  } else if (unitAppearsAtLevelIndex < 6) {
    rarity = CardRarity.SPECIAL;
  } else if (unitAppearsAtLevelIndex < 8) {
    rarity = CardRarity.UNCOMMON;
  } else if (unitAppearsAtLevelIndex < 10) {
    rarity = CardRarity.RARE;
  } else {
    rarity = CardRarity.FORBIDDEN;
  }

  const expenseScaling = 2;
  const manaCost = override?.properties.manaCost ? (override.properties.manaCost * (asMiniboss ? 1.5 : 1)) : Math.max(1, Math.round(2 * Math.log2((sourceUnit.spawnParams?.budgetCost || 1)))) * 30 * (asMiniboss ? 1.5 : 1);
  const id = Unit.unitSourceIdToName(unitId, asMiniboss);
  const unitSource = allUnits[unitId];
  let unitStats = '';

  if (unitSource) {
    let damage = unitSource.unitProps.damage || 0;
    let healthMax = unitSource.unitProps.healthMax || config.UNIT_BASE_HEALTH;
    let manaMax = unitSource.unitProps.manaMax || 0;
    let manaPerTurn = unitSource.unitProps.manaPerTurn || 0;
    if (difficulty && unitSource) {
      const adjustedUnitProps = Unit.adjustUnitPropsDueToDifficulty(unitSource, difficulty);
      healthMax = adjustedUnitProps.healthMax;
      manaMax = adjustedUnitProps.manaMax;
    }

    if (asMiniboss) {
      damage *= config.UNIT_MINIBOSS_DAMAGE_MULTIPLIER;
      healthMax *= config.UNIT_MINIBOSS_HEALTH_MULTIPLIER;
      manaMax *= config.UNIT_MINIBOSS_MANA_MULTIPLIER;
      manaPerTurn *= config.UNIT_MINIBOSS_MANA_MULTIPLIER;
    }

    unitStats = `${!!unitSource.unitProps.damage ? `
🗡️ ${damage} ${i18n(['damage'])}` : ''}${!!unitSource.unitProps.attackRange ? `
🎯 ${unitSource.unitProps.attackRange} ${i18n(['attack range'])}` : ''}
❤️ ${healthMax} ${i18n(['health capacity'])}${manaMax ? `
🔵 ${manaMax} + ${manaPerTurn} ${i18n('Mana')} ${i18n('per turn')}` : ''}`;
  }

  return {
    card: {
      id,
      category: CardCategory.Soul,
      sfx: 'summonDecoy',
      supportQuantity: true,
      // Make mana cost dependent on how late they show up in the game
      manaCost,
      healthCost: 0,
      expenseScaling,
      // These cards are not available as upgrades and must be accessed through capture_soul
      probability: 0,
      thumbnail: `spellIconSummon_${unitId.split(' ').join('').toLowerCase()}.png`,
      description: i18n([`spell_summon_generic`, unitId, expenseScaling.toString()]) + '\n' + unitStats,
      allowNonUnitTarget: true,
      effect: async (state, card, quantity, underworld, prediction) => {
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
              isMiniboss: asMiniboss,
              strength: quantity,
            },
            underworld,
            prediction
          );
          unit.healthMax *= quantity;
          unit.health *= quantity;
          unit.damage *= quantity;
          addUnitTarget(unit, state);

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
}
