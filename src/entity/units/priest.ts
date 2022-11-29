import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import { createVisualFlyingProjectile } from '../Projectile';
import Shield from '../../cards/shield';
import { hasBloodCurse } from '../../cards/blood_curse';
import Underworld from '../../Underworld';
import * as Image from '../../graphics/Image';

const manaCostToCast = 30;
async function animatePriestProjectileAndHit(self: Unit.IUnit, target: Unit.IUnit) {
  await createVisualFlyingProjectile(
    self,
    target,
    'projectile/priestProjectileCenter',
  );
  // Add projectile hit animation
  Image.addOneOffAnimation(target, 'projectile/priestProjectileHit');
}
async function healOneOf(self: Unit.IUnit, units: Unit.IUnit[], underworld: Underworld): Promise<boolean> {
  playSFXKey('priestAttack');
  for (let ally of units) {
    if (Unit.inRange(self, ally)) {
      await Unit.playAnimation(self, unit.animations.attack);
      await animatePriestProjectileAndHit(self, ally);
      // Heal for damage amount (because damage scales when miniboss)
      Unit.takeDamage(ally, -self.damage, undefined, underworld, false, undefined);
      // Remove mana once the cast occurs
      self.mana -= manaCostToCast;
      return true;
      break;
    }
  }
  return false;

}
const unit: UnitSource = {
  id: 'priest',
  info: {
    description: 'The priest heals its allies, and if its allies are at full health it will shield them.  Priests will also attack of a different faction if they have blood curse by healing them (heals are taken as damage when a unit is blood cursed).',
    image: 'units/priestIdle',
    subtype: UnitSubType.SUPPORT_CLASS,
  },
  unitProps: {
    attackRange: 264,
    healthMax: 2,
    damage: 2,
    manaCostToCast
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
    const closestAlly = Unit.findClosestUnitInSameFaction(unit, underworld);
    // If they have enough mana
    if (unit.mana >= manaCostToCast) {
      if (attackTargets.length) {
        // Heal to damage enemy vampires
        didAction = await healOneOf(unit, attackTargets, underworld);
      } else {
        // Heal an ally
        const damagedAllys = underworld.units.filter(
          // Only select allies, that are alive, that are damaged, and that aren't SUPPORT_CLASS cause it's
          // annoying when priests heal each other.
          // Also exclude vampires because vampires take health as DAMAGE! And we don't want priests hurting their ally vampires
          (u) => u.faction === unit.faction && u.alive && u.health < u.healthMax && u.unitSubType !== UnitSubType.SUPPORT_CLASS && !hasBloodCurse(u),
        );
        if (damagedAllys.length) {
          didAction = await healOneOf(unit, damagedAllys, underworld);
        } else {
          // if there are no damaged allies cast shield on the closest:
          if (closestAlly && closestAlly.unitSubType !== UnitSubType.SUPPORT_CLASS) {
            if (Unit.inRange(unit, closestAlly)) {
              playSFXKey('priestAttack');
              await Unit.playAnimation(unit, unit.animations.attack);
              await animatePriestProjectileAndHit(unit, closestAlly);
              // prediction is false because unit.action doesn't yet ever occur during a prediction
              Unit.addModifier(closestAlly, Shield.card.id, underworld, false);
              // Remove mana once the cast occurs
              unit.mana -= manaCostToCast;
              didAction = true;
            }
          }
        }
      }
    }
    if (!didAction) {
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
    // Heal (in order to damage) enemy vampires
    const enemyVampires = underworld.units.filter(
      u => u.faction !== unit.faction && hasBloodCurse(u)
    );
    return enemyVampires;
  }
};

export default unit;
