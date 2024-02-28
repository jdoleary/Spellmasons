import { addTarget, EffectState, ICard, Spell } from './index';
import { CardCategory, UnitSubType } from '../types/commonTypes';
import { Vec2, lerpVec2 } from '../jmath/Vec';
import * as Unit from '../entity/Unit';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { easeOutCubic } from '../jmath/Easing';
import * as config from '../config';
import * as colors from '../graphics/ui/colors';
import Underworld from '../Underworld';
import { calculateGameDifficulty } from '../Difficulty';

export const targetInjuredId = 'Target Injured';
const healthThreshold = 20;
const spell: Spell = {
  card: {
    id: targetInjuredId,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconTargetInjured.png',
    requiresFollowingCard: true,
    description: 'spell_target_injured',
    allowNonUnitTarget: true,
    effect: async (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, outOfRange?: boolean) => {
      // 20, 40, 80, 160, 320...
      const adjustedHealthThreshold = healthThreshold * Math.pow(2, quantity - 1) * calculateGameDifficulty(underworld);

      const potentialTargets = prediction ? underworld.unitsPrediction : underworld.units;
      potentialTargets.filter(u => !u.flaggedForRemoval && !state.targetedUnits.includes(u));
      const addedTargets = [];

      for (const target of potentialTargets) {
        if (target.alive && target.health <= adjustedHealthThreshold && target.unitSubType != UnitSubType.DOODAD) {
          addedTargets.push(target);
        }
      }

      if (addedTargets.length) {
        // sort by most missing health first, then add to targets
        addedTargets.sort((a, b) => (a.healthMax - a.health) - (b.healthMax - b.healthMax));
        for (const target of addedTargets) {
          addTarget(target, state);
        }
        if (!prediction && !globalThis.headless) {
          playSFXKey('targeting');
          await animateTargetInjured(addedTargets);
        }
      }

      return state;
    },
  }
};

export async function animateTargetInjured(newTargets: Vec2[]) {
  // Draw a purple star and green circle around
  const radius = config.COLLISION_MESH_RADIUS;
  const iterations = 100;
  const starAnimationTime = 1000; //ms
  const postAnimationDelay = 500; //ms

  for (let i = 0; i < iterations; i++) {
    // Await delay between iterations
    await new Promise(resolve => setTimeout(resolve, starAnimationTime / iterations));

    if (globalThis.predictionGraphics) {
      globalThis.predictionGraphics.clear();
      globalThis.predictionGraphics.lineStyle(1.5, colors.healthDarkRed, 0.8);
      for (let target of newTargets) {

        // between 0 and 1;
        const progress = easeOutCubic((i + 1) / iterations);
        if (progress >= 1) {
          globalThis.predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1);
        }

        const points = getStarPoints(target, radius, 5);
        const completedLines = Math.floor(progress * (points.length));
        const partialProgress = (progress * (points.length)) % 1;

        let currentPoint = points[0];
        if (!currentPoint) return;
        globalThis.predictionGraphics.moveTo(currentPoint.x, currentPoint.y);

        for (let i = 0; i < completedLines; i++) {
          const nextPoint = getNextPoint(points, points.indexOf(currentPoint));
          if (nextPoint) {
            globalThis.predictionGraphics.lineTo(nextPoint.x, nextPoint.y);
            currentPoint = nextPoint;
          }
        }

        if (partialProgress > 0) {
          const nextPoint = getNextPoint(points, points.indexOf(currentPoint));;
          if (nextPoint) {
            const lerp = lerpVec2(currentPoint, nextPoint, partialProgress);
            globalThis.predictionGraphics.lineTo(lerp.x, lerp.y);
          }
        }

        if (progress >= 1) {
          globalThis.predictionGraphics?.drawCircle(target.x, target.y, radius);
          playSFXKey('targetAquired');
        }
      }
    }
  }

  // Await the post animation delay
  await new Promise(resolve => setTimeout(resolve, postAnimationDelay));
  globalThis.predictionGraphics?.clear();
  return;
}

function getNextPoint(points: Vec2[], current: number) {
  return points[(current + Math.floor(points.length / 2) + 1) % points.length];
}

function getStarPoints(center: Vec2, radius: number, numOfPoints: number): Vec2[] {
  const outerPoints: Vec2[] = [];
  const angleIncrement = (2 * Math.PI) / numOfPoints;
  let angleOffset = 0;

  // Ensures odd-pointed stars are "upright", with one point directly north
  if (numOfPoints % 2 !== 0) {
    angleOffset = angleIncrement / 2;
  }

  for (let i = 0; i < numOfPoints; i++) {
    const angle = (i * angleIncrement) + angleOffset;
    const outerX = center.x + (radius * Math.sin(angle));
    const outerY = center.y + (radius * Math.cos(angle));
    outerPoints.push({ x: outerX, y: outerY });
  }

  return outerPoints;
}

export default spell;