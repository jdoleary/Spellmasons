import type { ICard } from ".";
import * as config from '../config';

export function calculateManaCost(cards: ICard[], distance: number) {
    let manaCost = 0;
    for (let card of cards) {
        manaCost += cardTypeToManaCost(card.type);
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
        [CardType.Powerful]: 30,
        [CardType.Forbidden]: 40,
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