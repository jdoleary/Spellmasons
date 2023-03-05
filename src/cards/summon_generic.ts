import { addUnitTarget, refundLastSpell, Spell } from './index';
import * as Unit from '../entity/Unit';
import { CardCategory, Faction, UnitType } from '../types/commonTypes';
import { allUnits } from '../entity/units';
import { skyBeam } from '../VisualEffects';
import { playDefaultSpellSFX } from './cardUtils';
import { addWarningAtMouse } from '../graphics/PlanningView';
import { CardRarity } from '../types/commonTypes';
import { bossmasonUnitId } from '../entity/units/deathmason';


const overrides: { [unitId: string]: { exclude: boolean, properties: { manaCost?: number } } } = {
    'decoy': {
        exclude: true,
        properties: {}
    },
    'Bossmason': {
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
export default function makeSpellForUnitId(unitId: string, asMiniboss: boolean): Spell | undefined {
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

    const expenseScaling = 5;
    let manaCost = (sourceUnit.spawnParams?.budgetCost || 1) * 40 * (asMiniboss ? 2 : 1);
    if (unitId == bossmasonUnitId) {
        manaCost = 1200;
    }

    return {
        card: {
            id: unitId + (asMiniboss ? ' Miniboss' : ''),
            category: CardCategory.Soul,
            sfx: 'summonDecoy',
            supportQuantity: false,
            // Make mana cost dependent on how late they show up in the game
            manaCost,
            healthCost: 0,
            expenseScaling,
            // These cards are not available as upgrades and must be accessed through capture_soul
            probability: 0,
            thumbnail: `spellIconSummon_${unitId.split(' ').join('').toLowerCase()}.png`,
            description: [`spell_summon_generic`, unitId, expenseScaling.toString()],
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
                        sourceUnit.unitProps,
                        underworld,
                        prediction
                    );
                    if (asMiniboss) {
                        Unit.makeMiniboss(unit);
                    }
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
