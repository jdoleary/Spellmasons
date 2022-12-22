import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import { createVisualFlyingProjectile } from '../Projectile';
import * as resurrect from '../../cards/resurrect';
import Underworld from '../../Underworld';
import * as Image from '../../graphics/Image';
import { summoningSicknessId } from '../../modifierSummoningSickness';

const manaCostToCast = resurrect.default.card.manaCost;
async function animatePriestProjectileAndHit(self: Unit.IUnit, target: Unit.IUnit) {
  // TODO does this cause an issue on headless?
  await createVisualFlyingProjectile(
    self,
    target,
    'projectile/priestProjectileCenter',
  );
}
async function healOneOf(self: Unit.IUnit, units: Unit.IUnit[], underworld: Underworld): Promise<boolean> {
  playSFXKey('priestAttack');
  for (let ally of units) {
    if (Unit.inRange(self, ally)) {
      await Unit.playAnimation(self, unit.animations.attack);
      await animatePriestProjectileAndHit(self, ally);
      const { targetedUnits } = await underworld.castCards({}, self, [resurrect.id], ally, false);
      for (let unit of targetedUnits) {
        // Add summoning sickeness so they can't act after they are summoned
        Unit.addModifier(unit, summoningSicknessId, underworld, false);
      }
      // // Remove mana once the cast occurs
      // self.mana -= manaCostToCast;
      return true;
    }
  }
  return false;

}
const unit: UnitSource = {
  id: 'priest',
  info: {
    description: `The priest resurrects dead allies.`,
    image: 'units/priestIdle',
    subtype: UnitSubType.SUPPORT_CLASS,
  },
  unitProps: {
    attackRange: 264,
    healthMax: 2,
    damage: 2,
    manaCostToCast,
    manaPerTurn: manaCostToCast / 2
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 5,
  },
  animations: {
    idle: 'units/priestIdle',
    hit: 'units/priestHit',
    attack: 'units/priestAttack',
    die: 'units/priestDeath',
    walk: 'units/priestWalk',
  },
  sfx: {
    damage: 'priestHurt',
    death: 'priestDeath',
  },
  extraTooltipInfo: () => {
    return `Mana cost per cast: ${manaCostToCast}`;
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld: Underworld) => {
    let didAction = false;
    // If they have enough mana
    if (unit.mana >= manaCostToCast) {
      if (attackTargets.length) {
        // Priests attack or move, not both; so clear their existing path
        unit.path = undefined;
        // Resurrect dead ally
        didAction = await healOneOf(unit, attackTargets, underworld);
      }
    }
    if (!didAction) {
      const closestAlly = Unit.findClosestUnitInSameFaction(unit, underworld);
      // Move to closest ally
      if (closestAlly) {
        const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestAlly, unit.stamina);
        await Unit.moveTowards(unit, moveTo, underworld);
      } else {
        // flee from closest enemey
        const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit, underworld);
        if (closestEnemy) {
          const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, -unit.stamina);
          await Unit.moveTowards(unit, moveTo, underworld);
        }
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    const resurrectableAllies = underworld.units.filter(u => u.faction == unit.faction && !u.alive);
    return resurrectableAllies;
  }
};

export default unit;
