import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import * as colors from './graphics/ui/colors';
import floatingText from "./graphics/FloatingText";
import { clone } from "./jmath/Vec";

export const corpseDecayId = 'Corpse Decay';
export default function registerCorpseDecay() {
    registerModifiers(corpseDecayId, {
        add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
            const modifier = getOrInitModifier(unit, corpseDecayId, { isCurse: true, quantity, persistBetweenLevels: false }, () => {
                // Add event
                if (!unit.onTurnEndEvents.includes(corpseDecayId)) {
                    unit.onTurnEndEvents.push(corpseDecayId);
                }
            });
            modifier.turnsLeftToLive = 1;

            if (!prediction) {
                // Temporarily use floating text until spell animation is finished
                floatingText({ coords: unit, text: corpseDecayId });
                updateTooltip(unit);
            }
        }
    });
    registerEvents(corpseDecayId, {
        onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
            const modifier = unit.modifiers[corpseDecayId];
            if (!prediction) {
                if (modifier) {
                    // Decrement the turns left to live
                    modifier.turnsLeftToLive -= 1;
                    updateTooltip(unit);
                    // Ensure the unit is still dead, don't remove resurrected unitsn
                    if (!unit.alive) {
                        if (modifier.turnsLeftToLive <= 0) {
                            floatingText({
                                coords: clone(unit), text: `Corpse Decayed!`,
                                style: { fill: colors.healthRed },
                            });
                            Unit.cleanup(unit, false);
                        }
                    } else {
                        Unit.removeModifier(unit, corpseDecayId, underworld)
                    }
                } else {
                    console.error(`Should have ${corpseDecayId} modifier on unit but it is missing`);
                }
            }
            return;
        },
    });
}
export function updateTooltip(unit: Unit.IUnit) {
    if (unit.modifiers[corpseDecayId]) {
        // Set tooltip:
        unit.modifiers[corpseDecayId].tooltip = `${unit.modifiers[corpseDecayId].turnsLeftToLive} turns until decay`;
    }
}
