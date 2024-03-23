import { IUnit } from "../entity/Unit";

export interface Modifier {
    [key: string]: any;
    isCurse: boolean;
    quantity: number;
    // If true, the modifier will not be removed from the unit on death 
    keepOnDeath?: boolean;
    // If true, the modifier will not be removed in resetPlayerForNextLevel 
    keepBetweenLevels?: boolean;
}
// Returns the unit's modifier object for a given key
// Will initialize a modifier if it doesn't currently exist
export function getOrInitModifier(unit: IUnit, key: string, { isCurse, quantity, keepOnDeath = false, keepBetweenLevels = false, ...rest }: Modifier, firstTimeSetup: () => void): Modifier {
    let modifier = unit.modifiers[key];
    if (!modifier) {
        modifier = {
            // ...rest is added first so that it doesn't override other explicit
            // properties, for example, when copied from contaminate
            ...rest,
            isCurse,
            quantity: 0,
            keepOnDeath,
            keepBetweenLevels,
        };
        firstTimeSetup();
        unit.modifiers[key] = modifier;
    }
    modifier.quantity += quantity;
    return modifier;
}