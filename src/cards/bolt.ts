import { getCurrentTargets, Spell } from './index';
import * as Unit from '../entity/Unit';
import * as config from '../config';
import { CardCategory, CardRarity, probabilityMap } from '../types/commonTypes';
import { isPickup } from '../entity/Pickup';
import { HasSpace } from '../entity/Type';
import { getTouchingTargetableEntitiesRecursive } from './connect';

const id = 'Bolt';
const numberOfTargetsPerQuantity = 3;
const damage = 20;
const baseRadius = config.PLAYER_BASE_ATTACK_RANGE - 10;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Damage,
    manaCost: 40,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconBolt.png',
    supportQuantity: true,
    requiresFollowingCard: false,
    description: ['spell_bolt', damage.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      let limitTargetsLeft = numberOfTargetsPerQuantity * quantity;
      const potentialTargets = underworld.getPotentialTargets(prediction);
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      const targets = getCurrentTargets(state);
      const length = targets.length;
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (target) {
          const typeFilter = Unit.isUnit(target)
            ? (target.alive
              // If target is a living unit, only chain to other living units
              ? (x: any) => x.alive
              // If target is a dead unit, only chain to other dead units
              : (x: any) => !x.alive)
            : isPickup(target)
              // If target is a pickup, only chain to other pickups
              ? isPickup
              : () => {
                console.warn('Original target is neither unit nor pickup and is not yet supported in Connect spell');
                return false;
              };

          // Find all units touching the spell origin
          const chained = await getTouchingTargetableEntitiesRecursive(
            target.x,
            target.y,
            potentialTargets,
            baseRadius + state.aggregator.radius,
            prediction,
            { limitTargetsLeft },
            0,
            typeFilter,
            targets
          );
          const affected = [target, ...chained.map(x => x.entity)];
          // Draw prediction lines so user can see how it chains
          if (prediction) {
            drawLineBetweenTargest(affected);
          } else {
            // Draw all final circles for a moment before casting
            await animate(affected);
          }
          // Update effectState targets
          affected.forEach(u => {
            if (Unit.isUnit(u)) {
              Unit.takeDamage(u, damage, undefined, underworld, prediction, state);
            } else {
              console.log('TODO, handle damage to pickups')
            }
          })
        }
      }

      return state;
    },
  },
};
async function animate(targets: HasSpace[]) {
  // Animations do not occur on headless
  if (!globalThis.headless) {
    return new Promise<void>((resolve) => {
      const didDraw = drawLineBetweenTargest(targets);
      if (didDraw) {
        // Show the electricity for a moment
        setTimeout(resolve, 300);
      } else {
        resolve();
      }
    }).then(() => {
      globalThis.predictionGraphics?.clear();
    });
  }
}
// Returns true if it did draw
function drawLineBetweenTargest(targets: HasSpace[]): boolean {
  // Animations do not occur on headless
  if (!globalThis.headless) {
    if (globalThis.predictionGraphics) {
      if (targets[0] === undefined) {
        return false;
      }
      globalThis.predictionGraphics.clear();
      globalThis.predictionGraphics.lineStyle(2, 0xffffff, 1.0)
      globalThis.predictionGraphics.moveTo(targets[0].x, targets[0].y);
      for (let target of targets) {
        globalThis.predictionGraphics.lineTo(target.x, target.y);
      }
      return true;
    }
  }
  return false;

}
export default spell;
