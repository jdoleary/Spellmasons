import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import { baseExplosionRadius } from "../effects/explode";
import * as Unit from '../entity/Unit';
import { drawUICircle } from "../graphics/PlanningView";
import Underworld from '../Underworld';
import * as colors from '../graphics/ui/colors';
import { makePrimedCorpseParticles, stopAndDestroyForeverEmitter } from "../graphics/ParticleCollection";

// A modifier used by the Goru boss to prime corpses for explosion/consumption/resurrection
export const primedCorpseId = 'Primed Corpse';
export default function registerPrimedCorpse() {
  registerModifiers(primedCorpseId, {
    addModifierVisuals: (unit: Unit.IUnit, underworld: Underworld) => initCorpsePrimed(unit, underworld, false),
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const modifier = getOrInitModifier(unit, primedCorpseId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, primedCorpseId);
      });

      // Limit to 1 quantity
      modifier.quantity = Math.min(modifier.quantity, 1);
    },
    remove: (unit: Unit.IUnit, underworld: Underworld) => {
      getPrimedCorpseEmitters(unit, underworld).forEach(({ emitter }) => stopAndDestroyForeverEmitter(emitter));
    }
  });
  registerEvents(primedCorpseId, {
    onDrawSelected: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      if (globalThis.selectedUnitGraphics) {
        drawUICircle(globalThis.selectedUnitGraphics, unit, baseExplosionRadius, colors.healthRed, 'Explosion Radius');
      }
    }
  });
  function initCorpsePrimed(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
    // If no emitter, add one
    if (!getPrimedCorpseEmitters(unit, underworld).length) {
      makePrimedCorpseParticles(unit, underworld, prediction);
    }
  }
  function getPrimedCorpseEmitters(unit: Unit.IUnit, underworld: Underworld) {
    // @ts-ignore jid is a unique identifier that allows us to search for this pf later
    // @ts-ignore flaggedForRemoval is a custom prop
    return underworld.particleFollowers.filter(pf => pf.target == unit && pf.jid == primedCorpseId && !pf.emitter.flaggedForRemoval);
  }
}
