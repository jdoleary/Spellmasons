import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import { baseExplosionRadius } from "./effects/explode";
import * as Unit from './entity/Unit';
import { drawUICircle } from "./graphics/PlanningView";
import Underworld from './Underworld';
import * as colors from './graphics/ui/colors';

// A modifier used by the Goru boss to prime corpses for explosion/consumption/resurrection
export const primedCorpseId = 'primedCorpse';
export default function registerPrimedCorpse() {
  registerModifiers(primedCorpseId, {
    add: (unit: Unit.IUnit, underworld: Underworld, _prediction: boolean, quantity: number = 1) => {
      const modifier = getOrInitModifier(unit, primedCorpseId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        // Add events
        if (!unit.onDrawSelectedEvents.includes(primedCorpseId)) {
          unit.onDrawSelectedEvents.push(primedCorpseId);
        }
        if (!unit.onTurnStartEvents.includes(primedCorpseId)) {
          unit.onTurnStartEvents.push(primedCorpseId);
        }
      });

      // Limit to 1 quantity
      modifier.quantity = Math.min(modifier.quantity, 1);
    }
  });
  registerEvents(primedCorpseId, {
    onDrawSelected: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      if (globalThis.selectedUnitGraphics) {
        drawUICircle(globalThis.selectedUnitGraphics, unit, baseExplosionRadius, colors.healthRed, 'Explosion Radius');
      }
    },
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      if (!unit.alive) {

      }
    }
  });
}
