import type { ICard } from ".";
import * as config from '../config';
import type { CardUsage, IPlayer } from "../Player";
export interface CardCost {
    manaCost: number;
    healthCost: number;
}
export function calculateCostForSingleCard(card: ICard, timesUsedSoFar: number = 0): CardCost {
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
    return cardCost
}
export function calculateCost(cards: ICard[], casterCardUsage: CardUsage): CardCost {
    let cost: CardCost = { manaCost: 0, healthCost: 0 };
    // Tallys how many times a card has been used as the cards array is iterated
    // this is necessary so that if you cast 3 consecutive spells of the same id
    // in one cast, each subsequent one will become more expensive
    const thisCalculationUsage: { [cardId: string]: number } = {};
    for (let card of cards) {
        if (!thisCalculationUsage[card.id]) {
            thisCalculationUsage[card.id] = 0;
        }
        const singleCardCost = calculateCostForSingleCard(card, (casterCardUsage[card.id] || 0) + (thisCalculationUsage[card.id] || 0));
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

// Mana thoughts: https://docs.google.com/spreadsheets/d/151O_cXNhITsg4yImNy3xhYfFsCRff2-EZz0zX0hD5zY/edit#gid=0
export function distanceToManaMultiplier(distance: number): number {
    if (distance < config.DISTANCE_FAR) {
        return 1;
    } else if (distance < config.DISTANCE_VERY_FAR) {
        return 1.5;
    } else {
        return 2;
    }
}