import Underworld from "../Underworld";
import { drawUICirclePrediction } from "../graphics/PlanningView";
import { Vec2 } from "../jmath/Vec";
import { makeParticleExplosion } from '../graphics/ParticleCollection';
import * as colors from '../graphics/ui/colors';
import { IUnit, takeDamage } from "../entity/Unit";
import { forcePushAwayFrom } from "./force_move";
import { distance, lerp } from "../jmath/math";
import { startScreenshake } from "../graphics/PixiUtils";

export const baseExplosionRadius = 140
export function explode(location: Vec2, radius: number, damage: number, pushDistance: number, sourceUnit: IUnit | undefined, underworld: Underworld, prediction: boolean, colorstart?: number, colorEnd?: number, useDefaultSound: boolean = true): IUnit[] {
  if (prediction) {
    drawUICirclePrediction(location, radius, colors.healthRed, 'Explosion Radius');
  } else {
    if (useDefaultSound) {
      playSFXKey('bloatExplosion');
    }
    if (colorstart && colorEnd) {
      makeParticleExplosion(location, radius / baseExplosionRadius, colorstart, colorEnd, prediction);
    }
  }

  const units = underworld.getUnitsWithinDistanceOfTarget(location, radius, prediction);

  if (damage != 0) {
    units.forEach(u => {
      // Deal damage to units
      takeDamage({
        unit: u,
        amount: damage,
        sourceUnit: sourceUnit,
        fromVec2: location,
      }, underworld, prediction);
    });
  }

  if (pushDistance > 0) {
    units.forEach(u => {
      // Push units away from exploding location
      forcePushAwayFrom(u, location, pushDistance, underworld, prediction, sourceUnit);
    })

    underworld.getPickupsWithinDistanceOfTarget(location, radius, prediction)
      .forEach(p => {
        // Push pickups away
        forcePushAwayFrom(p, location, pushDistance, underworld, prediction, sourceUnit);
      })
  }
  if (globalThis.player) {
    const distanceFromExplosion = distance(globalThis.player.unit, location);
    const intensity = lerp(20, 0, distanceFromExplosion / 1000);
    // Screenshake relative to how close explosion is to player
    startScreenshake(intensity, prediction, 500);

  }

  return units;
}
