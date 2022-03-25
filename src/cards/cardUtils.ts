import type { ICard } from ".";
import * as config from '../config';
import type { IPlayer } from "../Player";

export function calculateManaCostForSingleCard(card: ICard, timesUsedSoFar: number = 0): number {
    let cardManaCost = 0
    cardManaCost += cardTypeToManaCost(card.type);
    // || 0 protects against multiplying by undefined
    // + 2 because log2(2) == 1 so 2 should be the starting number for the first time a user casts; so if 
    // the usage count is 1 (the caster has already used it once), we get log2(3) which is 1.58
    // --
    // timesUsedSoFar is the number of times a card has (or will be if were calculating mana cost for a future cast)
    // been used. It makes cards more expensive to use over and over
    cardManaCost *= Math.log2(timesUsedSoFar + 2);
    // manaCost should be a whole number for the sake of the player experience
    return Math.floor(cardManaCost);
}
export function calculateManaCost(cards: ICard[], distance: number, caster: IPlayer): number {
    let manaCost = 0;
    // Tallys how many times a card has been used as the cards array is iterated
    // this is necessary so that if you cast 3 consecutive spells of the same id
    // in one cast, each subsequent one will become more expensive
    const thisCalculationUsage: { [cardId: string]: number } = {};
    for (let card of cards) {
        if (!thisCalculationUsage[card.id]) {
            thisCalculationUsage[card.id] = 0;
        }
        manaCost += calculateManaCostForSingleCard(card, (caster.cardUsageCounts[card.id] || 0) + thisCalculationUsage[card.id]);
        thisCalculationUsage[card.id] += 1;
    }
    // Distance multiplier may not be less than 1
    // because it would be undesireable for spells cast on or close to one's self to be cheaper.
    manaCost *= distanceToManaMultiplier(distance);
    // manaCost should be a whole number for the sake of the player experience
    manaCost = Math.floor(manaCost);
    return manaCost;
}
export function _getCardsFromIds(cardIds: string[], cards: { [cardId: string]: ICard }): ICard[] {
    const result = []
    // Note: it is important that this function be able to return multiple copies of the same card
    // or else players wont be able to combine spells with multiple instances of the same card
    for (let id of cardIds) {
        result.push(cards[id]);
    }
    return result;
}

// Mana thoughts: https://docs.google.com/spreadsheets/d/151O_cXNhITsg4yImNy3xhYfFsCRff2-EZz0zX0hD5zY/edit#gid=0
export enum CardType {
    Common,
    Special,
    Powerful,
    Forbidden
}
export function cardTypeToProbability(cardType: CardType): number {
    return {
        [CardType.Common]: 50,
        [CardType.Special]: 10,
        [CardType.Powerful]: 5,
        [CardType.Forbidden]: 1,
    }[cardType]
}
export function cardTypeToManaCost(cardType: CardType): number {
    return {
        [CardType.Common]: 10,
        [CardType.Special]: 20,
        [CardType.Powerful]: 50,
        [CardType.Forbidden]: 80,
    }[cardType]
}
export function distanceToManaMultiplier(distance: number): number {
    if (distance < config.DISTANCE_FAR) {
        return 1;
    } else if (distance < config.DISTANCE_VERY_FAR) {
        return 1.5;
    } else {
        return 2;
    }
}