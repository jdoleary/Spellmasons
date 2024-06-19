import { addTarget, EffectState, ICard, Spell } from './index';
import { CardCategory, Faction, UnitSubType } from '../types/commonTypes';
import { Vec2 } from '../jmath/Vec';
import * as Unit from '../entity/Unit';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import * as config from '../config';
import * as colors from '../graphics/ui/colors';
import Underworld from '../Underworld';
import { calculateGameDifficulty } from '../Difficulty';
import { distance } from '../jmath/math';

export const targetInjuredId = 'Target Injured';
const targetsPerQuantity = 2;
const spell: Spell = {
  card: {
    id: targetInjuredId,
    category: CardCategory.Targeting,
    supportQuantity: true,
    manaCost: 25,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconTargetInjured.png',
    requiresFollowingCard: true,
    description: ['spell_target_injured', targetsPerQuantity.toString()],
    allowNonUnitTarget: true,
    effect: async (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, outOfRange?: boolean) => {

      const targets = state.targetedUnits;
      const factions = Unit.getFactionsOf(targets);
      // Only target living units who have less than max hp
      let addedTargets = prediction ? underworld.unitsPrediction : underworld.units;
      addedTargets = addedTargets.filter(u =>
        u.alive &&
        u.health < u.healthMax &&
        u.unitSubType != UnitSubType.DOODAD &&
        !u.flaggedForRemoval &&
        // Limit to the factions that are targeted
        // so if you're targeting enemies it will only target wounded enemies
        // Default to enemy if no-one is targeted for convenience
        (factions.length === 0 ? [Faction.ENEMY] : factions).includes(u.faction) &&
        // Filter out caster Unit since they are naturally
        // the "closest" to themselves and if they want to target
        // themselves they can by casting on themselves and wont
        // need target injured to do it
        u !== state.casterUnit &&
        !state.targetedUnits.includes(u))
        // Sort by most missing health, and then dist to caster
        .sort((a, b) =>
          (b.healthMax - b.health) - (a.healthMax - a.health) ||
          distance(state.casterPositionAtTimeOfCast, a) - distance(state.casterPositionAtTimeOfCast, b))
        .slice(0, targetsPerQuantity * quantity);

      if (addedTargets.length) {
        for (const target of addedTargets) {
          addTarget(target, state, underworld, prediction);
        }
        if (!prediction && !globalThis.headless) {
          playSFXKey('targeting');
          await animateTargetInjured(addedTargets);
        }
      }

      return state;
    },
  }
};

export async function animateTargetInjured(newTargets: Vec2[]) {
  const animationDelay = 600; //ms
  await new Promise<void>((resolve) => {
    for (let target of newTargets) {
      if (globalThis.predictionGraphics) {
        globalThis.predictionGraphics.lineStyle(2, colors.targetingSpellGreen, 1.0)
        playSFXKey('targetAquired');
        globalThis.predictionGraphics.drawCircle(target.x, target.y, config.COLLISION_MESH_RADIUS);
        // Show the targeting circle for a moment
        setTimeout(resolve, animationDelay);
      } else {
        resolve();
      }
    }
  });

  globalThis.predictionGraphics?.clear();

  return;
}

export default spell;