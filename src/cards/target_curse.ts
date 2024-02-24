import { addTarget, EffectState, ICard, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { Vec2, lerpVec2 } from '../jmath/Vec';
import * as Unit from '../entity/Unit';
import { IUnit } from '../entity/Unit';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { easeOutCubic } from '../jmath/Easing';
import * as config from '../config';
import * as colors from '../graphics/ui/colors';
import Underworld from '../Underworld';
import { getOrInitModifier } from './util';

export const targetCurseId = 'Target Curse';
function add(unit: IUnit, underworld: Underworld, prediction: boolean, quantity: number, extra?: any) {
  const modifier = getOrInitModifier(unit, targetCurseId, { isCurse: true, quantity: 1, keepOnDeath: true }, () => {
    // Nothing to init
  });
}
const spell: Spell = {
  card: {
    id: targetCurseId,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconTargetCurse.png',
    requiresFollowingCard: false,
    description: 'spell_target_curse',
    allowNonUnitTarget: true,
    effect: async (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, outOfRange?: boolean) => {
      // We store the initial targets because target curse mutates state.targetedUnits
      const targets = state.targetedUnits;
      // Add Target Curse to all targeted units
      for (const target of targets) {
        if (!target.modifiers[targetCurseId]) {
          Unit.addModifier(target, targetCurseId, underworld, prediction);
        }
      }

      const potentialTargets =
        (prediction ? underworld.unitsPrediction : underworld.units)
          .filter(u => !u.flaggedForRemoval);

      // Add all other target-cursed enemies to targets
      for (const unit of potentialTargets) {
        if (!targets.includes(unit) && unit.modifiers[targetCurseId]) {
          addTarget(unit, state);
        }
      }

      if (!prediction && !globalThis.headless && targets.length) {
        playSFXKey('targeting');
        await animateTargetCurse(targets);
      }

      return state;
    },
  },
  modifiers: {
    add,
  },
};

export async function animateTargetCurse(newTargets: Vec2[]) {
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
      globalThis.predictionGraphics.lineStyle(1.5, 0x9933FF, 0.8);
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