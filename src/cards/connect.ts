import { drawPredictionCircleFill, drawPredictionLine } from '../graphics/PlanningView';
import { addUnitTarget, Spell } from './index';
import type * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import * as config from '../config';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { add, Vec2 } from '../jmath/Vec';
import * as math from '../jmath/math';
import { raceTimeout } from '../Promise';
import { similarTriangles, distance } from '../jmath/math';
import { easeOutCubic } from '../jmath/Easing';

const id = 'Connect';
const numberOfTargetsPerQuantity = 2;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 20,
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
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      const length = state.targetedUnits.length;
      for (let i = 0; i < length; i++) {
        const unit = state.targetedUnits[i];
        if (unit) {
          // Find all units touching the spell origin
          const chained_units = await getTouchingUnitsRecursive(
            unit.x,
            unit.y,
            underworld,
            prediction,
            { limitTargetsLeft },
            0,
            state.targetedUnits.map(u => u.id)
          );
          // Draw prediction lines so user can see how it chains
          if (prediction) {
            chained_units.forEach(chained_unit => {
              drawPredictionLine(chained_unit.chainSource, chained_unit.unit);
            });
          } else {
            const alreadyAnimated = [...state.targetedUnits];
            for (let { chainSource, unit } of chained_units) {
              await animate(chainSource, [unit], alreadyAnimated);
              alreadyAnimated.push(unit);
            }
            // Draw all final circles for a moment before casting
            await animate({ x: 0, y: 0 }, [], alreadyAnimated);
          }
          // Update targetedUnits
          chained_units.forEach(u => addUnitTarget(u.unit, state))
        }
      }

      return state;
    },
  },
};
const range = 105;
async function getTouchingUnitsRecursive(
  x: number,
  y: number,
  underworld: Underworld,
  prediction: boolean,
  // The number of targets left that it is able to add to the targets list
  // It is an object instead of just a number so it will be passed by reference
  chainState: { limitTargetsLeft: number },
  recurseLevel: number,
  // Unit ids
  ignore: number[] = [],
): Promise<{ chainSource: Vec2, unit: Unit.IUnit }[]> {
  if (chainState.limitTargetsLeft <= 0) {
    return [];
  }
  // Draw visual circle for prediction
  // - config.COLLISION_MESH_RADIUS / 2 accounts for the fact that the game logic
  // will only connect units if their CENTER POINT falls within the radius; however,
  // to the players eyes if any part of them is touching the circle it should connect
  if (prediction) {
    drawPredictionCircleFill({ x, y }, range - config.COLLISION_MESH_RADIUS / 2);
  }
  const coords = { x, y }
  const units = prediction ? underworld.unitsPrediction : underworld.units;
  let touching = units.filter((u) => {
    return (
      u.x <= x + range &&
      u.x >= x - range &&
      u.y <= y + range &&
      u.y >= y - range &&
      ignore.find((i) => i == u.id) === undefined
    );
  })
    // Order by closest to coords
    .sort((a, b) => math.distance(a, coords) - math.distance(b, coords))
    // Sort dead units to the back, prefer selecting living units
    .sort((a, b) => a.alive && b.alive ? 0 : a.alive ? -1 : 1)
    // Only select up to limitTargetsLeft
    .slice(0, chainState.limitTargetsLeft);

  ignore.push(...touching.map(u => u.id));

  let connected: { chainSource: Vec2, unit: Unit.IUnit }[] = [];
  if (chainState.limitTargetsLeft > 0) {
    // Important: Using a regular for loop and cache the length instead of a for..of loop because 
    // the array being looped is modified in the interior of the loop and we only want it
    // to loop the original array contents, not the contents that are added inside of the loop
    const length = touching.length
    for (let i = 0; i < length; i++) {
      const u = touching[i];
      if (u) {
        if (chainState.limitTargetsLeft <= 0) {
          break;
        }
        connected.push({ chainSource: coords, unit: u });
        chainState.limitTargetsLeft--;
        const newTouching = await getTouchingUnitsRecursive(u.x, u.y, underworld, prediction, chainState, recurseLevel + 1, ignore)
        connected = connected.concat(newTouching);
      }
    }
  }
  return connected;
}

async function animate(pos: Vec2, newTargets: Vec2[], oldTargets: Vec2[]) {
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
