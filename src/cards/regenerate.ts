import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import * as Pickup from '../entity/Pickup';
import floatingText from '../graphics/FloatingText';
import { Spell, refundLastSpell } from './index';
import { CardCategory, UnitType } from '../types/commonTypes';
import * as config from '../config'
import type Underworld from '../Underworld';
import { playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';

export const id = 'regenerate';
const imageName = 'spellIconHeal.png';
var regenLen = 1;
const healAmount = 30;
const spell: Spell = {
    card: {
        id,
        category: CardCategory.Blessings,
        sfx: 'heal',
        supportQuantity: true,
        manaCost: 25,
        healthCost: 0,
        cooldown: 2,
        expenseScaling: 3,
        mageTypes: ['Cleric'],
        probability: probabilityMap[CardRarity.COMMON],
        thumbnail: 'spellIconHeal.png',
        animationPath: 'spell-effects/potionPickup',
        description: ['spell_regenerate', regenLen.toString()],
        effect: async (state, card, quantity, underworld, prediction) => {
            // .filter: only target living units
            regenLen = quantity;
            const targets = state.targetedUnits.filter(u => u.alive);
            if (targets.length) {
                let spellAnimationPromise = Promise.resolve();
                targets.forEach(t => {
                    spellAnimationPromise = Image.addOneOffAnimation(t, 'spell-effects/potionPickup', {}, { loop: false, animationSpeed: 0.3 });
                })
                await Promise.all([spellAnimationPromise, playDefaultSpellSFX(card, prediction)]);
                for (let unit of targets) {
                    Unit.addModifier(unit, id, underworld, prediction, quantity);
                }
            } else {
                refundLastSpell(state, prediction);
            }
            return state;
        },
    },
    modifiers: {
        add,
    },
    events: {
        onTurnEnd: async (unit: Unit.IUnit, prediction: boolean, underworld: Underworld) => {
            // Decrement how many turns left the unit is frozen
            const modifier = unit.modifiers[id];
            if (modifier) {
                if (modifier.quantity > 0) {
                    Unit.takeDamage(unit, -healAmount, undefined, underworld, prediction);
                    Image.addOneOffAnimation(unit, 'spell-effects/potionPickup', {}, { loop: false, animationSpeed: 0.3 });
                    floatingText({
                        coords: unit,
                        text: `+${healAmount} Health`
                    });
                }
                modifier.quantity--;
                if (modifier.quantity <= 0) {
                    Unit.removeModifier(unit, id, underworld);
                }
            }
        },
    },
};

function add(unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1) {
    getOrInitModifier(unit, id, { isCurse: false, quantity }, () => {
        // Add event
        if (!unit.onTurnEndEvents.includes(id)) {
            unit.onTurnEndEvents.push(id);
        }
    });
}

export default spell;
