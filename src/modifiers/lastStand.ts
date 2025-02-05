import { registerEvents, registerModifiers } from "../cards";
import { resurrectWithAnimation } from "../cards/resurrect";
import { shieldId } from "../cards/shield";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import floatingText from "../graphics/FloatingText";
import { distance } from "../jmath/math";
import Underworld from '../Underworld';

// Resurrects X corpses within cast range after you die
export const laststandId = 'Last Stand';
export default function registerLastStand() {
  registerModifiers(laststandId, {
    description: 'rune_laststand',
    unitOfMeasure: 'Units',
    _costPerUpgrade: 50,
    quantityPerUpgrade: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, laststandId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, laststandId);
      });
    }
  });
  registerEvents(laststandId, {
    onDeath: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, sourceUnit?: Unit.IUnit): Promise<void> => {
      const modifier = unit.modifiers[laststandId];
      let animationPromises = [];
      if (modifier) {
        const nearbyCorpses = underworld.getAllUnits(prediction).filter(u => u !== unit && !u.alive && distance(u, unit) <= unit.attackRange)
        for (let i = 0; i < modifier.quantity; i++) {
          const corpse = nearbyCorpses[i];
          if (corpse) {
            floatingText({
              coords: corpse,
              text: laststandId
            });
            animationPromises.push(resurrectWithAnimation(corpse, unit, unit.faction, underworld, prediction, 0x96cdf1));
          }

        }
      }
      await Promise.all(animationPromises);
    }
  });
}

