import { refundLastSpell, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { defaultPushDistance } from '../effects/force_move';
import { addWarningAtMouse } from '../graphics/PlanningView';
import { Vec2 } from '../jmath/Vec';
import { baseExplosionRadius, explode } from '../effects/explode';
import * as colors from '../graphics/ui/colors';

export const meteorCardId = 'meteor';
const damage = 60;
const baseRadius = baseExplosionRadius;
const basePushDistance = defaultPushDistance;
const spell: Spell = {
  card: {
    id: meteorCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    sfx: 'push',
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 2,
    allowNonUnitTarget: true,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconMeteor.png',
    description: 'Big meteor', // TODO - Description
    effect: async (state, card, quantity, underworld, prediction) => {
      // We should create a meteor at each targeted unit
      // Or if no targeted units, at the cast location
      const targetedUnits = state.targetedUnits.filter(u => u.alive);
      let meteorLocations: Vec2[] = [];
      if (targetedUnits.length > 0) {
        targetedUnits.forEach(u => {
          meteorLocations.push({ x: u.x, y: u.y })
        });
      }
      else {
        // If cast location is out of bounds, refund
        if (underworld.isCoordOnWallTile(state.castLocation)) {
          if (prediction) {
            const WARNING = "Invalid Summon Location";
            addWarningAtMouse(WARNING);
          } else {
            refundLastSpell(state, prediction, 'Invalid summon location, mana refunded.')
          }
          return state;
        }
        // Add cast location to targets [];
        meteorLocations.push(state.castLocation);
      }

      let promises = [];
      playDefaultSpellSFX(card, prediction);
      // TODO - Update with new radiusBoost https://github.com/jdoleary/Spellmasons/pull/491
      const adjustedRadius = baseRadius + state.aggregator.radius;
      for (let meteorLocation of meteorLocations) {
        promises.push(explode(meteorLocation, adjustedRadius, damage * quantity, basePushDistance,
          underworld, prediction,
          colors.bloatExplodeStart, colors.bloatExplodeEnd))
      }
      await Promise.all(promises);
      return state;
    },
  },
};

export default spell;