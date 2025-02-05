import { registerEvents, registerModifiers } from "../cards";
import { oneOffImage } from "../cards/cardUtils";
import { getAllShardBearers, soulShardId } from "../cards/soul_shard";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import { makeManaTrail } from "../graphics/Particles";
import { containerUnits, startBloodParticleSplatter } from "../graphics/PixiUtils";
import Underworld from '../Underworld';
import { UnitType } from "../types/commonTypes";
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { IImageAnimated } from "../graphics/Image";
import { teleport } from "../effects/teleport";

const trailColorStart = colors.convertToHashColor(colors.healthDarkRed);
const trailColorEnd = colors.convertToHashColor(colors.healthBrightRed);

// An additional modifier for Soul Shard, given to the caster
export const soulShardOwnerModifierId = 'Soul Shard Owner';
export default function registerSoulShardOwner() {
  registerModifiers(soulShardOwnerModifierId, {
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, soulShardOwnerModifierId, { isCurse: true, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, soulShardOwnerModifierId);
      });
    },
    remove: (unit: Unit.IUnit, underworld: Underworld) => {
      const soulShardOwnerModifier = unit.modifiers[soulShardOwnerModifierId];
      if (soulShardOwnerModifier) {
        // Remove modifier from soul shard bearers or else they will become immortal
        // if the owner is dead and doens't have shardOwner
        const shardBearers = getAllShardBearers(unit, underworld, !!unit.isPrediction);
        shardBearers.forEach(u => Unit.removeModifier(u, soulShardId, underworld));
      }
    }
  });
  registerEvents(soulShardOwnerModifierId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      if (!unit.alive) {
        // Resurrect in place of the nearestShardBearer
        const allShardBearers = getAllShardBearers(unit, underworld, prediction);
        const nearestShardBearer = allShardBearers[0];
        if (allShardBearers.length && nearestShardBearer) {
          //console.log("Resurrect unit at soul shard bearer: ", nearestShardBearer);

          if (!prediction) {
            // Trails from bearers
            let promises = [];
            for (let shardBearer of allShardBearers) {
              promises.push(makeManaTrail(shardBearer, unit, underworld, trailColorStart, trailColorEnd));
            }
            await Promise.all(promises);

            // Trail from shard owner
            await new Promise<void>(resolve => colorMagic(oneOffImage(unit, 'summonerMagic', containerUnits, resolve)));
            await makeManaTrail(unit, nearestShardBearer, underworld, trailColorStart, trailColorEnd);
            await new Promise<void>(resolve => colorMagic(oneOffImage(nearestShardBearer, 'summonerMagic', containerUnits, resolve)));
            startBloodParticleSplatter(underworld, unit, nearestShardBearer, { maxRotationOffset: Math.PI * 2, numberOfParticles: 300 });
          }

          Unit.die(nearestShardBearer, underworld, prediction, unit);
          if (nearestShardBearer.unitType != UnitType.PLAYER_CONTROLLED) {
            Unit.cleanup(nearestShardBearer, true);
          }
          teleport(unit, nearestShardBearer, underworld, prediction);
          Unit.resurrect(unit, underworld);
        } else {
          console.error("Unit had shard owner event, but no shard bearers were left. This should not happen ", unit);
        }
      }
    },
    onDrawSelected: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[soulShardOwnerModifierId];
      if (modifier) {
        const shardBearers = getAllShardBearers(unit, underworld, prediction);
        if (shardBearers.length) {
          const graphics = globalThis.selectedUnitGraphics;
          if (graphics) {
            const lineColor = colors.healthDarkRed;
            for (let shardBearer of shardBearers) {
              graphics.lineStyle(3, lineColor, 0.7);
              graphics.moveTo(shardBearer.x, shardBearer.y);
              graphics.lineTo(unit.x, unit.y);
              graphics.drawCircle(unit.x, unit.y, 3);
            }
          }
        }
      }
    }
  });
}

// Colors the summoner teleport magic the same color as the rest of the soul shard fx
function colorMagic(image?: IImageAnimated): IImageAnimated | undefined {
  const filter = new MultiColorReplaceFilter(
    [
      [0xff0000, colors.healthDarkRed],
    ],
    0.05
  );
  if (image) {
    if (!image.sprite.filters) {
      image.sprite.filters = [];
    }
    image.sprite.filters.push(filter);
    return image;
  }
  return undefined;
}