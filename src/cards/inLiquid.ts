import { lavaDamage } from "../entity/Obstacle";
import { IUnit, takeDamage } from "../entity/Unit";
import { addMask, removeMask } from "../graphics/Image";
import type Underworld from "../Underworld";

// This is not a card, only a set of modifiers, but it's in the card folder because the rest of the cards' modifiers are too
export const id = 'inLiquid';
export function add(unit: IUnit, underworld: Underworld, prediction: boolean) {
    // First time setup
    if (!unit.modifiers[id]) {
        // not a curse so it can't be removed with purify
        unit.modifiers[id] = { isCurse: false };
        takeDamage(unit, lavaDamage, underworld, prediction);
        if (unit.image) {
            addMask(unit.image, 'liquid-mask');
        }
    }
}
export function remove(unit: IUnit) {
    if (unit.image) {
        removeMask(unit.image);
    }
}