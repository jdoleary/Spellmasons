import { addUnitTarget, Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardCategory, Faction, UnitType } from '../types/commonTypes';
import { allUnits } from '../entity/units';
import { skyBeam } from '../VisualEffects';
import { playDefaultSpellSFX } from './cardUtils';
import floatingText from '../graphics/FloatingText';
import { addWarningAtMouse } from '../graphics/PlanningView';
import { CardRarity, probabilityMap } from '../types/commonTypes';


const overrides: { [unitId: string]: { exclude: boolean, properties: { manaCost?: number } } } = {
    'decoy': {
        exclude: true,
        properties: {}
    },
    'Spellmason': {
        exclude: true,
        properties: {}
    },
    'glop': {
        exclude: false,
        properties: {
        }
    },
    'vampire': {
        exclude: false,
        properties: {
        }
    },
    'summoner': {
        exclude: false,
        properties: {
        }
    }
}
export default function makeSpellForUnitId(unitId: string): Spell | undefined {
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


    return {
        card: {
            id: unitId,
            category: CardCategory.Soul,
            sfx: 'summonDecoy',
            supportQuantity: false,
            // Make mana cost dependent on how late they show up in the game
            manaCost: Math.max(60, (sourceUnit.spawnParams?.unavailableUntilLevelIndex || 1) * 20),
            healthCost: 0,
            expenseScaling: 3,
            probability: probabilityMap[rarity],
            thumbnail: `spellIconSummon${unitId}.png`,
            description: `
Summons ${unitId[0]?.toLowerCase() == 'a' ? `an ${unitId}` : `a ${unitId}`} to fight for your faction.
    `,
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
                            floatingText({ coords: summonLocation, text: 'Invalid summon location!', style: { fill: 'red' } });
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
                        sourceUnit.unitProps,
                        underworld,
                        prediction
                    );
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
