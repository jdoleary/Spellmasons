import type { ICard, Modifiers } from ".";
import { isDeathmason, isGoru, type CardUsage, type IPlayer } from "../entity/Player";
import { Vec2 } from "../jmath/Vec";
import { raceTimeout } from "../Promise";
import * as Image from '../graphics/Image';
import { containerProjectiles, containerSpells } from "../graphics/PixiUtils";
import * as captureSoul from '../cards/capture_soul';
import * as lastWill from '../cards/lastwill';
import { Container } from "pixi.js";
import { chooseOneOf } from "../jmath/rand";
import Underworld from "../Underworld";
import { CardCategory } from "../types/commonTypes";
import { allUnits } from "../entity/units";
import { endlessQuiverId } from "../modifierEndlessQuiver";
import { runeNecromancerId } from "../modifierNecromancer";
import { affinityBlessingId } from "../modifierAffinityBlessing";
import { affinityCurseId } from "../modifierAffinityCurse";
import { affinityDamageId } from "../modifierAffinityDamage";
import { affinityMovementId } from "../modifierAffinityMovement";
import { affinityTargeting } from "../modifierAffinityTargeting";
import { affinitySoulId } from "../modifierAffinitySoul";
import { contaminate_id } from "./contaminate";
import { runeWitchId } from "../modifierWitch";
import { inexhaustibleId } from "../modifierInexhaustible";
import { runeBloodWarlockId } from "../modifierBloodWarlock";
import { precisionId } from "../modifierPrecision";
import * as Cards from "../cards";
import { IUnit } from "../entity/Unit";
import { fairIsFairId, soulmuncherId, witchyVibesId } from "../modifierDeathmasonConstants";
import Events from "../Events";

export interface CardCost {
    manaCost: number;
    healthCost: number;
    staminaCost: number;
    soulFragmentCost?: number;
}
export function isRune(m?: Modifiers): boolean {
    return !!(m && (m._costPerUpgrade || m.keepBetweenLevels));
}
// Positive number means card is still disabled
export function levelsUntilCardIsEnabled(cardId: string, underworld?: Underworld): number {
    if (!globalThis.player || !underworld) {
        return 0;
    }
    const cardState = globalThis.player.spellState[cardId] || {};
    return (cardState.disabledUntilLevel || 0) - underworld.levelIndex

}
export function playSpellSFX(sfxKey: string, prediction: boolean) {
    if (globalThis.headless) {
        return;
    }
    // Play the card sound effect:
    if (!prediction && sfxKey) {
        if (globalThis.playSFX && globalThis.sfx) {
            globalThis.playSFX(chooseOneOf(globalThis.sfx[sfxKey]));
        }
    }
}
export function playDefaultSpellSFX(card: ICard, prediction: boolean) {
    if (globalThis.headless) {
        return;
    }
    // Play the card sound effect:
    if (!prediction && card.sfx) {
        if (globalThis.playSFX && globalThis.sfx) {
            globalThis.playSFX(chooseOneOf(globalThis.sfx[card.sfx]));
        }
    }
}
export async function playDefaultSpellAnimation(card: ICard, targets: Vec2[], prediction: boolean) {
    if (globalThis.headless) {
        return Promise.resolve();
    }
    let promises = [];
    for (let target of targets) {
        // Animate the card for each target
        if (!prediction) {
            if (card.animationPath) {
                promises.push(animateSpell(target, card.animationPath));
            } else {
                console.log('Card', card.id, 'has no animation path')
            }
        }
    }
    return Promise.all(promises);
}
export async function animateSpell(target: Vec2, imagePath: string): Promise<void> {
    if (globalThis.headless) {
        return Promise.resolve();
    }
    if (imagePath.indexOf('.png') !== -1) {
        console.error(`Cannot animate a still image ${imagePath}, this function requires an animation path or else it will not "hide when complete"`);
        return Promise.resolve();
    }
    // This timeout value is arbitrary, meant to prevent and report an await hang
    // if somehow resolve is never called
    return raceTimeout(6000, `animateSpell: ${imagePath}`, new Promise<void>((resolve) => {
        // Poison effect goes in containerProjectiles so that it doesn't get cleared with other spells
        // For example, it can be cast by a poisoner as part of the poisoners projectile
        // and it works in the projectileContainer when cast by a player too
        oneOffImage(target, imagePath, containerProjectiles, resolve);
    }));
}
// Not to be confused with addOneOffAnimation
// The main difference is that this function is not async and returns the image
export function oneOffImage(coords: Vec2, imagePath: string, parent: Container | undefined, resolver?: () => void): Image.IImageAnimated | undefined {
    if (globalThis.headless) {
        // Resolve immediately, headless does not have visuals and
        // so it should resolve any promise that awaits the completion
        // of an animation immediately.
        if (resolver) {
            resolver();
        }
        return
    } else {
        const image = Image.create(
            coords,
            imagePath,
            parent,
            {
                loop: false,
                animationSpeed: 0.15,
                onComplete: () => {
                    Image.hide(image);
                    Image.cleanup(image);
                    if (resolver) {
                        resolver();
                    }
                }
            }
        );
        if (image) {
            image.resolver = resolver;
        }
        return image;
    }
}
// @ts-ignore: for menu
globalThis.calculateCostForSingleCard = calculateCostForSingleCard
export function calculateCostForSingleCard(card: ICard, timesUsedSoFar: number = 0, caster?: IPlayer): CardCost {
    let cardCost: CardCost = { manaCost: 0, healthCost: 0, staminaCost: 0 };
    if (caster && isDeathmason(caster)) {
        // No non-charge cost for deathmasons, only charges
        return cardCost;
    }
    if (caster && isGoru(caster)) {
        // No non-charge cost for Goru, only soulFragment cost
        cardCost.soulFragmentCost = card.soulFragmentCostOverride ? card.soulFragmentCostOverride : Math.max(1, Math.floor(card.manaCost / 10));
        return cardCost;
    }
    cardCost.manaCost += card.manaCost;
    cardCost.healthCost += card.healthCost;
    cardCost.staminaCost += card.staminaCost || 0;
    // || 0 protects against multiplying by undefined
    // + 2 because log2(2) == 1 so 2 should be the starting number for the first time a user casts; so if 
    // the usage count is 1 (the caster has already used it once), we get log2(3) which is 1.58
    // --
    // timesUsedSoFar is the number of times a card has (or will be if were calculating mana cost for a future cast)
    // been used. It makes cards more expensive to use over and over
    const multiplier = card.costGrowthAlgorithm === 'nlogn'
        ? Math.max(1, (timesUsedSoFar + 1) * Math.log2(timesUsedSoFar + 1))
        : card.costGrowthAlgorithm === 'exponential'
            ? Math.pow(timesUsedSoFar + 1, 2)
            : Math.log2(timesUsedSoFar + 2);
    cardCost.manaCost *= multiplier;
    cardCost.healthCost *= multiplier;
    cardCost.staminaCost *= multiplier;

    // cost should be a whole number for the sake of the player experience
    cardCost.manaCost = Math.floor(cardCost.manaCost);
    cardCost.healthCost = Math.floor(cardCost.healthCost);
    cardCost.staminaCost = Math.floor(cardCost.staminaCost);

    // Handle unique changes due to player mageType
    if (caster) {

        // Prevents expense scaling: Spells will not increase in mana cost with usage
        // Must be done before other cost changes
        if (caster.unit.modifiers[endlessQuiverId] && card.id.toLowerCase().includes('arrow')) {
            // Freeze mana cost for arrows
            cardCost.manaCost = card.manaCost;
            cardCost.healthCost = card.healthCost;
            if (card.staminaCost)
                cardCost.staminaCost = card.staminaCost;
        }
        if (card.category == CardCategory.Movement && caster.unit.modifiers[inexhaustibleId]) {
            // Freeze mana cost for movement spells
            cardCost.manaCost = card.manaCost;
            cardCost.healthCost = card.healthCost;
            if (card.staminaCost)
                cardCost.staminaCost = card.staminaCost;
        }
        // Precision prevents cards from scaling in mana cost if the player has no targeting spells
        // .filter Filters out disabled cards, so you can sell targeting spells and still have precision work
        if (caster?.unit.modifiers[precisionId] && caster.inventory.filter(c => !caster.disabledCards.includes(c)).every(id => Cards.allCards[id]?.category !== CardCategory.Targeting)) {
            cardCost.manaCost = card.manaCost;
            cardCost.healthCost = card.healthCost;
            if (card.staminaCost)
                cardCost.staminaCost = card.staminaCost;
        }

        // Bloodmason
        if (caster.unit.modifiers['Bloodmason']) {
            if (card.id === lastWill.lastWillId) {
                // Just for fun, allow Bloodmason to still cast lastWill at a cost of 50%
                // of their health.  it's a gamble!
                cardCost.healthCost = Math.max(1, Math.floor(caster.unit.health / 2));
                cardCost.manaCost = 0;
            } else if (card.category == CardCategory.Blessings) {
                cardCost.healthCost = caster.unit.health;
                cardCost.manaCost = 0;
            } else {
                cardCost.healthCost = Math.ceil(cardCost.manaCost / 5);
                cardCost.manaCost = 0;
            }
        }

        // Necromancer grants an empowered capture soul and cheaper summons
        if (caster.unit.modifiers[runeNecromancerId]) {
            if (card.id == captureSoul.id) {
                cardCost.healthCost = 40;
                cardCost.manaCost = 0;
            } else if (Object.keys(allUnits).includes(card.id.replace(' Miniboss', ''))) {
                // Make summon spells discounted
                cardCost.manaCost = Math.floor(cardCost.manaCost * 0.7);
            }
        }

        // Witch grants a cheaper/empowered contaminate
        if (card.id == contaminate_id && caster.unit.modifiers[runeWitchId]) {
            cardCost.manaCost = Math.floor(cardCost.manaCost * 0.5);
        }

        // Affinity Modifiers - Reduce cost of spell by 1% per quantity
        if (card.category == CardCategory.Blessings && caster.unit.modifiers[affinityBlessingId]) {
            cardCost.manaCost = Math.floor(cardCost.manaCost * (1 - (0.01 * caster.unit.modifiers[affinityBlessingId].quantity)));
        }
        if (card.category == CardCategory.Curses && caster.unit.modifiers[affinityCurseId]) {
            cardCost.manaCost = Math.floor(cardCost.manaCost * (1 - (0.01 * caster.unit.modifiers[affinityCurseId].quantity)));
        }
        if (card.category == CardCategory.Damage && caster.unit.modifiers[affinityDamageId]) {
            cardCost.manaCost = Math.floor(cardCost.manaCost * (1 - (0.01 * caster.unit.modifiers[affinityDamageId].quantity)));
        }
        if (card.category == CardCategory.Movement && caster.unit.modifiers[affinityMovementId]) {
            cardCost.manaCost = Math.floor(cardCost.manaCost * (1 - (0.01 * caster.unit.modifiers[affinityMovementId].quantity)));
        }
        if (card.category == CardCategory.Soul && caster.unit.modifiers[affinitySoulId]) {
            cardCost.manaCost = Math.floor(cardCost.manaCost * (1 - (0.01 * caster.unit.modifiers[affinitySoulId].quantity)));
        }
        if (card.category == CardCategory.Targeting && caster.unit.modifiers[affinityTargeting]) {
            cardCost.manaCost = Math.floor(cardCost.manaCost * (1 - (0.01 * caster.unit.modifiers[affinityTargeting].quantity)));
        }

        // Runes that swap costs MUST come _after_ affinities to ensure the discount still works
        // Blood Warlock: Soul magic costs health instead of mana
        if (caster.unit.modifiers[runeBloodWarlockId] && card.category === CardCategory.Soul && cardCost.manaCost > 0) {
            cardCost.healthCost = Math.round(cardCost.manaCost * 0.5);
            cardCost.manaCost = 0;
        }

        const events = [...caster.unit.events];
        for (let eventName of events) {
            const fn = Events.onCostCalculationSource[eventName];
            if (fn && caster) {
                cardCost = fn(caster, card, timesUsedSoFar, cardCost);
            }
        }
        // If player has charge, use charge instead:
        if (caster && caster.unit.charges?.[card.id]) {
            cardCost.manaCost = 0;
            cardCost.healthCost = 0;
            cardCost.staminaCost = 0;
        }
    }

    return cardCost
}
export function calculateCost(cards: ICard[], casterCardUsage: CardUsage, caster?: IPlayer): CardCost {
    let cost: CardCost = { manaCost: 0, healthCost: 0, staminaCost: 0 };
    // Tallys how many times a card has been used as the cards array is iterated
    // this is necessary so that if you cast 3 consecutive spells of the same id
    // in one cast, each subsequent one will become more expensive
    const thisCalculationUsage: { [cardId: string]: number } = {};
    for (let card of cards) {
        if (!thisCalculationUsage[card.id]) {
            thisCalculationUsage[card.id] = 0;
        }
        const singleCardCost = calculateCostForSingleCard(card, (casterCardUsage[card.id] || 0) + (thisCalculationUsage[card.id] || 0), caster);
        cost.manaCost += singleCardCost.manaCost;
        cost.healthCost += singleCardCost.healthCost;
        cost.staminaCost += singleCardCost.staminaCost;
        thisCalculationUsage[card.id] = (thisCalculationUsage[card.id] || 0) + 1;
    }
    // cost should be a whole number for the sake of the player experience
    cost.manaCost = Math.floor(cost.manaCost);
    cost.healthCost = Math.floor(cost.healthCost);
    cost.staminaCost = Math.floor(cost.staminaCost);

    return cost;
}
export function _getCardsFromIds(cardIds: string[], cards: { [cardId: string]: ICard }): ICard[] {
    const result = []
    // Note: it is important that this function be able to return multiple copies of the same card
    // or else players wont be able to combine spells with multiple instances of the same card
    for (let id of cardIds) {
        const card = cards[id];
        if (card) {
            result.push(card);
        }
    }
    return result;
}

const getCardCostSum = (card: ICard) => card.manaCost + card.healthCost + (card.staminaCost || 0);
export function deathmasonCardProbabilities(cards: ICard[], unit: IUnit): { id: string, probability: number, card: ICard, cost: number }[] {
    const highestCostSum = cards.reduce((highest, cur) => {
        const cardCostSum = getCardCostSum(cur);
        return cardCostSum > highest ? cardCostSum : highest
    }, 0);
    const necroDeathCount = unit.modifiers[soulmuncherId];
    const witchyVibesCount = unit.modifiers[witchyVibesId];
    // Probability doesn't handle decimals so scale everything up so that 15 and 40 don't round down to be 10 and 40
    const scalar = 10;
    return cards.map(c => {
        // Default to highestCostSum to prevent division by 0.  That makes free cards like "Sell" ultra rare. This may need to be balanced away
        const cardCostSum = getCardCostSum(c) || highestCostSum;
        let probability = Math.round(scalar * highestCostSum / cardCostSum);
        // Set draw probabilities to equal
        if (unit.modifiers[fairIsFairId]) {
            probability = 1;
        }
        if (necroDeathCount && c.category == CardCategory.Soul) {
            probability *= (necroDeathCount.quantity + 1)
        }
        if (witchyVibesCount && c.category == CardCategory.Curses) {
            probability *= (witchyVibesCount.quantity + 1)
        }

        return ({ id: c.id, probability, card: c, cost: cardCostSum })
    });

}
