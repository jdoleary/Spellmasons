import { getCurrentTargets, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { forcePushToDestination } from '../effects/force_move';
import { getColumnPoints } from './target_column';
import { drawUIPolyPrediction } from '../graphics/PlanningView';
import { normalizedVector } from '../jmath/moveWithCollision';
import * as config from '../config';
import { distance } from '../jmath/math';
import { dash_id } from './dash';
import { isVec2InsidePolygon } from '../jmath/Polygon2';
import { isUnit, takeDamage, IUnit } from '../entity/Unit';
import { clone } from '../jmath/Vec';

const damage = 60;
export const nukitsuke_id = 'Nukitsuke';
const spell: Spell = {
  card: {
    id: nukitsuke_id,
    requires: [dash_id],
    category: CardCategory.Movement,
    supportQuantity: true,
    sfx: 'dash',
    manaCost: 10,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconNukitsuke.png',
    description: ['spell_nukitsuke', damage.toString()],
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
        const withinColumn: IUnit[] = underworld.getPotentialTargets(
          prediction
        ).filter(t => {
          return isVec2InsidePolygon(t, targetingColumn);
        }).flatMap(t => isUnit(t) ? [t] : []);


        for (let unit of withinColumn) {
          if (unit === state.casterUnit) {
            continue;
          }
          takeDamage({
            unit: unit,
            amount: damage,
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
