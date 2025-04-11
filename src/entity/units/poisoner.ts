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
import { animateSpell } from '../../cards/cardUtils';
import { chooseOneOf } from '../../jmath/rand';

export const POISONER_ID = 'poisoner';
const unit: UnitSource = {
  id: POISONER_ID,
  info: {
    description: 'poisoner_copy',
    image: 'poisIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    damage: 20,
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
    idle: 'poisIdle',
    hit: 'poisHit',
    attack: 'poisAttack',
    die: 'poisDeath',
    walk: 'poisWalk',
  },
  sfx: {
    damage: 'poisonerHurt',
    death: 'poisonerDeath'
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    const chosenUnit = attackTargets && attackTargets[0];
    if (chosenUnit && canAttackTarget) {
      unit.mana -= unit.manaCostToCast;
      await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
        await createVisualLobbingProjectile(
          unit,
          chosenUnit,
          'poisonerProjectile',
        ).then(async () => {
          // Add projectile hit animation
          Image.addOneOffAnimation(chosenUnit, 'poisonerProjectileHit');
          if (globalThis.sfx) {
            globalThis.playSFX(chooseOneOf(globalThis.sfx['poison']))
          }
          await animateSpell(chosenUnit, 'spellPoison');
          Unit.addModifier(chosenUnit, poison.poisonCardId, underworld, false, unit.damage, { sourceUnitId: unit.id });
        });
      });
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
