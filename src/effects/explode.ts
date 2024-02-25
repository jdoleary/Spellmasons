import Underworld from "../Underworld";
import { drawUICirclePrediction } from "../graphics/PlanningView";
import { Vec2 } from "../jmath/Vec";
import { makeParticleExplosion } from '../graphics/ParticleCollection';
import * as colors from '../graphics/ui/colors';
import { IUnit, takeDamage } from "../entity/Unit";
import { forcePushAwayFrom } from "./force_move";
import { raceTimeout } from "../Promise";

export const baseExplosionRadius = 140
export async function explode(location: Vec2, radius: number, damage: number, pushDistance: number, underworld: Underworld, prediction: boolean, colorstart?: number, colorEnd?: number, useDefaultSound: boolean = true): Promise<IUnit[]> {
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
      takeDamage(u, damage, u, underworld, prediction);
    });
  }

  const promises: Promise<void>[] = [];
  if (pushDistance > 0) {
    units.forEach(u => {
      // Push units away from exploding location
      promises.push(forcePushAwayFrom(u, location, pushDistance, underworld, prediction));
    })

    underworld.getPickupsWithinDistanceOfTarget(location, radius, prediction)
      .forEach(p => {
        // Push pickups away
        promises.push(forcePushAwayFrom(p, location, pushDistance, underworld, prediction));
      })
  }
  await raceTimeout(2000, 'Explode', Promise.all(promises));

  return units;
}