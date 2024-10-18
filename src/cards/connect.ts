import { drawPredictionLine, drawUICircleFillPrediction } from '../graphics/PlanningView';
import { addTarget, getCurrentTargets, Spell } from './index';
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
import Underworld from '../Underworld';

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
      const linkGroups: AnimateConnectLinks[][] = [];
      for (let i = 0; i < length; i++) {
        const target = targets[i];
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
            linkGroups.push(chained.map(x => ({ from: x.chainSource, targets: [{ to: x.entity, playedSound: false }] })));
          }
          // Update effectState targets
          chained.forEach(u => addTarget(u.entity, state, underworld, prediction))
        }
      }
      await animateConnections(linkGroups, underworld, prediction);

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
  radiusFn?: (chainSource: HasSpace, chainsLeft: number) => number,
): { chainSource: HasSpace, entity: HasSpace }[] {

  potentialTargets = potentialTargets
    .filter(x => filterFn(x))
    .filter(t => !targets.includes(t));

  let connected: { chainSource: HasSpace, entity: HasSpace }[] = [];
  if (chainsLeft > 0) {
    connected = getNextConnectingEntities(source, radius, chainsLeft, potentialTargets, prediction, radiusFn)
  }
  return connected;
}

export function getNextConnectingEntities(
  source: HasSpace,
  baseRadius: number,
  chainsLeft: number,
  potentialTargets: HasSpace[],
  prediction: boolean,
  radiusModifierFn?: (chainSource: HasSpace, chainsLeft: number) => number,
): { chainSource: HasSpace, entity: HasSpace }[] {

  potentialTargets = potentialTargets.filter(x => x != source);

  let adjustedRadius = baseRadius;
  if (radiusModifierFn) {
    adjustedRadius *= radiusModifierFn(source, chainsLeft);
  }

  if (prediction && !globalThis.isHUDHidden) {
    drawUICircleFillPrediction(source, adjustedRadius - config.COLLISION_MESH_RADIUS / 2, colors.trueWhite, i18n("Connect Area"));
  }

  let connected: { chainSource: HasSpace, entity: HasSpace }[] = [];
  do {
    let closestDist = adjustedRadius;
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
        const next = getNextConnectingEntities(closestTarget, baseRadius, chainsLeft, potentialTargets, prediction, radiusModifierFn)
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

const timeoutMsAnimation = 2000;
export async function animateConnections(links: AnimateConnectLinks[][], underworld: Underworld, prediction: boolean) {
  if (globalThis.headless || prediction) {
    // Animations do not occur on headless, so resolve immediately or else it
    // will just waste cycles on the server
    return Promise.resolve();
  }
  if (links.length == 0) {
    // Prevent this function from running if there is nothing to animate
    return Promise.resolve();
  }
  // Keep track of which entities have been targeted so far for the sake
  // of making a new sfx when a new entity gets targeted
  const entitiesTargeted: HasSpace[] = [];
  playSFXKey('targeting');
  return raceTimeout(timeoutMsAnimation, 'animatedConnect', new Promise<void>(resolve => {
    animateFrame(links, Date.now(), entitiesTargeted, underworld, resolve, prediction)();
  }));
}
interface AnimateConnectLinks {
  from: Vec2;
  targets: { to: Vec2, playedSound: boolean }[];
}
const millisToGrow = 750;
// Smaller circle is more asethetic for connect since the line grows from one circle's edge to another
const circleRadius = config.COLLISION_MESH_RADIUS / 2;
function animateFrame(linkGroups: AnimateConnectLinks[][], startTime: number, entitiesTargeted: HasSpace[], underworld: Underworld, resolve: (value: void | PromiseLike<void>) => void, prediction: boolean) {
  return function animateFrameInner() {
    if (globalThis.headless || prediction) {
      resolve();
      return;
    }
    if (globalThis.predictionGraphics) {
      globalThis.predictionGraphics.clear();
      globalThis.predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1.0)
      globalThis.predictionGraphics.beginFill(colors.targetingSpellGreen, 0.2);
      const now = Date.now();
      const timeDiff = now - startTime;
      for (let links of linkGroups) {
        for (let i = 0; i < links.length; i++) {
          const link = links[i];
          if (!link) {
            continue;
          }
          const { from, targets } = link;
          const proportionComplete = math.lerpSegmented(0, 1, timeDiff / millisToGrow, i, links.length);
          for (let target of targets) {
            if (proportionComplete === 0) {
              continue;
            }
            const { to } = target;
            const dist = distance(from, to)
            const edgeOfStartCircle = add(from, math.similarTriangles(to.x - from.x, to.y - from.y, dist, circleRadius));
            globalThis.predictionGraphics.moveTo(edgeOfStartCircle.x, edgeOfStartCircle.y);
            const edgeOfCircle = add(to, math.similarTriangles(from.x - to.x, from.y - to.y, dist, circleRadius));
            const pointApproachingTarget = add(edgeOfStartCircle, math.similarTriangles(edgeOfCircle.x - edgeOfStartCircle.x, edgeOfCircle.y - edgeOfStartCircle.y, dist, dist * Math.min(1, proportionComplete)));
            globalThis.predictionGraphics.lineTo(pointApproachingTarget.x, pointApproachingTarget.y);
            if (proportionComplete >= 1) {
              globalThis.predictionGraphics.drawCircle(to.x, to.y, circleRadius);
              // Play sound when new target is animated to be selected
              if (!target.playedSound) {
                target.playedSound = true;
                playSFXKey('targetAquired');
              }
            }
          }
        }
      }
      // + 250 to give time for the final circles to show
      if (timeDiff > millisToGrow + 250) {
        resolve();
        return;
      } else {
        requestAnimationFrame(animateFrame(linkGroups, startTime, entitiesTargeted, underworld, resolve, prediction));
      }
    } else {
      resolve();
    }
  }
}

export default spell;
