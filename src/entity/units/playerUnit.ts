import type { UnitSource } from './index';
import { CardCategory, UnitSubType, UnitType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import * as config from '../../config';
import { calculateCost, oneOffImage } from '../../cards/cardUtils';
import { containerSpells } from '../../graphics/PixiUtils';
import { raceTimeout } from '../../Promise';
import { add, clampVector, clone, getDirectionVector, isVec2, jitter, Vec2 } from '../../jmath/Vec';
import { teachCardId } from '../../cards/teach';
import { getCardsFromIds } from '../../cards';
import floatingText from '../../graphics/FloatingText';
import { slashCardId } from '../../cards/slash';

export const spellmasonUnitId = 'Spellmason';
const playerUnit: UnitSource = {
  id: spellmasonUnitId,
  info: {
    description: 'You and your kin are Spellmasons: mighty wizards that forge magic with nothing but a bit of ingenuity and some mana.',
    image: 'playerIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    // Player clones must be able to deal damage
    damage: 20,
    attackRange: config.PLAYER_BASE_ATTACK_RANGE
  },
  // This is how a user unit would act if controlled by AI (this can happen if you clone yourself)
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    const attackTarget = attackTargets && attackTargets[0];
    // If target is not a unit, we need to get the targeting info again, because
    // getUnitAttackTargets only allows for returning unit targets, and AI Spellmasons
    // can target the ground.
    const targetingInfo = getTargetingInfo(unit);
    const groundTarget = getTargets(unit, targetingInfo, underworld);
    // The target as a vec2 wether the target is a Unit (the attackTarget) or a place
    // on the ground (target)
    const vec2Target: Vec2 | undefined = isVec2(groundTarget) ? groundTarget : attackTarget;

    // Attack
    if (vec2Target && ((attackTarget && canAttackTarget) || (!Unit.isUnit(groundTarget) && isVec2(groundTarget)))) {
      const cardIds = unit.modifiers[teachCardId]?.spell || [slashCardId];
      const cards = getCardsFromIds(cardIds);
      const cost = calculateCost(cards, {})
      const sufficientMana = cost.manaCost <= unit.mana;
      const sufficientHealth = cost.healthCost <= unit.health;
      if (sufficientHealth && sufficientMana) {
        // `target as Vec2` because above typeGuard narrows it
        Unit.orient(unit, vec2Target);
        const keyMoment = async () => {
          await underworld.castCards({
            casterCardUsage: {},
            casterUnit: unit,
            casterPositionAtTimeOfCast: clone(unit),
            cardIds: cardIds,
            castLocation: vec2Target,
            initialTargetedUnitId: attackTarget?.id,
            prediction: false,
            outOfRange: false,
          });
        }
        // animationKey logic copied from networkHandler
        let animationKey = 'playerAttackEpic';
        if (cardIds.length < 3) {
          animationKey = 'playerAttackSmall';
        } else if (cardIds.length < 6) {
          animationKey = 'playerAttackMedium0';
        } else if (cardIds.length < 10) {
          animationKey = 'playerAttackMedium1';
        }
        // end copied block
        await raceTimeout(8_000, 'NPC Spellmason', Unit.playComboAnimation(unit, animationKey, keyMoment, { animationSpeed: 0.2, loop: false }));
      } else {
        if (!sufficientMana) {
          floatingText({ coords: unit, text: i18n('insufficient mana'), style: { fill: 'red' } });
        } else if (!sufficientHealth) {
          floatingText({ coords: unit, text: i18n('insufficient health'), style: { fill: 'red' } });
        }
      }
    } else {
      // Movement:
      const closestEnemy = Unit.findClosestUnitInDifferentFactionSmartTarget(unit, underworld.units);
      if (closestEnemy) {
        const distanceToEnemy = math.distance(unit, closestEnemy);
        // Trick to make the unit only move as far as will put them in range but no closer
        unit.stamina = Math.min(unit.stamina, distanceToEnemy + config.COLLISION_MESH_RADIUS - unit.attackRange);
        await Unit.moveTowards(unit, closestEnemy, underworld);
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.unitType == UnitType.AI) {
      const targetingInfo = getTargetingInfo(unit);
      const target = getTargets(unit, targetingInfo, underworld);
      // Note: Target may be a vec2 in which case canAttack will be ignored in the above action() function
      if (target && Unit.isUnit(target)) {
        return [target];
      } else {
        return [];
      }
    }
    return [];
  },
  animations: {
    idle: 'playerIdle',
    hit: 'playerHit',
    attack: 'playerAttack',
    die: 'playerDeath',
    walk: 'playerWalk',
  },
  sfx: {
    death: 'playerUnitDeath',
    damage: 'unitDamage',
  }
};
interface TargetingInstructions {
  targetEnemies: boolean;
  targetDead: boolean;
  nonUnitTarget: boolean;
}
// memoize calculation
const memo: { [joinedCardIds: string]: TargetingInstructions } = {};
function getTargetingInfo(unit: Unit.IUnit): TargetingInstructions {
  const cardIds = unit.modifiers[teachCardId]?.spell || ['slash'];
  const joinedCardIds = cardIds.join('');
  const memoizedRecord = memo[joinedCardIds]
  if (memoizedRecord) {
    return memoizedRecord;
  }
  const cards = getCardsFromIds(cardIds);
  const numberOfBlessings = cards.reduce((acc, cur) => cur.category === CardCategory.Blessings ? 1 + acc : acc, 0);
  const numberOfAttacks = cards.reduce((acc, cur) => [CardCategory.Damage, CardCategory.Curses, CardCategory.Movement].includes(cur.category) ? 1 + acc : acc, 0);

  const nonUnitTarget = cards.reduce((acc, cur) => [CardCategory.Soul, CardCategory.Movement].includes(cur.category) && cur.allowNonUnitTarget ? 1 + acc : acc, 0) > 0;
  const targetDead = cards.reduce((acc, cur) => cur.onlySelectDeadUnits ? 1 + acc : acc, 0) > 0;
  const targetEnemies = numberOfAttacks >= numberOfBlessings;
  const result = {
    targetEnemies,
    targetDead,
    nonUnitTarget
  }
  memo[joinedCardIds] = result;
  return result;
}
function getTargets(self: Unit.IUnit, targetingInstructions: TargetingInstructions, underworld: Underworld): Unit.IUnit | Vec2 | undefined {
  if (targetingInstructions.targetDead) {
    return Unit.closestInListOfUnits(self, Unit.deadUnits(self, underworld.units));
  } else {
    const closestEnemy = Unit.findClosestUnitInDifferentFactionSmartTarget(self, underworld.units);
    if (targetingInstructions.nonUnitTarget && closestEnemy) {
      return underworld.DEPRECIATED_findValidSpawnInRadius(self, false, { allowLiquid: false }) || self;
    } else if (targetingInstructions.targetEnemies && closestEnemy) {
      return closestEnemy;
    } else if (!targetingInstructions.targetEnemies) {
      return Unit.closestInListOfUnits(self, Unit.livingUnitsInSameFaction(self, underworld.units));
    }
  }
  return undefined;
}
export default playerUnit;
