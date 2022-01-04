import type { ICard } from ".";
import type { IUnit } from "../Unit";


function calculateManaCost(cards: Pick<ICard, "manaCost" | "manaMultiplier">[]) {
    let manaCost = 0;
    for (let card of cards) {
        manaCost += card.manaCost;
        manaCost *= card.manaMultiplier;
    }
    return manaCost;
}
export function calculateManaHealthCost(cards: Pick<ICard, "manaCost" | "manaMultiplier">[], caster: Pick<IUnit, "mana">)
    : { manaCost: number, healthCost: number } {
    const manaCost = calculateManaCost(cards);
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