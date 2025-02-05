import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import { UnitType } from "../types/commonTypes";
import Underworld from '../Underworld';

export const summoningSicknessId = 'summoningSickness';
export default function registerSummoningSickness() {
  registerModifiers(summoningSicknessId, {
    description: 'summoning_sickness_description',
    add: (unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1) => {
      // Only add summoning sickness to AI
      // Summoning sickness is only meant to prevent units from attacking 
      // the player without a pre warning attack badge - but if it gets added
      // to a player it will skip their turn which we do not want.
      if (unit.unitType == UnitType.PLAYER_CONTROLLED) {
        console.log('Prevented adding summoning sickness to player unit')
        return
      }
      getOrInitModifier(unit, summoningSicknessId, { isCurse: true, quantity }, () => {
        // Immediately set stamina to 0 so they can't move
        unit.stamina = 0;
        Unit.addEvent(unit, summoningSicknessId);
      });
    }
  });
  registerEvents(summoningSicknessId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      // Ensure that the unit cannot move with summoning sickness
      // (even when players' turns are ended they can still act so long
      // as it is underworld.turn_phase === turn_phase.PlayerTurns, this is because all players act simultaneously
      // during that phase, so setting stamina to 0
      // prevents players from moving when they have summoning sickness)
      // and then returning true also ends their turn.
      unit.stamina = 0;
    },
    onTurnEnd: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      Unit.removeModifier(unit, summoningSicknessId, underworld);
    }
  });
}