import type { Mod } from "../../types/commonTypes";
import type { Events, Modifiers } from "../../cards";
import type { IUnit } from "../../entity/Unit";
import type Underworld from "../../Underworld";


const {
    FloatingText,
    Unit,
    JImage,
    cardsUtil,
} = globalThis.SpellmasonsAPI;
const { getOrInitModifier } = cardsUtil;
const id = "Temporary Strength"
const modifierShrink: Modifiers = {
    id,
    description: 'Unit gets stronger but slowly returns to previous strength every turn.',
    // addModifierVisuals,
    add: (unit: IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
        getOrInitModifier(unit, id, { isCurse: false, quantity, keepOnDeath: true }, () => {
            strengthen(unit, 3, prediction);
            Unit.addEvent(unit, id);
        });
    },
    // Note: Some remove logic is automatic such as removing
    // events associated with the modifier.  See Unit.removeModifier
    // for more information.
    // Custom remove logic can be triggered here when Unit.removeModifier
    // is called on this modifier's id
    remove: (unit: IUnit, underworld: Underworld) => {
        FloatingText.default({ coords: unit, text: `${id} removed!`, prediction: false });
    },
    // This is the relative probability that this modifier will be automatically
    // added to minibosses
    probability: 0,
};

function strengthen(unit: IUnit, strengthChange: number, prediction: boolean) {
    FloatingText.default({ coords: unit, text: id, prediction });
    unit.strength += strengthChange;
    JImage.setScaleFromModifiers(unit.image, unit.strength);
    unit.damage = Math.round(unit.damage + strengthChange * 10)
}
const shrinkEvent: Events = {
    id,
    onTurnEnd: async (unit: IUnit, underworld: Underworld, prediction: boolean) => {
        strengthen(unit, -1, prediction);
        // Remove the modifier once strength has decreased to 1
        if (unit.strength <= 1) {
            Unit.removeModifier(unit, id, underworld);
        }

    }
};


const mod: Mod = {
    modName: 'Sample Modifier',
    author: 'Jordan O\'Leary',
    description: "A sample mod for showing how to mod modifiers",
    screenshot: 'TODO',
    modifiers: [modifierShrink],
    events: [shrinkEvent],

};
export default mod;