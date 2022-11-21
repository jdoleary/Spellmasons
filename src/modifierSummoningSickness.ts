import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';

export const summoningSicknessId = 'summoningSickness';
export default function registerSummoningSickness() {
    registerModifiers(summoningSicknessId, {
        add: (unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1) => {
            getOrInitModifier(unit, summoningSicknessId, { isCurse: true, quantity }, () => {
                // Immediately set stamina to 0 so they can't move
                unit.stamina = 0;
                // Add event
                if (!unit.onTurnStartEvents.includes(summoningSicknessId)) {
                    unit.onTurnStartEvents.push(summoningSicknessId);
                }
                if (!unit.onTurnEndEvents.includes(summoningSicknessId)) {
                    unit.onTurnEndEvents.push(summoningSicknessId);
                }
            });
        }
    });
    registerEvents(summoningSicknessId, {
        onTurnStart: async (unit: Unit.IUnit, _prediction: boolean, underworld: Underworld) => {
            // Ensure that the unit cannot move with summoning sickness
            // (even when players' turns are ended they can still act so long
            // as it is underworld.turn_phase === turn_phase.PlayerTurns, this is because all players act simultaneously
            // during that phase, so setting stamina to 0
            // prevents players from moving when they have summoning sickness)
            // and then returning true also ends their turn.
            unit.stamina = 0;
            // Unit.removeModifier(unit, summoningSicknessId, underworld);
            // Skip turn
            return true;
        },
        onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld) => {
            Unit.removeModifier(unit, summoningSicknessId, underworld);
        }
    });
}