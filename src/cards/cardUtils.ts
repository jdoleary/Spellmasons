import type { ICard } from ".";
import { type CardUsage, type IPlayer } from "../entity/Player";
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
import { runeArcherId } from "../modifierArcher";
import { runeNecromancerId } from "../modifierNecromancer";
import { runeClericId } from "../modifierCleric";
import { runeWitchId } from "../modifierWitch";
export interface CardCost {
    manaCost: number;
    healthCost: number;
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
                    Image.hide(image)
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
    let cardCost = { manaCost: 0, healthCost: 0 }
    cardCost.manaCost += card.manaCost;
    cardCost.healthCost += card.healthCost;
    // || 0 protects against multiplying by undefined
    // + 2 because log2(2) == 1 so 2 should be the starting number for the first time a user casts; so if 
    // the usage count is 1 (the caster has already used it once), we get log2(3) which is 1.58
    // --
    // timesUsedSoFar is the number of times a card has (or will be if were calculating mana cost for a future cast)
    // been used. It makes cards more expensive to use over and over
    const multiplier = Math.log2(timesUsedSoFar + 2);
    cardCost.manaCost *= multiplier;
    cardCost.healthCost *= multiplier;

    // cost should be a whole number for the sake of the player experience
    cardCost.manaCost = Math.floor(cardCost.manaCost);
    cardCost.healthCost = Math.floor(cardCost.healthCost);

    // Handle unique changes due to player mageType
    if (caster) {
        if (caster.unit.modifiers['Bloodmason']) {
            if (card.id === lastWill.id) {
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
        } else if (caster.unit.modifiers[runeNecromancerId]) {
            if (card.id == captureSoul.id) {
                cardCost.healthCost = 40;
                cardCost.manaCost = 0;
            } else if (Object.keys(allUnits).includes(card.id.replace(' Miniboss', ''))) {
                // Make summon spells discounted
                cardCost.manaCost = Math.floor(cardCost.manaCost * 0.7);
            }
        } else if (caster.unit.modifiers[runeClericId] && card.category == CardCategory.Blessings) {
            cardCost.manaCost = Math.floor(cardCost.manaCost / 2);
        } else if (caster.unit.modifiers[runeWitchId] && card.category == CardCategory.Curses) {
            cardCost.manaCost = Math.floor(cardCost.manaCost * 0.8);
        } else if (caster.unit.modifiers[runeArcherId] && card.id.toLowerCase().includes('arrow')) {
            // Freeze mana cost for archer MageType
            cardCost.manaCost = card.manaCost;
        }
    }

    return cardCost
}
export function calculateCost(cards: ICard[], casterCardUsage: CardUsage, caster?: IPlayer): CardCost {
    let cost: CardCost = { manaCost: 0, healthCost: 0 };
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
        thisCalculationUsage[card.id] += 1;
    }
    // cost should be a whole number for the sake of the player experience
    cost.manaCost = Math.floor(cost.manaCost);
    cost.healthCost = Math.floor(cost.healthCost);
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