import type { ICard } from ".";
import { SPELL_DISTANCE_MANA_DENOMINATOR } from "../config";
import type { IUnit } from "../Unit";

function calculateManaCost(cards: Pick<ICard, "manaCost" | "manaMultiplier">[], distanceMultiplier: number) {
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
export function calculateManaHealthCost(cards: Pick<ICard, "manaCost" | "manaMultiplier">[], caster: Pick<IUnit, "mana">, distance: number)
    : { manaCost: number, healthCost: number } {
    const manaCost = calculateManaCost(cards, distance / SPELL_DISTANCE_MANA_DENOMINATOR);
    if (manaCost <= caster.mana) {
        return { manaCost: manaCost, healthCost: 0 };
    } else {
        // Allow units to cast spells that cost more mana than they have
        // which will subtract the remainder from their health
        return { manaCost: caster.mana, healthCost: manaCost - caster.mana };
    }

}

// For testing only
export const testables = {
    calculateManaCost
}