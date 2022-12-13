import { drawPredictionCircleFill, drawPredictionLine } from '../graphics/PlanningView';
import { addTarget, addUnitTarget, getCurrentTargets, Spell } from './index';
import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import * as config from '../config';
import { CardCategory, CardRarity, probabilityMap } from '../types/commonTypes';
import { add, Vec2 } from '../jmath/Vec';
import * as math from '../jmath/math';
import { raceTimeout } from '../Promise';
import { similarTriangles, distance } from '../jmath/math';
import { easeOutCubic } from '../jmath/Easing';
import { isPickup } from '../entity/Pickup';
import { HasSpace } from '../entity/Type';

const id = 'Connect';
const numberOfTargetsPerQuantity = 2;
const baseRadius = 105;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.COMMON],
    thumbnail: 'spellIconConnect.png',
    supportQuantity: true,
    requiresFollowingCard: true,
    description: `
Link together enemies (and allys) in close proximity to each other.  
Every subsequent instance of "${id}" will add up to ${numberOfTargetsPerQuantity} new targets to the spell.
All connected beings will be affected by the following spells in your cast.
    `,
    effect: async (state, card, quantity, underworld, prediction) => {
      let limitTargetsLeft = numberOfTargetsPerQuantity * quantity;
      const potentialTargets = underworld.getPotentialTargets(prediction);
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      const targets = getCurrentTargets(state);
      const length = targets.length;
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (target) {
          const typeFilter = Unit.isUnit(target)
            ? (target.alive
              // If target is a living unit, only chain to other living units
              ? (x: any) => x.alive
              // If target is a dead unit, only chain to other dead units
              : (x: any) => !x.alive)
            : isPickup(target)
              // If target is a pickup, only chain to other pickups
              ? isPickup
              : () => {
                console.warn('Original target is neither unit nor pickup and is not yet supported in Connect spell');
                return false;
              };

          // Find all units touching the spell origin
          const chained = await getTouchingTargetableEntitiesRecursive(
            target.x,
            target.y,
            potentialTargets,
            baseRadius + state.aggregator.radius,
            prediction,
            { limitTargetsLeft },
            0,
            typeFilter,
            targets
          );
          // Draw prediction lines so user can see how it chains
          if (prediction) {
            chained.forEach(chained_entity => {
              drawPredictionLine(chained_entity.chainSource, chained_entity.entity);
            });
          } else {
            const alreadyAnimated: HasSpace[] = [...state.targetedUnits];
            for (let { chainSource, entity } of chained) {
              playSFXKey('targeting');
              await animate(chainSource, [entity], alreadyAnimated);
              alreadyAnimated.push(entity);
            }
            // Draw all final circles for a moment before casting
            await animate({ x: 0, y: 0 }, [], alreadyAnimated);
          }
          // Update effectState targets
          chained.forEach(u => addTarget(u.entity, state))
        }
      }

      return state;
    },
  },
};
async function getTouchingTargetableEntitiesRecursive(
  x: number,
  y: number,
  potentialTargets: HasSpace[],
  radius: number,
  prediction: boolean,
  // The number of targets left that it is able to add to the targets list
  // It is an object instead of just a number so it will be passed by reference
  chainState: { limitTargetsLeft: number },
  recurseLevel: number,
  // selects which type of entity to chain to
  typeFilter: (x: any) => boolean,
  // object references
  ignore: HasSpace[] = [],
): Promise<{ chainSource: Vec2, entity: HasSpace }[]> {
  if (chainState.limitTargetsLeft <= 0) {
    return [];
  }
  // Draw visual circle for prediction
  // - config.COLLISION_MESH_RADIUS / 2 accounts for the fact that the game logic
  // will only connect entities if their CENTER POINT falls within the radius; however,
  // to the players eyes if any part of them is touching the circle it should connect
  if (prediction) {
    drawPredictionCircleFill({ x, y }, radius - config.COLLISION_MESH_RADIUS / 2);
  }
  const coords = { x, y }
  let touching = potentialTargets
    // Orders chaining priority
    .filter(typeFilter)
    .filter((u) => {
      return (
        ignore.find((i) => i == u) === undefined &&
        u.x <= x + radius &&
        u.x >= x - radius &&
        u.y <= y + radius &&
        u.y >= y - radius
      );
    })
    // Order by closest to coords
    .sort((a, b) => math.distance(a, coords) - math.distance(b, coords))
    // Only select up to limitTargetsLeft
    .slice(0, chainState.limitTargetsLeft);

  ignore.push(...touching);

  let connected: { chainSource: Vec2, entity: HasSpace }[] = [];
  if (chainState.limitTargetsLeft > 0) {
    // Important: Using a regular for loop and cache the length instead of a for..of loop because 
    // the array being looped is modified in the interior of the loop and we only want it
    // to loop the original array contents, not the contents that are added inside of the loop
    const length = touching.length
    for (let i = 0; i < length; i++) {
      const t = touching[i];
      if (t) {
        if (chainState.limitTargetsLeft <= 0) {
          break;
        }
        connected.push({ chainSource: coords, entity: t });
        chainState.limitTargetsLeft--;
        if (!prediction) {
          playSFXKey(`targetAquired0`);
        }
        const newTouching = await getTouchingTargetableEntitiesRecursive(t.x, t.y, potentialTargets, radius, prediction, chainState, recurseLevel + 1, typeFilter, ignore)
        connected = connected.concat(newTouching);
      }
    }
  }
  return connected;
}

async function animate(pos: Vec2, newTargets: Vec2[], oldTargets: Vec2[]) {
  if (globalThis.headless) {
    // Animations do not occur on headless, so resolve immediately or else it
    // will just waste cycles on the server
    return Promise.resolve();
  }
  const iterations = 100;
  const millisBetweenIterations = 4;
  // "iterations + 10" gives it a little extra time so it doesn't timeout right when the animation would finish on time
  return raceTimeout(millisBetweenIterations * (iterations + 10), 'animatedConnect', new Promise<void>(resolve => {
    for (let i = 0; i < iterations; i++) {

      setTimeout(() => {
        if (globalThis.predictionGraphics) {
          globalThis.predictionGraphics.clear();
          globalThis.predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1.0);
          // between 0 and 1;
          const proportionComplete = easeOutCubic((i + 1) / iterations);
          newTargets.forEach(target => {

            globalThis.predictionGraphics?.moveTo(pos.x, pos.y);
            const dist = distance(pos, target)
            const pointApproachingTarget = add(pos, similarTriangles(target.x - pos.x, target.y - pos.y, dist, dist * proportionComplete));
            globalThis.predictionGraphics?.lineTo(pointApproachingTarget.x, pointApproachingTarget.y);
            if (proportionComplete >= 1) {
              globalThis.predictionGraphics?.drawCircle(target.x, target.y, config.COLLISION_MESH_RADIUS);
            }
          });
          // Draw completed lines and circles on old targets
          oldTargets.forEach(target => {
            // globalThis.predictionGraphics?.moveTo(pos.x, pos.y);
            // globalThis.predictionGraphics?.lineTo(target.x, target.y);
            globalThis.predictionGraphics?.drawCircle(target.x, target.y, config.COLLISION_MESH_RADIUS);
          });
        }
        if (i >= iterations - 1) {
          resolve();
        }

      }, millisBetweenIterations * i)
    }
  })).then(() => {
    globalThis.predictionGraphics?.clear();
  });
}
export default spell;
