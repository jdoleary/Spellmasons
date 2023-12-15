import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import * as Pickup from '../entity/Pickup';
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
        subsprite: {
            imageName,
            alpha: 1.0,
            anchor: {
                x: 0.5,
                y: 0.5,
            },
            scale: {
                x: 1,
                y: 1,
            },
        },
    },
    events: {
        onTurnEnd: async (unit: Unit.IUnit, prediction: boolean, underworld: Underworld) => {
            // Decrement how many turns left the unit is frozen
            const modifier = unit.modifiers[id];
            if (modifier) {
                if (modifier.quantity > 0) {
                    Unit.takeDamage(unit, 30, undefined, underworld, prediction);
                }
                modifier.quantity--;
            }
        },
    },
};

function add(unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1) {
    getOrInitModifier(unit, id, { isCurse: true, quantity }, () => {
        // Add event
        if (!unit.onTurnEndEvents.includes(id)) {
            unit.onTurnEndEvents.push(id);
        }

        // Add subsprite image
        Image.addSubSprite(unit.image, imageName);
    });
}

export default spell;
