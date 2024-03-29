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

export const POISONER_ID = 'poisoner';
const unit: UnitSource = {
  id: POISONER_ID,
  info: {
    description: 'poisoner_copy',
    image: 'units/poisIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    damage: 1,
    attackRange: 350,
    healthMax: 60,
    mana: 60,
    manaMax: 60,
    manaPerTurn: 15,
    manaCostToCast: 30,
    bloodColor: bloodPoisoner,
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
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    const chosenUnit = attackTargets && attackTargets[0];
    if (chosenUnit && canAttackTarget) {
      let manaBeforeCast = unit.mana;
      await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
        await createVisualLobbingProjectile(
          unit,
          chosenUnit,
          'projectile/poisonerProjectile',
        ).then(async () => {
          // Add projectile hit animation
          Image.addOneOffAnimation(chosenUnit, 'projectile/poisonerProjectileHit');
          const cardsIds = [];
          // Casts one stack of poison per damage
          for (let i = 0; i < unit.damage; i++) {
            cardsIds.push(poison.poisonCardId);
          }
          await underworld.castCards({
            casterCardUsage: {},
            casterUnit: unit,
            casterPositionAtTimeOfCast: Vec.clone(unit),
            cardIds: cardsIds,
            castLocation: chosenUnit,
            prediction: false,
            outOfRange: false,
          });
        });
      });
      // TODO - Workaround used several times, refactor.
      // Needs effect function and/or castCardsFree method
      unit.mana = manaBeforeCast - unit.manaCostToCast;
    } else {
      if (chosenUnit) {
        const distanceToEnemy = math.distance(unit, chosenUnit);
        // The following is a hacky way to make them not move too close to the enemy
        unit.stamina = Math.min(unit.stamina, distanceToEnemy - config.COLLISION_MESH_RADIUS);
        await Unit.moveTowards(unit, chosenUnit, underworld);
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    const closestUnit = Unit.findClosestUnitInDifferentFactionSmartTarget(unit, underworld.units);
    if (closestUnit) {
      return [closestUnit];
    } else {
      return [];
    }
  }
};
export default unit;
