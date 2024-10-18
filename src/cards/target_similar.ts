import { addTarget, EffectState, getCurrentTargets, ICard, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import * as math from '../jmath/math';
import { isUnit } from '../entity/Unit';
import { isPickup } from '../entity/Pickup';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { HasSpace } from '../entity/Type';
import Underworld from '../Underworld';
import { animateConnections } from './connect';

export const targetSimilarId = 'Target Similar';
const spell: Spell = {
  card: {
    id: targetSimilarId,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.FORBIDDEN],
    thumbnail: 'spellIconTargetSimilar.png',
    requiresFollowingCard: true,
    description: 'spell_target_similar',
    allowNonUnitTarget: true,
    effect: targetSimilarEffect(1),
  }
};
export function targetSimilarEffect(numberOfTargets: number) {
  return async (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, outOfRange?: boolean) => {
    // We store the initial targets because target similar mutates state.targetedUnits
    let targets: HasSpace[] = getCurrentTargets(state);
    const initialTargets = targets;
    const animators = [];
    for (let i = 0; i < initialTargets.length; i++) {
      targets = getCurrentTargets(state);
      const target = initialTargets[i];
      if (!target) continue;

      const potentialTargets = underworld.getPotentialTargets(prediction).filter(t => !targets.includes(t));
      const similarThings = findSimilar(target, underworld, prediction, potentialTargets);

      const newTargets = similarThings.slice(0, numberOfTargets * quantity);
      if (!prediction) {
        playSFXKey('targeting');
        animators.push([{ from: target, targets: newTargets.map(x => ({ to: x, playedSound: false })) }]);
      }
      for (let newTarget of newTargets) {
        addTarget(newTarget, state, underworld, prediction);
      }
    }

    await animateConnections(animators, underworld, prediction);

    return state;
  }

}

export function findSimilar(target: HasSpace, underworld: Underworld, prediction: boolean, potentialTargets?: HasSpace[]): HasSpace[] {
  const similarThings = (potentialTargets || underworld.getPotentialTargets(prediction))
    // Filter out source
    .filter(t => t != target)
    // Filter out dissimilar types
    // @ts-ignore Find similar units by unitSourceId, find similar pickups by name
    .filter(t => {
      if (isUnit(target) && isUnit(t) && t.unitSourceId == target.unitSourceId) {
        if (underworld.players.filter(p => !p.isSpawned).map(p => p.unit.id).includes(t.id)) {
          // Do not allow targeting unspawned players
          console.log("Filtered out unspawned player from target similar's potential targets");
          return false;
        }
        if (target.alive) {
          // Match living units of the same faction
          return t.alive && t.faction == target.faction;
        } else {
          // Match any dead unit
          return !t.alive;
        }
      } else if (isPickup(target) && isPickup(t) && t.name == target.name) {
        return true;
      } else {
        return false;
      }
    })
    .sort(math.sortCosestTo(target));

  return similarThings;
}

export default spell;