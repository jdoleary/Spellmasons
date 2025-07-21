import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { forcePushToDestination } from '../effects/force_move';
import { getColumnPoints } from './target_column';
import { drawUIPolyPrediction } from '../graphics/PlanningView';
import { normalizedVector } from '../jmath/moveWithCollision';
import * as config from '../config';
import { distance, lerp } from '../jmath/math';
import { dash_id } from './dash';
import { isVec2InsidePolygon } from '../jmath/Polygon2';
import { isUnit, takeDamage, IUnit } from '../entity/Unit';
import { nukitsuke_id } from './nukitsuke';
import { clone } from '../jmath/Vec';
import floatingText from '../graphics/FloatingText';

const damage = 60;
export const nukitsuke2_id = 'Nukitsuke 2';
const spell: Spell = {
  card: {
    id: nukitsuke2_id,
    requires: [nukitsuke_id],
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'dash',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconNukitsuke2.png',
    description: 'spell_nukitsuke_2',
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = getCurrentTargets(state);
      playDefaultSpellSFX(card, prediction);
      const target = targets[0];
      const startingPoint = clone(state.casterUnit);
      if (target) {
        const vector = normalizedVector(state.casterUnit, target).vector || { x: 0, y: 0 };
        const width = config.COLLISION_MESH_RADIUS / 2;

        await forcePushToDestination(state.casterUnit, target, quantity, underworld, prediction, state.casterUnit);

        const depth = distance(startingPoint, state.casterUnit);
        const targetingColumn = getColumnPoints(startingPoint, vector, width, depth);
        // Debug
        // if (prediction) {
        //   drawUIPolyPrediction(targetingColumn, 0xff0000);
        // }
        const withinColumn: IUnit[] = underworld.getPotentialTargets(
          prediction
        ).filter(t => {
          return isVec2InsidePolygon(t, targetingColumn);
        }).flatMap(t => isUnit(t) ? [t] : []);


        const distanceChunk = 300;
        for (let unit of withinColumn) {
          if (unit === state.casterUnit) {
            continue;
          }
          const damageMultiplier = lerp(1, 2, (Math.max(distanceChunk, distance(startingPoint, unit)) - distanceChunk) / distanceChunk, true)
          if (!prediction) {
            floatingText({
              coords: unit,
              text: `x${Math.round(damageMultiplier * 10) / 10} ${i18n('Damage')}`,
            });
          }
          takeDamage({
            unit: unit,
            amount: damage * damageMultiplier,
            sourceUnit: state.casterUnit,
            fromVec2: state.casterUnit,
          }, underworld, prediction);
        }
      }
      return state;
    },
  },
};
export default spell;
