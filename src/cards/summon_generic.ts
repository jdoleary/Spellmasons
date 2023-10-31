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


const overrides: { [unitId: string]: { exclude: boolean, properties: { manaCost?: number } } } = {
    'decoy': {
        exclude: true,
        properties: {}
    },
    'Spellmason': {
        exclude: false,
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
    let manaCost = Math.max(1, Math.round(2 * Math.log2((sourceUnit.spawnParams?.budgetCost || 1)))) * 30 * (asMiniboss ? 2 : 1);
    if (unitId == bossmasonUnitId) {
        manaCost = 750;
    }
    let id = unitId + (asMiniboss ? ' Miniboss' : '');
    // Special case, must change name of upgrade for 'Spellmason' or else it conflicts with the mageType Spellmason upgrade
    if (unitId === spellmasonUnitId) {
        id = `${i18n('Summon')} ${spellmasonUnitId}` + (asMiniboss ? ' Miniboss' : '');
    }
    if (!globalThis.freeSpells) {
        globalThis.freeSpells = [];
    }
    globalThis.freeSpells.push(id);
    const unitSource = allUnits[unitId];
    let healthMax = unitSource?.unitProps.healthMax || config.UNIT_BASE_HEALTH;
    let manaMax = unitSource?.unitProps.manaMax || 0;
    if (difficulty && unitSource) {
        const adjustedUnitProps = Unit.adjustUnitPropsDueToDifficulty(unitSource, difficulty);
        healthMax = adjustedUnitProps.healthMax;
        manaMax = adjustedUnitProps.manaMax;
    }
    const unitStats = !unitSource ? '' : `${!!unitSource.unitProps.damage ? `
🗡️ ${unitSource.unitProps.damage} ${i18n(['damage'])}` : ''}${!!unitSource.unitProps.attackRange ? `
🎯 ${unitSource.unitProps.attackRange} ${i18n(['attack range'])}` : ''}
❤️ ${healthMax} ${i18n(['health capacity'])}
${manaMax ? `🔵 ${manaMax} + ${unitSource.unitProps.manaPerTurn} ${i18n('Mana')} ${i18n('per turn')}` : ''}`;

    return {
        card: {
            id,
            category: CardCategory.Soul,
            sfx: 'summonDecoy',
            supportQuantity: false,
            // Make mana cost dependent on how late they show up in the game
            manaCost,
            healthCost: 0,
            expenseScaling,
            cooldown: 0,
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
                        { ...sourceUnit.unitProps, isMiniboss: asMiniboss },
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
