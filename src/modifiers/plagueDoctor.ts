import { registerEvents, registerModifiers } from "../cards";
import { playSpellSFX } from "../cards/cardUtils";
import { basePoisonStacks, poisonCardId } from "../cards/poison";
import { getOrInitModifier } from "../cards/util";
import { createVisualLobbingProjectile } from "../entity/Projectile";
import * as Unit from '../entity/Unit';
import { addOneOffAnimation } from "../graphics/Image";
import { drawUICircle, drawUICirclePrediction } from "../graphics/PlanningView";
import { healthRed } from "../graphics/ui/colors";
import Underworld from '../Underworld';

export const plagueDoctorMaskId = 'Plague Doctor Mask';
export default function registerPlagueDoctor() {
  registerModifiers(plagueDoctorMaskId, {
    description: ('rune_plaguedoctormask'),
    _costPerUpgrade: 100,
    quantityPerUpgrade: 1,
    maxUpgradeCount: 3,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, plagueDoctorMaskId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, plagueDoctorMaskId);
      });
    }
  });
  registerEvents(plagueDoctorMaskId, {
    onKill: async (unit: Unit.IUnit, killedUnit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[plagueDoctorMaskId];
      const killedUnitPoison = killedUnit.modifiers[poisonCardId];
      if (modifier && killedUnitPoison) {

        const radius = 100 * modifier.quantity;
        const units = underworld.getUnitsWithinDistanceOfTarget(killedUnit, radius, prediction).filter(u => u.alive && u !== killedUnit);
        if (!prediction) {
          for (let unit of units) {
            createVisualLobbingProjectile(
              killedUnit,
              unit,
              'poisonerProjectile',
            ).then(() => {
              playSpellSFX('poison', prediction);
              addOneOffAnimation(unit, 'spellPoison');
            });
          }

        }
        units.forEach(unit => {
          Unit.addModifier(unit, poisonCardId, underworld, prediction, basePoisonStacks, { sourceUnitId: unit.id });
        });
        if (prediction) {
          drawUICirclePrediction(killedUnit, radius, healthRed, plagueDoctorMaskId);
        }
      }
    }
  });
}