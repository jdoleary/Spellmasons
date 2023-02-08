import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as Unit from '../Unit';
import * as math from '../../jmath/math';
import * as Vec from '../../jmath/Vec';
import * as poison from '../../cards/poison';
import { bloodPoisoner } from '../../graphics/ui/colors';
import * as Image from '../../graphics/Image';
import Underworld from '../../Underworld';
import * as config from '../../config';

const unit: UnitSource = {
  id: 'poisoner',
  info: {
    description: 'poisoner_copy',
    image: 'units/poisIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: 350,
    bloodColor: bloodPoisoner,
    healthMax: 60,
    manaCostToCast: 15
  },
  spawnParams: {
    probability: 15,
    budgetCost: 5,
    unavailableUntilLevelIndex: 3,
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
    const chosenUnit = attackTargets[0];
    if (chosenUnit) {
      unit.mana - unit.manaCostToCast;
      // Poisoners attack or move, not both; so clear their existing path
      unit.path = undefined;
      await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
        await createVisualLobbingProjectile(
          unit,
          chosenUnit,
          'projectile/poisonerProjectile',
        ).then(async () => {
          // Add projectile hit animation
          Image.addOneOffAnimation(chosenUnit, 'projectile/poisonerProjectileHit');
          await underworld.castCards({
            casterCardUsage: {},
            casterUnit: unit,
            casterPositionAtTimeOfCast: Vec.clone(unit),
            cardIds: [poison.poisonCardId],
            castLocation: chosenUnit,
            prediction: false,
            outOfRange: false,
          });
        });

      });
    } else {
      const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit, underworld);
      if (closestEnemy) {
        const distanceToEnemy = math.distance(unit, closestEnemy);
        // The following is a hacky way to make them not move too close to the enemy
        unit.stamina = Math.min(unit.stamina, distanceToEnemy - config.COLLISION_MESH_RADIUS);
        await Unit.moveTowards(unit, closestEnemy, underworld);
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    const enemies = Unit.livingUnitsInDifferentFaction(unit, underworld);
    const target = enemies[0];
    if (target && Unit.inRange(unit, target) && unit.mana >= unit.manaCostToCast) {
      return [target];
    } else {
      return [];
    }
  }
};
export default unit;
