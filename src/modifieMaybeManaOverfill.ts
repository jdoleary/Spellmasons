import seedrandom from "seedrandom";
import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import { maybeManaOverfillProportionChance } from "./config";
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import Underworld from './Underworld';

export const maybeManaOverfillId = 'Maybe Mana Overfill';
export default function registerSummoningSickness() {
    registerModifiers(maybeManaOverfillId, {
        add: (unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1) => {
            getOrInitModifier(unit, maybeManaOverfillId, { isCurse: false, quantity, persistBetweenLevels: true }, () => {
                // Add event
                if (!unit.onTurnStartEvents.includes(maybeManaOverfillId)) {
                    unit.onTurnStartEvents.push(maybeManaOverfillId);
                }
            });
        }
    });
    registerEvents(maybeManaOverfillId, {
        onTurnStart: async (unit: Unit.IUnit, prediction: boolean, underworld: Underworld) => {
            const quantity = unit.modifiers[maybeManaOverfillId]?.quantity || 1;
            // Seeded random based on the turn so it's consistent across all clients
            const random = seedrandom(`${underworld.seed}-${underworld.levelIndex}-${underworld.turn_number}`);
            const pick = random.quick();
            const doGiveOverfill = pick <= maybeManaOverfillProportionChance * quantity;
            if (doGiveOverfill && !prediction) {
                unit.mana += unit.manaMax;
                floatingText({ coords: unit, text: `Perk Applied! ${maybeManaOverfillId}` });
            }
            // Do not skip turn
            return false;
        },
    });
}