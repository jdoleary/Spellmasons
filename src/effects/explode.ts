import Underworld from "../Underworld";
import { drawUICirclePrediction } from "../graphics/PlanningView";
import { Vec2 } from "../jmath/Vec";
import { makeParticleExplosion } from '../graphics/ParticleCollection';
import * as colors from '../graphics/ui/colors';
import { IUnit, takeDamage } from "../entity/Unit";
import { forcePushAwayFrom } from "./force_move";

export const baseExplosionRadius = 140
export function explode(location: Vec2, radius: number, damage: number, pushDistance: number, underworld: Underworld, prediction: boolean, colorstart: number, colorEnd: number): IUnit[] {
  if (prediction) {
    drawUICirclePrediction(location, radius, colors.healthRed, 'Explosion Radius');
  } else {
    playSFXKey('bloatExplosion');
    makeParticleExplosion(location, radius / baseExplosionRadius, colorstart, colorEnd, prediction);
  }

  const units = underworld.getUnitsWithinDistanceOfTarget(location, radius, prediction);

  units.forEach(u => {
    // Deal damage to units
    takeDamage(u, damage, u, underworld, prediction);
  });

  if (pushDistance > 0) {
    units.forEach(u => {
      // Push units away from exploding location
      forcePushAwayFrom(u, location, pushDistance, underworld, prediction);
    })

    underworld.getPickupsWithinDistanceOfTarget(location, radius, prediction)
      .forEach(p => {
        // Push pickups away
        forcePushAwayFrom(p, location, pushDistance, underworld, prediction);
      })
  }

  return units;
}