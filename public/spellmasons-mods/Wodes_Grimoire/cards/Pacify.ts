/// <reference path="../../globalTypes.d.ts" />
import Underworld from '../../types/Underworld';
import type { Spell } from '../../types/cards/index';
import { IUnit } from '../../types/entity/Unit';
const {
    cardUtils,
    commonTypes,
    cards,
    cardsUtil,
} = globalThis.SpellmasonsAPI;

const { refundLastSpell } = cards;
const Unit = globalThis.SpellmasonsAPI.Unit;
const { playDefaultSpellSFX } = cardUtils;
const { CardCategory, probabilityMap, CardRarity } = commonTypes;

const cardId = 'Pacify';
const spell: Spell = {
    card: {
        id: cardId,
        category: CardCategory.Curses,
        supportQuantity: true,
        manaCost: 30,
        healthCost: 0,
        expenseScaling: 2,
        probability: probabilityMap[CardRarity.SPECIAL],
        thumbnail: 'spellmasons-mods/Wodes_Grimoire/graphics/icons/spelliconPacify.png',
        sfx: '',
        description: [`Prevents the target from attacking for one turn. Stacks increase duration. Does not affect Support Class units such as summoners or priests.`],
        timeoutMs: 20,
        effect: async (state, card, quantity, underworld, prediction) => {
            //Only filter unit thats are alive and can attack. u.unitSubType[3] presumed SUPPORT_CLASS, cant effect summoners, prists dont attack
            const targets = state.targetedUnits.filter(u => u.alive && !(u.unitSubType == 3));
            //Refund if targets no one that can attack
            if (targets.length == 0) {
                refundLastSpell(state, prediction, 'No target, mana refunded')
            } else {
                if (!prediction) {
                    playDefaultSpellSFX(card, prediction);
                }
                for (let unit of targets) {
                    Unit.addModifier(unit, card.id, underworld, prediction, quantity);
                }
            }
            return state;
        }
    },
    modifiers: {
        add,
        remove,

    },
    events: {
        onTurnEnd: async (unit: IUnit, underworld: Underworld, prediction: boolean) => {
            // Decrement how many turns left the unit is for pacify
            const modifier = unit.modifiers[cardId];
            if (modifier) {
                modifier.quantity--;
                if (modifier.quantity <= 0) {
                    Unit.removeModifier(unit, cardId, underworld);
                }
            }

        }
    }
};
function add(unit: IUnit, underworld: Underworld, prediction: boolean, quantity: number) {
    cardsUtil.getOrInitModifier(unit, cardId, {
        isCurse: true, quantity, persistBetweenLevels: false,
        originalstat: unit.attackRange,
    }, () => {
        //Register onTurnEndEvents
        if (!unit.onTurnEndEvents.includes(cardId)) {
            unit.onTurnEndEvents.push(cardId);
        }
        unit.attackRange = 0;
    });
}
function remove(unit: IUnit, underworld: Underworld) {
    //Give back ability to attack when debuff is gone
    if (unit.modifiers && unit.modifiers[cardId]) {
        const originalRange = unit.modifiers[cardId].originalstat;
        if (originalRange && unit.attackRange == 0) {
            unit.attackRange = originalRange;
        }
    }
}
export default spell;