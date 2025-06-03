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
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconNukitsuke.png',
    description: 'spell_nukitsuke',
    effect: async (state, card, quantity, underworld, prediction) => {
      const targets = getCurrentTargets(state);
      playDefaultSpellSFX(card, prediction);
      if (targets[0]) {
        const vector = normalizedVector(state.casterUnit, targets[0]).vector || { x: 0, y: 0 };
        const width = config.COLLISION_MESH_RADIUS / 2;
        const depth = distance(state.casterUnit, targets[0]);
        const targetingColumn = getColumnPoints(state.casterUnit, vector, width, depth);
        const withinColumn: IUnit[] = underworld.getPotentialTargets(
          prediction
        ).filter(t => {
          return isVec2InsidePolygon(t, targetingColumn);
        }).flatMap(t => isUnit(t) ? [t] : []);

        await forcePushToDestination(state.casterUnit, targets[0], quantity, underworld, prediction, state.casterUnit);

        for (let unit of withinColumn) {
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
