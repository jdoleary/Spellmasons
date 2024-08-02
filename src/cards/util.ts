import { allModifiers } from ".";
import { IUnit } from "../entity/Unit";

export interface Modifier {
    [key: string]: any;
    isCurse: boolean;
    quantity: number;
    // If true, the modifier will not be removed from the unit on death 
    keepOnDeath?: boolean;
}
// Returns the unit's modifier object for a given key
// Will initialize a modifier if it doesn't currently exist
export function getOrInitModifier(unit: IUnit, key: string, { isCurse, quantity, keepOnDeath = false, ...rest }: Modifier, firstTimeSetup: () => void): Modifier {
    let modifier = unit.modifiers[key];
    if (!modifier) {
        modifier = {
            // ...rest is added first so that it doesn't override other explicit
            // properties, for example, when copied from contaminate
            ...rest,
            isCurse,
            quantity: 0,
            keepOnDeath,
        };
        firstTimeSetup();
        unit.modifiers[key] = modifier;
    }
    modifier.quantity += quantity;
    // Auto tooltip for modifiers with `unitOfMeasure`
    const modifierSource = allModifiers[key];
    if (modifierSource && modifierSource.unitOfMeasure) {
        modifier.tooltip = `${i18n(key)}: ${quantityWithUnit(modifier.quantity, modifierSource.unitOfMeasure)}`
    }
    return modifier;
}
export function quantityWithUnit(quantity: number, unitOfMeasure: string | undefined): string {
    if (!unitOfMeasure) {
        return quantity.toString();
    }
    // Add space for non `%` unitOfMeasures
    const unit = unitOfMeasure === '%' ? '%' : ' ' + unitOfMeasure;
    return `${quantity}${unit}`;
}