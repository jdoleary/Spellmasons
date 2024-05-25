import { drawPredictionLine, drawUICircleFillPrediction } from '../graphics/PlanningView';
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
import filter from '../graphics/shaders/unusued';

const id = 'Connect';
const numberOfTargetsPerQuantity = 2;
const baseRadius = 250;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconConnect.png',
    supportQuantity: true,
    requiresFollowingCard: true,
    description: ['spell_connect', id, numberOfTargetsPerQuantity.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      let limitTargetsLeft = numberOfTargetsPerQuantity * quantity;
      const potentialTargets = underworld.getPotentialTargets(prediction);
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      const targets = getCurrentTargets(state);
      const length = targets.length;
      const animationPromises = [];
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        let animationPromise = Promise.resolve();
        if (target) {
          const filterFn = (x: any) => {
            if (Unit.isUnit(x) && Unit.isUnit(target)) {
              if (target.alive) {
                // Match living units of the same faction
                return x.faction == target.faction && x.alive; // TODO - Neutral faction?
              } else {
                // Match any dead unit
                return !x.alive;
              }
            } else if (!Unit.isUnit(x) && !Unit.isUnit(target)) {
              // Match both non units to each other
              return true;
            } else {
              // Do not match unit and non unit
              return false;
            }
          }

          // Connect does not get extra radius from quantity,
          // but can instead chain to more targets
          // +25% range per radius boost
          const adjustedRadius = baseRadius * (1 + (0.25 * state.aggregator.radiusBoost))

          // Find all units touching the spell origin
          const chained = getConnectingEntities(
            target,
            adjustedRadius,
            limitTargetsLeft,
            targets,
            potentialTargets,
            filterFn,
            prediction
          );
          // Draw prediction lines so user can see how it chains
          if (prediction) {
            chained.forEach(chained_entity => {
              drawPredictionLine(chained_entity.chainSource, chained_entity.entity);
            });
          } else {
            for (let { chainSource, entity } of chained) {
              playSFXKey('targeting');
              animationPromise = animationPromise.then(() => animate(chainSource, [entity]));
            }
            // Draw all final circles for a moment before casting
            animationPromise = animationPromise.then(() => animate({ x: 0, y: 0 }, []));
            animationPromises.push(animationPromise);
          }
          // Update effectState targets
          chained.forEach(u => addTarget(u.entity, state, underworld))
        }
      }
      await Promise.all(animationPromises).then(() => {
        // Only clear graphics once all lines are done animating
        if (!prediction) {
          globalThis.predictionGraphics?.clear();
        }
      });

      return state;
    },
  },
};

export function getConnectingEntities(
  source: HasSpace,
  radius: number,
  chainsLeft: number,
  targets: HasSpace[] = [],
  potentialTargets: HasSpace[],
  filterFn: (x: any) => boolean, //selects which type of entities this can chain to
  prediction: boolean,
  inLiquidRadiusMultiplier: number = 1,
): { chainSource: HasSpace, entity: HasSpace }[] {

  potentialTargets = potentialTargets
    .filter(x => filterFn(x))
    .filter(t => !targets.includes(t));

  let connected: { chainSource: HasSpace, entity: HasSpace }[] = [];
  if (chainsLeft > 0) {
    connected = getNextConnectingEntities(source, radius, chainsLeft, potentialTargets, prediction, inLiquidRadiusMultiplier)
  }
  return connected;
}

export function getNextConnectingEntities(
  source: HasSpace,
  baseRadius: number,
  chainsLeft: number,
  potentialTargets: HasSpace[],
  prediction: boolean,
  inLiquidRadiusMultiplier: number = 1,
): { chainSource: HasSpace, entity: HasSpace }[] {

  potentialTargets = potentialTargets.filter(x => x != source);

  if (prediction && !globalThis.isHUDHidden) {
    drawUICircleFillPrediction(source, (baseRadius * inLiquidRadiusMultiplier) - config.COLLISION_MESH_RADIUS / 2, colors.trueWhite, i18n("Connect Area"));
  }

  let connected: { chainSource: HasSpace, entity: HasSpace }[] = [];
  do {
    let closestDist = baseRadius * inLiquidRadiusMultiplier;
    let closestTarget: HasSpace | undefined = undefined;

    for (let t of potentialTargets) {
      const dist = math.distance(t, source);
      if (dist <= closestDist) {
        closestDist = dist;
        closestTarget = t;
      }
    }

    if (closestTarget) {
      connected.push({ chainSource: source, entity: closestTarget });
      chainsLeft--;
      if (chainsLeft > 0) {
        const next = getNextConnectingEntities(closestTarget, baseRadius, chainsLeft, potentialTargets, prediction, inLiquidRadiusMultiplier)
        chainsLeft -= next.length;
        connected = connected.concat(next);
        potentialTargets = potentialTargets.filter(x => {
          for (let c of connected) {
            if (x == c.entity) return false; //filter out targets in the connected tree
          }
          return true; //include all targets not in the connected tree
        });
      }
    }
    else //No targets to chain to, no reason to looping anymore
    {
      break;
    }

  } while (chainsLeft > 0)

  return connected;
}

async function animate(pos: Vec2, newTargets: Vec2[]) {
  if (globalThis.headless) {
    // Animations do not occur on headless, so resolve immediately or else it
    // will just waste cycles on the server
    return Promise.resolve();
  }
  const iterations = 100;
  const millisBetweenIterations = 3;
  let playedSound = false;
  // "iterations + 10" gives it a little extra time so it doesn't timeout right when the animation would finish on time
  return raceTimeout(millisBetweenIterations * (iterations + 10), 'animatedConnect', new Promise<void>(resolve => {
    for (let i = 0; i < iterations; i++) {

      setTimeout(() => {
        if (globalThis.predictionGraphics) {
          // globalThis.predictionGraphics.clear();
          globalThis.predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1.0);
          // iterations - 10 allows the lerp value to stay over 1 for a time so that it will animate the final
          // select circle
          // ---
          // between 0 and 1;
          const proportionComplete = easeOutCubic((i + 1) / (iterations - 10));
          newTargets.forEach(target => {

            globalThis.predictionGraphics?.moveTo(pos.x, pos.y);
            const dist = distance(pos, target)
            const edgeOfCircle = add(target, math.similarTriangles(pos.x - target.x, pos.y - target.y, dist, config.COLLISION_MESH_RADIUS));
            const pointApproachingTarget = add(pos, math.similarTriangles(edgeOfCircle.x - pos.x, edgeOfCircle.y - pos.y, dist, dist * Math.min(1, proportionComplete)));
            globalThis.predictionGraphics?.lineTo(pointApproachingTarget.x, pointApproachingTarget.y);
            if (proportionComplete >= 1) {
              globalThis.predictionGraphics?.drawCircle(target.x, target.y, config.COLLISION_MESH_RADIUS);
              // Play sound when new target is animated to be selected
              if (!playedSound) {
                playedSound = true;
                playSFXKey('targetAquired');
              }
            }
          });

        }
        if (i >= iterations - 1) {
          resolve();
        }

      }, millisBetweenIterations * i)
    }
  }));
}
export default spell;
