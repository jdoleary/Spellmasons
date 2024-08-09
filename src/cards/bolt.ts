import { getCurrentTargets, Spell } from './index';
import * as Unit from '../entity/Unit';
import * as config from '../config';
import { CardCategory, CardRarity, probabilityMap } from '../types/commonTypes';
import { isPickup } from '../entity/Pickup';
import { HasSpace } from '../entity/Type';
import { getConnectingEntities } from './connect';
import { jitter, lerpVec2 } from '../jmath/Vec';
import { playDefaultSpellSFX } from './cardUtils';
import { raceTimeout } from '../Promise';
import { baseExplosionRadius } from '../effects/explode';

const id = 'Bolt';
const damage = 8;
const baseRadius = baseExplosionRadius;
// Submerged units increase radius dramatically
const liquidRadiusMultiplier = 2;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Damage,
    manaCost: 12,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconBolt.png',
    sfx: 'bolt',
    supportQuantity: true,
    requiresFollowingCard: false,
    description: ['spell_bolt', damage.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // Bolt has functionally unlimited targets
      let limitTargetsLeft = 10_000;
      const potentialTargets = underworld.getPotentialTargets(prediction);
      // Note: This loop must NOT be a for..of and it must cache the length because it
      // mutates state.targetedUnits as it iterates.  Otherwise it will continue to loop as it grows
      const targets = getCurrentTargets(state);
      const length = targets.length;
      if (length) {
        playDefaultSpellSFX(card, prediction);
      }
      const affected: HasSpace[] = [];
      for (let i = 0; i < length; i++) {
        const target = targets[i];
        if (target) {
          const typeFilter = Unit.isUnit(target)
            ? (target.alive
              // If target is a living unit, only chain to other living units in the same faction
              ? (x: Unit.IUnit) => x.alive && x.faction == target.faction
              // If target is a dead unit, only chain to other dead units
              : (x: any) => !x.alive)
            : isPickup(target)
              // If target is a pickup, only chain to other pickups
              ? isPickup
              : () => {
                console.warn('Original target is neither unit nor pickup and is not yet supported in Connect spell');
                return false;
              };

          let adjustedRadius = baseRadius * (1 + (0.25 * state.aggregator.radiusBoost))
          // Find all units touching the spell origin
          const chained = getConnectingEntities(
            target,
            adjustedRadius,
            limitTargetsLeft,
            targets,
            potentialTargets,
            typeFilter,
            prediction,
            ModifyBoltRadius,
          );
          for (let entity of chained.map(x => x.entity).concat(target)) {
            if (!affected.includes(entity)) {
              affected.push(entity);
            }
          }
        }
      }

      if (!prediction) {
        await raceTimeout(1000, 'bolt animate', animate(affected));
      }
      affected.forEach(u => {
        if (Unit.isUnit(u)) {
          Unit.takeDamage({
            unit: u,
            amount: damage * quantity * targets.length,
            sourceUnit: state.casterUnit,
          }, underworld, prediction);
        }
      })

      return state;
    },
  },
};

export function ModifyBoltRadius(sourceEntity: HasSpace): number {
  return sourceEntity.inLiquid ? liquidRadiusMultiplier : 1;
}

async function animate(targets: HasSpace[]) {
  // Animations do not occur on headless
  if (!globalThis.headless) {
    return new Promise<void>((resolve) => {
      doDraw(resolve, targets, Date.now() + 700);
    }).then(() => {
      globalThis.predictionGraphics?.clear();
    });
  }
}
function doDraw(resolve: (value: void | PromiseLike<void>) => void, targets: HasSpace[], endTime: number) {
  const didDraw = drawLineBetweenTargets(targets);
  if (didDraw) {
    // Show the electricity for a moment
    if (Date.now() > endTime) {
      resolve();
    } else {
      requestAnimationFrame(() => doDraw(resolve, targets, endTime))
    }
  } else {
    resolve();
  }
}
// Returns true if it did draw
function drawLineBetweenTargets(targets: HasSpace[]): boolean {
  // Animations do not occur on headless
  if (!globalThis.headless) {
    if (globalThis.predictionGraphics) {
      if (targets[0] === undefined) {
        return false;
      }
      globalThis.predictionGraphics.clear();
      globalThis.predictionGraphics.lineStyle(2, 0xffffff, 1.0)
      globalThis.predictionGraphics.moveTo(targets[0].x, targets[0].y);
      let from = targets[0];
      for (let target of targets) {
        for (let i = 0; i < 5; i++) {
          const intermediaryPoint = jitter(lerpVec2(from, target, 0.2 * i), 8);
          globalThis.predictionGraphics.lineTo(intermediaryPoint.x, intermediaryPoint.y);
        }
        globalThis.predictionGraphics.lineTo(target.x, target.y);
        from = target;
      }
      return true;
    }
  }
  return false;
}

export default spell;
