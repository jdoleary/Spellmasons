import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import floatingText from "./graphics/FloatingText";
import Underworld from './Underworld';

export const ANEMIA_ID = 'Anemia';
const LOST_MAX_HEALTH = 2;
export default function registerAnemia() {
  registerModifiers(ANEMIA_ID, {
    description: 'rune_anemia',
    stage: "Amount Override",
    _costPerUpgrade: -5,
    maxUpgradeCount: 1,
    isMalady: true,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, ANEMIA_ID, { isCurse: false, quantity, keepOnDeath: true }, () => {
        const player = underworld.players.find(p => p.unit == unit)
        if (player) {
          player.extraStatPointsPerRound += 15;
          Unit.addEvent(unit, ANEMIA_ID);
        }
      });
    }
  });
  registerEvents(ANEMIA_ID, {
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      const modifier = unit.modifiers[ANEMIA_ID];
      if (modifier) {
        if (damageDealer && damageDealer.faction !== unit.faction) {
          unit.healthMax -= LOST_MAX_HEALTH;
          floatingText({ coords: unit, text: ['anemia_floating_text', LOST_MAX_HEALTH.toString()], prediction });
        }
      }

      return amount;
    }
  });
}