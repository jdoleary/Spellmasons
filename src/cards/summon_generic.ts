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
            manaCost: 80
        }
    },
    'vampire': {
        exclude: false,
        properties: {
            manaCost: 100
        }
    },
    'summoner': {
        exclude: false,
        properties: {
            manaCost: 120
        }
    }
}
export default function makeSpellForUnitId(unitId: string): Spell | undefined {
    const override = overrides[unitId];
    if (override && override.exclude) {
        return undefined;
    }
    return {
        card: {
            id: unitId,
            category: CardCategory.Soul,
            sfx: 'summonDecoy',
            supportQuantity: false,
            manaCost: override?.properties?.manaCost !== undefined ? override.properties.manaCost : 60,
            healthCost: 0,
            expenseScaling: 3,
            probability: probabilityMap[CardRarity.SPECIAL],
            thumbnail: `spellIconSummon${unitId}.png`,
            description: `
Summons a ${unitId} to fight for your faction.
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
