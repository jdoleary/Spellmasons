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
const liquidRadiusMultiplier = 1.5;
const boltAnimationTime = 1000;
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Damage,
    manaCost: 8,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconBolt.png',
    sfx: 'bolt',
    supportQuantity: true,
    requiresFollowingCard: false,
    description: ['spell_bolt', damage.toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // Bolt starts with 1 chain, and gets +1 chain per quantity
      let chainsRemaining = quantity;
      const potentialTargets = underworld.getPotentialTargets(prediction);
      const targets = getCurrentTargets(state);
      if (targets.length) {
        playDefaultSpellSFX(card, prediction);
      }

      // An array of bolts, or chainGroups, which is an array of affected entities;
      const chains: { entity: HasSpace, chainsRemaining: number }[][] = [];
      // Loop through all initial targets, and emit a bolt from each
      for (let i = 0; i < targets.length; i++) {
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

          // +25% base radius per radius boost
          let adjustedRadius = baseRadius * (1 + (0.25 * state.aggregator.radiusBoost))
          const chained = getConnectingEntities(
            target,
            adjustedRadius,
            chainsRemaining,
            [target], // Each bolt is individual/isolated, and can hit existing targets
            potentialTargets,
            typeFilter,
            prediction,
            ModifyBoltRadius,
          );

          // Keep track of affected entities and chains remaining for each one
          const entities = [target].concat(chained.map(x => x.entity));
          const chainGroup: { entity: HasSpace, chainsRemaining: number }[] = [];
          for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity) {
              chainGroup.push({ entity, chainsRemaining: chainsRemaining - i })
            }
          }

          // Add this bolt, aka chain group, to the final array of chain groups
          chains.push(chainGroup);
        }
      }

      if (!prediction) {
        await raceTimeout(500 + boltAnimationTime, 'bolt animate', animate(chains));
      }

      // Loop through each bolt / chain group
      for (let g = 0; g < chains.length; g++) {
        // Loop through all chained entities of this bolt / chain group
        const chainGroup = chains[g];
        if (chainGroup) {
          for (let i = 0; i < chainGroup.length; i++) {
            const chainedEntity = chainGroup[i];
            if (chainedEntity) {
              if (Unit.isUnit(chainedEntity.entity)) {
                // Damage is multiplied by the number of chains remaining at each entity
                Unit.takeDamage({
                  unit: chainedEntity.entity,
                  amount: damage * (chainedEntity.chainsRemaining + 1),
                  sourceUnit: state.casterUnit,
                }, underworld, prediction);
              }
            }

          }
        }
      }

      return state;
    },
  },
};

export function ModifyBoltRadius(sourceEntity: HasSpace, chainsLeft: number): number {
  return (1 + (chainsLeft * 0.25)) * (sourceEntity.inLiquid ? liquidRadiusMultiplier : 1);
}

async function animate(chains: { entity: HasSpace, chainsRemaining: number }[][]) {
  // Animations do not occur on headless
  if (!globalThis.headless) {
    return new Promise<void>((resolve) => {
      doDraw(resolve, chains, Date.now() + boltAnimationTime);
    }).then(() => {
      globalThis.predictionGraphics?.clear();
    });
  }
}
function doDraw(resolve: (value: void | PromiseLike<void>) => void, chains: { entity: HasSpace, chainsRemaining: number }[][], endTime: number) {
  const didDraw = drawLineBetweenTargets(chains, endTime);
  if (didDraw) {
    // Show the electricity for a moment
    if (Date.now() > endTime) {
      resolve();
    } else {
      requestAnimationFrame(() => doDraw(resolve, chains, endTime))
    }
  } else {
    resolve();
  }
}
// Returns true if it did draw
function drawLineBetweenTargets(chains: { entity: HasSpace, chainsRemaining: number }[][], endTime: number): boolean {
  // Animations do not occur on headless
  if (!globalThis.headless) {
    if (globalThis.predictionGraphics) {
      // Clear last animation frame
      globalThis.predictionGraphics.clear();

      // All chain groups animate simultaneously
      for (let g = 0; g < chains.length; g++) {
        // Targets is one "chain group"
        const targets = chains[g];
        if (targets && targets[0]) {
          // We want to draw all bolts within the animation time
          // Hangtime is what % of the animation time should be spent with all bolts complete
          const hangtime = 0.2;
          const timePassed = boltAnimationTime - (endTime - Date.now());
          const boltsToDraw = Math.min(targets.length * timePassed / (boltAnimationTime * (1 - hangtime)), targets.length - 1);

          let from = targets[0];
          globalThis.predictionGraphics.moveTo(from.entity.x, from.entity.y);

          for (let i = 0; i <= boltsToDraw; i++) {
            // Draw lightning to the next target if it exists, else draw lightning on self
            let target = targets[i + 1] || from;
            if (target) {
              // bolt size should increase with chains remaining to
              // emphasize mechanic of inc. damage/ranged per chain left
              const boltSize = Math.sqrt(from.chainsRemaining) * 2;
              globalThis.predictionGraphics.lineStyle(boltSize, 0xffffff, 1.0)

              // pow function creates more impact/pause between chains hit
              const progress = Math.pow(Math.min(boltsToDraw - i, 1), 10);
              for (let j = 1; j <= 5; j++) {
                const intermediaryPoint = jitter(lerpVec2(from.entity, target.entity, 0.2 * progress * j), boltSize * 3);
                globalThis.predictionGraphics.lineTo(intermediaryPoint.x, intermediaryPoint.y);
              }
              from = target;
            }
          }
        }
      }

      return true;
    }
  }
  return false;
}

export default spell;
