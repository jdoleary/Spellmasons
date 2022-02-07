import type { ICard } from ".";

export function calculateManaCost(cards: Pick<ICard, "manaCost" | "manaMultiplier">[], distanceMultiplier: number) {
    let manaCost = 0;
    for (let card of cards) {
        manaCost += card.manaCost;
        manaCost *= card.manaMultiplier;
    }
    // Distance multiplier may not be less than 1
    // because it would be undesireable for spells cast on or close to one's self to be cheaper.
    manaCost *= Math.max(1, distanceMultiplier);
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
