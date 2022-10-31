import { IUnit } from "../entity/Unit";

export interface Modifier {
    [key: string]: any;
    isCurse: boolean;
    quantity: number;
}
// Returns the unit's modifier object for a given key
// Will initialize a modifier if it doesn't currently exist
export function getOrInitModifier(unit: IUnit, key: string, { isCurse, quantity, ...rest }: Modifier, firstTimeSetup: () => void): Modifier {
    let modifier = unit.modifiers[key];
    if (!modifier) {
        modifier = {
            isCurse,
            quantity: 0,
            ...rest
        };
        firstTimeSetup();
        unit.modifiers[key] = modifier;
    }
    modifier.quantity += quantity;
    return modifier;
}