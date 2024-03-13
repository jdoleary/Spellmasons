import { registerEvents, registerModifiers } from "./cards";
import { oneOffImage } from "./cards/cardUtils";
import { getNearestShardBearer } from "./cards/soul_shard";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import { makeManaTrail } from "./graphics/Particles";
import { containerUnits, startBloodParticleSplatter } from "./graphics/PixiUtils";
import Underworld from './Underworld';

// An additional modifier for Soul Shard, given to the caster
export const soulShardOwnerModifierId = 'soulShardOwner';
export default function registerSoulShardOwner() {
  registerModifiers(soulShardOwnerModifierId, {
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, soulShardOwnerModifierId, { isCurse: true, quantity, keepOnDeath: true }, () => {
        // Add event
        if (!unit.onTurnStartEvents.includes(soulShardOwnerModifierId)) {
          unit.onTurnStartEvents.push(soulShardOwnerModifierId);
        }
      });
    }
  });
  registerEvents(soulShardOwnerModifierId, {
    onTurnStart: async (unit: Unit.IUnit, prediction: boolean, underworld: Underworld) => {
      if (!unit.alive) {
        // Resurrect in place of the nearestShardBearer
        const nearestShardBearer = getNearestShardBearer(unit, underworld, prediction);
        if (nearestShardBearer) {
          //console.log("Resurrect unit at soul shard bearer: ", nearestShardBearer);

          if (!prediction) {
            // Trail VFX
            await new Promise<void>(resolve => oneOffImage(unit, 'units/summonerMagic', containerUnits, resolve));
            await makeManaTrail(unit, nearestShardBearer, underworld, '#774772', '#5b3357');
            await new Promise<void>(resolve => oneOffImage(nearestShardBearer, 'units/summonerMagic', containerUnits, resolve));
            startBloodParticleSplatter(underworld, unit, nearestShardBearer, { maxRotationOffset: Math.PI * 2, numberOfParticles: 300 });
          }

          Unit.die(nearestShardBearer, underworld, prediction);
          Unit.cleanup(nearestShardBearer, true);
          Unit.setLocation(unit, nearestShardBearer);
          Unit.resurrect(unit, underworld);
          unit.health = 1;
        } else {
          console.error("Unit had shard owner event, but no shard bearers were left. This should not happen ", unit);
        }
      }
    }
  });
}