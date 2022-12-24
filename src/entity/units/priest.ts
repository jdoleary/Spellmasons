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
async function resurrectOneOf(self: Unit.IUnit, units: Unit.IUnit[], underworld: Underworld): Promise<boolean> {
  if (units.length == 0) {
    return false;
  }
  playSFXKey('priestAttack');
  for (let ally of units) {
    await Unit.playAnimation(self, unit.animations.attack);
    await animatePriestProjectileAndHit(self, ally);
    const { targetedUnits } = await underworld.castCards({}, self, [resurrect.id], ally, false);
    for (let unit of targetedUnits) {
      // Add summoning sickeness so they can't act after they are summoned
      Unit.addModifier(unit, summoningSicknessId, underworld, false);
    }
    return true;
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
    attackRange: 500,
    healthMax: 2,
    damage: 2,
    manaCostToCast,
    manaMax: manaCostToCast,
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
    if (attackTargets.length) {
      // Priests attack or move, not both; so clear their existing path
      unit.path = undefined;
      // Resurrect dead ally
      didAction = await resurrectOneOf(unit, attackTargets, underworld);
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
    if (unit.mana < manaCostToCast) {
      return [];
    }
    const resurrectableAllies = underworld.units.filter(u =>
      u.faction == unit.faction
      && !u.alive
      && Unit.inRange(unit, u)
      // Do not allow priest to rez each other.
      // That would be super annoying for players
      && u.unitSourceId !== unit.unitSourceId);
    return resurrectableAllies;
  }
};

export default unit;
