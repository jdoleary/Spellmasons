import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as Unit from '../Unit';
import * as math from '../../jmath/math';
import * as poison from '../../cards/poison';
import { bloodPoisoner } from '../../graphics/ui/colors';
import * as Image from '../../graphics/Image';
import Underworld from '../../Underworld';
import * as config from '../../config';

const unit: UnitSource = {
  id: 'poisoner',
  info: {
    description: 'A poisoner will cast a poison curse on it\'s enemies.',
    image: 'units/poisIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: 210,
    bloodColor: bloodPoisoner,
    healthMax: 6,
    manaCostToCast: 15
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 6,
  },
  animations: {
    idle: 'units/poisIdle',
    hit: 'units/poisHit',
    attack: 'units/poisAttack',
    die: 'units/poisDeath',
    walk: 'units/poisWalk',
  },
  sfx: {
    damage: 'poisonerHurt',
    death: 'poisonerDeath'
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld) => {
    if (attackTargets.length) {
      const chosenUnit = attackTargets[0];
      if (chosenUnit) {
        if (Unit.inRange(unit, chosenUnit) && unit.mana >= unit.manaCostToCast) {
          unit.mana - unit.manaCostToCast;
          // Poisoners attack or move, not both; so clear their existing path
          unit.path = undefined;
          await Unit.playAnimation(unit, unit.animations.attack);
          createVisualLobbingProjectile(
            unit,
            chosenUnit,
            'projectile/poisonerProjectile',
          ).then(() => {
            // prediction is false because unit.action doesn't yet ever occur during a prediction
            Unit.addModifier(chosenUnit, poison.id, underworld, false);
            // Add projectile hit animation
            Image.addOneOffAnimation(chosenUnit, 'projectile/poisonerProjectileHit');
          });
        } else {
          const distanceToEnemy = math.distance(unit, chosenUnit);
          // The following is a hacky way to make them not move too close to the enemy
          unit.stamina = Math.min(unit.stamina, distanceToEnemy - config.COLLISION_MESH_RADIUS);
          await Unit.moveTowards(unit, chosenUnit, underworld);
        }
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    const nonPoisonedEnemyUnits = underworld.units.filter(
      (u) =>
        u.faction !== unit.faction &&
        u.alive &&
        u.modifiers.poison === undefined,
    );
    return nonPoisonedEnemyUnits;
  }
};
export default unit;
