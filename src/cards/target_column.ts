import type * as PIXI from 'pixi.js';
import { addTarget, getCurrentTargets, Spell } from './index';
import { drawUIPoly } from '../graphics/PlanningView';
import { CardCategory } from '../types/commonTypes';
import * as colors from '../graphics/ui/colors';
import { invert, Vec2 } from '../jmath/Vec';
import { moveAlongVector, normalizedVector } from '../jmath/moveWithCollision';
import { isVec2InsidePolygon } from '../jmath/Polygon2';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { raceTimeout } from '../Promise';
import { easeOutCubic } from '../jmath/Easing';
import * as config from '../config';
import { HasSpace } from '../entity/Type';

const id = 'Target Column';
const range = 200;
const baseWidth = 20;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.SPECIAL],
    thumbnail: 'spellIconTargetColumn.png',
    requiresFollowingCard: true,
    description: `
Adds targets to the spell in a column.
"${id}" can be cast multiple times in succession to expand the width of the column. 
    `,
    allowNonUnitTarget: true,
    effect: async (state, card, quantity, underworld, prediction, outOfRange) => {
      const depth = range + state.aggregator.radius;
      const width = baseWidth * quantity;
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      let targets: Vec2[] = getCurrentTargets(state);
      targets = targets.length ? targets : [state.castLocation];
      const length = targets.length;
      const vector = normalizedVector(state.casterUnit, state.castLocation).vector || { x: 0, y: 0 };
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (!target) {
          continue;
        }
        const targetingColumn = getColumnPoints(target, vector, width, depth);
        // Draw visual circle for prediction
        if (prediction) {
          const color = outOfRange ? colors.outOfRangeGrey : colors.targetingSpellGreen
          drawUIPoly(targetingColumn, color);
        } else {
          await animate(target, vector, width, depth, underworld);
        }
        const withinColumn = underworld.getPotentialTargets(
          prediction
        ).filter(t => {
          return isVec2InsidePolygon(t, targetingColumn);
        });
        // Add entities to target
        withinColumn.forEach(e => addTarget(e, state));
      }

      return state;
    },
  },
};
function getColumnPoints(castLocation: Vec2, vector: Vec2, width: number, depth: number): Vec2[] {
  const p1 = moveAlongVector(castLocation, invert(vector), -width);
  const p2 = moveAlongVector(castLocation, invert(vector), width);
  const p3 = moveAlongVector(p2, vector, depth);
  const p4 = moveAlongVector(p1, vector, depth);
  return [p1, p2, p3, p4];
}

async function animate(castLocation: Vec2, vector: Vec2, width: number, depth: number, underworld: Underworld) {
  const iterations = 100;
  const millisBetweenIterations = 12;
  // Keep track of which entities have been targeted so far for the sake
  // of making a new sfx when a new entity gets targeted
  const entitiesTargeted: HasSpace[] = [];
  playSFXKey('targeting');
  // "iterations + 10" gives it a little extra time so it doesn't timeout right when the animation would finish on time
  return raceTimeout(millisBetweenIterations * (iterations + 10), 'animatedExpand', new Promise<void>(resolve => {
    for (let i = 0; i < iterations; i++) {

      setTimeout(() => {
        if (globalThis.predictionGraphics) {
          globalThis.predictionGraphics.clear();
          globalThis.predictionGraphics.beginFill(colors.targetingSpellGreen, 0.2);

          const animatedDepth = depth * easeOutCubic((i + 1) / iterations);

          const targetingColumn = getColumnPoints(castLocation, vector, width, animatedDepth);
          globalThis.predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1.0)
          globalThis.predictionGraphics.drawPolygon(targetingColumn as PIXI.Point[]);
          globalThis.predictionGraphics.endFill();
          const withinColumn = underworld.getPotentialTargets(
            false
          ).filter(t => {
            return isVec2InsidePolygon(t, targetingColumn);
          });
          withinColumn.forEach(v => {
            if (!entitiesTargeted.includes(v)) {
              entitiesTargeted.push(v);
              let sfxNumber = Math.floor(i / (iterations / 4));
              playSFXKey(`targetAquired${sfxNumber}`);
            }
            globalThis.predictionGraphics?.drawCircle(v.x, v.y, config.COLLISION_MESH_RADIUS);
          })
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
