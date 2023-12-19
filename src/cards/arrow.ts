import * as Unit from '../entity/Unit';
import { CardCategory } from '../types/commonTypes';
import { EffectState, ICard, refundLastSpell, Spell } from './index';
import * as math from '../jmath/math';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { createVisualFlyingProjectile, SPEED_PER_MILLI } from '../entity/Projectile';
import { closestLineSegmentIntersectionWithLine, findWherePointIntersectLineSegmentAtRightAngle, LineSegment } from '../jmath/lineSegment';
import * as config from '../config';
import { add, equal, getAngleBetweenVec2s, getEndpointOfMagnitudeAlongVector, invert, subtract, Vec2 } from '../jmath/Vec';
import Underworld from '../Underworld';
import { playDefaultSpellSFX } from './cardUtils';
import { moveAlongVector, normalizedVector } from '../jmath/moveWithCollision';
import { runPredictions } from '../graphics/PlanningView';

export const arrowCardId = 'Arrow';
const arrowProps: ArrowProps = {
  damage: 10,
  pierce: 1,
  arrowCount: 1,
}
const spell: Spell = {
  card: {
    id: arrowCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconArrow.png',
    // so that you can fire the arrow at targets out of range
    allowNonUnitTarget: true,
    animationPath: '',
    sfx: 'arrow',
    description: ['spell_arrow', arrowProps.damage.toString()],
    effect: arrowEffect(arrowProps)
  }
};

export interface ArrowProps {
  damage: number;
  pierce: number; // 1 = 1 target hit
  arrowCount: number; // 1 = 1 arrow shot
  onCollide?: (state: EffectState, unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => Promise<EffectState>;
}

// Arrow.ts contains an array of arrows (indexed as arrow index)
// - For handling arrow count, quantity, and separate arrow effects
// Arrows contain an array of collisions (stored as unit ID)
// - For handling pierce
// All arrow collisions are done in prediction mode and stored in this [][]

export function arrowEffect(arrowProps: ArrowProps) {
  return async (effectState: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean) => {
    if (prediction) {
      const { state } = await runArrowEffect(arrowProps, effectState, card, quantity, underworld, prediction);
      return state;
    }
    else {
      underworld.syncPredictionEntities();
      // For a non prediction cast, generate the arrow collisions from a prediction invokation once...
      const { predictedArrowCollisions } = await runArrowEffect(arrowProps, effectState, card, quantity, underworld, true);


      // ... and then pass that arrow into the real invokation so that it's damage perfectly matches the predictions
      const { state } = await runArrowEffect(arrowProps, effectState, card, quantity, underworld, false, predictedArrowCollisions);
      return state;
    }
  }
}

async function runArrowEffect(arrowProps: ArrowProps, state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, predictedArrowCollisions?: number[][]) {
  let targets: Vec2[] = state.targetedUnits;
  const path = findArrowPath(state.casterPositionAtTimeOfCast, state.castLocation, underworld)
  targets = targets.length ? targets : [path ? path.p2 : state.castLocation];
  let targetsHitCount = 0;
  let attackPromises = [];
  let timeoutToNextArrow = 200;

  if (!predictedArrowCollisions) {
    // initialize predicted arrow collisions
    predictedArrowCollisions = [];
  }

  if (prediction) {
    // Clear predicted collisions before adding new ones
    predictedArrowCollisions.length = 0;
  }

  let arrowIndex = 0;
  for (let i = 0; i < quantity; i++) {
    for (let target of targets) {
      for (let arrowNumber = 0; arrowNumber < arrowProps.arrowCount; arrowNumber++) {

        // START: Shoot multiple arrows at offset
        let casterPositionAtTimeOfCast = state.casterPositionAtTimeOfCast;
        let castLocation = target;
        if (arrowNumber > 0) {
          const diff = subtract(casterPositionAtTimeOfCast, getEndpointOfMagnitudeAlongVector(casterPositionAtTimeOfCast, (arrowNumber % 2 == 0 ? -1 : 1) * Math.PI / 2 + getAngleBetweenVec2s(state.casterPositionAtTimeOfCast, state.castLocation), arrowNumber > 2 ? 40 : 20));
          casterPositionAtTimeOfCast = subtract(casterPositionAtTimeOfCast, diff);
          castLocation = subtract(castLocation, diff);
        }
        // END: Shoot multiple arrows at offset

        if (!prediction && !globalThis.headless) {
          // We already know collisions, run those with visuals
          const arrowUnitCollisions = predictedArrowCollisions[arrowIndex];
          if (arrowUnitCollisions == undefined) {
            console.error("No predictions for arrow: ", arrowIndex)
            continue;
          }
          playDefaultSpellSFX(card, prediction);

          // If we hit our pierce limit, stop the arrow at the final collision
          // Otherwise let the arrow fly until it hits a wall
          if (arrowUnitCollisions.length == arrowProps.pierce) {
            // Last unit arrow collides with
            const finalTarget = underworld.units.find(u => u.id == arrowUnitCollisions[arrowUnitCollisions.length - 1]);
            if (finalTarget) {
              createVisualFlyingProjectile(
                casterPositionAtTimeOfCast,
                castLocation,
                'projectile/arrow',
                finalTarget
              )
            }
          }
          else {
            createVisualFlyingProjectile(
              casterPositionAtTimeOfCast,
              castLocation,
              'projectile/arrow',
            )
          }


          if (arrowUnitCollisions) {
            for (let unitId of arrowUnitCollisions) {
              const unit = underworld.units.find(u => u.id == unitId);

              if (!unit) {
                console.error("Could not find unit for arrow collison. Something changed from the prediction")
                continue;
              }
              // Fake the arrow collision by calculating a delay based on the speed of the projectile
              const millisecondsUntilCollision = (math.distance(casterPositionAtTimeOfCast, unit) - config.COLLISION_MESH_RADIUS) / SPEED_PER_MILLI;

              const damagePromise = new Promise<void>((resolve, reject) => {
                setTimeout(() => {
                  Unit.takeDamage(unit, arrowProps.damage, casterPositionAtTimeOfCast, underworld, false, undefined, { thinBloodLine: true });
                  targetsHitCount++;
                  if (arrowProps.onCollide) {
                    arrowProps.onCollide(state, unit, underworld, prediction);
                  }
                  resolve();
                }, millisecondsUntilCollision);
              })

              attackPromises.push(damagePromise);
            }
          }
          else {
            // Projectile won't hit any targets, need to refund mana
          }
        }
        else {
          // get and store collisions

          // new array for this arrowIndex
          predictedArrowCollisions.push([]);
          let arrowUnitCollisions = findArrowCollisions(casterPositionAtTimeOfCast, state.casterUnit.id, castLocation, prediction, underworld);

          arrowUnitCollisions = arrowUnitCollisions
            .filter(u => Unit.isUnit(u))
            .slice(0, arrowProps.pierce);

          for (let c = 0; c < arrowUnitCollisions.length; c++) {
            const unit = arrowUnitCollisions[c] as Unit.IUnit;
            targetsHitCount++;
            Unit.takeDamage(unit, arrowProps.damage, state.casterPositionAtTimeOfCast, underworld, prediction, undefined, { thinBloodLine: true });
            if (arrowProps.onCollide) {
              arrowProps.onCollide(state, unit, underworld, prediction);
            }

            // push all collisions to this arrow index's array
            predictedArrowCollisions[arrowIndex]?.push(unit.id);
          }
        }
        arrowIndex += 1;
        if (!prediction && !globalThis.headless) {
          const timeout = Math.max(1, timeoutToNextArrow);

          // Wait some time to fire the next arrow
          await new Promise(resolve => setTimeout(resolve, timeout));
          // Decrease timeout with each subsequent arrow fired to ensure that players don't have to wait too long
          timeoutToNextArrow -= 5;
        }
      }
    }
  }
  await Promise.all(attackPromises).then(() => {
    // Since arrows' flight promises are designed to resolve early so that multiple arrows can be shot
    // in quick succession, we must await the actual flyingProjectile promise to determine if no targets
    // were hit
    if (targetsHitCount == 0) {
      refundLastSpell(state, prediction, 'no target, mana refunded')
    }
  });
  return { state, predictedArrowCollisions };
}

export default spell;
// Returns the start and end point that an arrow will take until it hits a wall
export function findArrowPath(casterPositionAtTimeOfCast: Vec2, target: Vec2, underworld: Underworld): LineSegment | undefined {
  if (equal(casterPositionAtTimeOfCast, target)) {
    // Don't allow shooting arrow at self, an arrow needs a direction
    return undefined;
  }
  // Find a point that the arrow is shooting towards that is sure to be farther than the farthest wall
  let endPoint = add(casterPositionAtTimeOfCast, math.similarTriangles(target.x - casterPositionAtTimeOfCast.x, target.y - casterPositionAtTimeOfCast.y, math.distance(casterPositionAtTimeOfCast, target), 10000));
  let arrowShootPath = { p1: casterPositionAtTimeOfCast, p2: endPoint };
  // revise end point to stop where it hits the first wall
  const LOSResult = closestLineSegmentIntersectionWithLine(arrowShootPath, underworld.walls);
  let intersection = LOSResult ? LOSResult.intersection : undefined;
  if (intersection) {
    // If arrow intersects with wall
    // modify intersection so that it lands in game space and not out of bounds.
    // This ensures target_arrow can't spawn units out of bounds:
    // It should have no meaninful effect on other arrows
    if (LOSResult?.lineSegment) {
      const wallVector = normalizedVector(LOSResult.lineSegment.p2, LOSResult.lineSegment.p1);
      if (wallVector.vector) {
        intersection = moveAlongVector(intersection, invert(wallVector.vector), config.COLLISION_MESH_RADIUS / 2);
      }
    }

    endPoint = intersection;
    // revise arrow shoot path now that endpoint has changed
    return { p1: casterPositionAtTimeOfCast, p2: endPoint };
  } else {
    console.error('Unexpected: arrow couldnt find wall to intersect with');
    return { p1: casterPositionAtTimeOfCast, p2: target };
  }

}

export function findArrowCollisions(casterPositionAtTimeOfCast: Vec2, casterId: number, target: Vec2, prediction: boolean, underworld: Underworld): Vec2[] {
  const arrowShootPath = findArrowPath(casterPositionAtTimeOfCast, target, underworld);
  if (arrowShootPath === undefined) {
    return [];
  }
  // Get all units between source and target for the arrow to pierce:
  const hitTargets = (prediction ? underworld.unitsPrediction : underworld.units).filter(
    (u) => {
      if (!u.alive) {
        return false;
      }
      // Note: Filter out self as the arrow shouldn't damage caster
      if (u.id == casterId) {
        return false;
      }
      // @ts-ignore: `cachedArrowHealth` is a temporary property on units
      if (u.predictedNextTurnDamage >= u.cachedArrowHealth) {
        return false;
      }
      const pointAtRightAngleToArrowPath = findWherePointIntersectLineSegmentAtRightAngle(u, arrowShootPath);
      // TODO: Validate: Will this hit miniboss since their radius is larger?
      const willBeStruckByArrow = !pointAtRightAngleToArrowPath ? false : math.distance(u, pointAtRightAngleToArrowPath) <= config.COLLISION_MESH_RADIUS
      return willBeStruckByArrow;
    },
  ).sort((a, b) => {
    return math.distance(a, arrowShootPath.p1) - math.distance(b, arrowShootPath.p1);
  });
  // Return the endPoint so the arrow will fly and hit a wall even if it doesn't hit a unit
  return hitTargets.length ? hitTargets : [arrowShootPath.p2];
}