import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import * as config from '../../config';
import Underworld from '../../Underworld';
import { makeDarkPriestAttackParticles } from '../../graphics/ParticleCollection';

const manaCostToCast = 60;
const NUMBER_OF_GEYSERS = 6;
export const DARK_PRIEST_ID = 'dark priest';
const unit: UnitSource = {
  id: DARK_PRIEST_ID,
  info: {
    description: ['dark_priest_copy', NUMBER_OF_GEYSERS.toString()],
    image: 'units/priestIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    damage: 40,
    attackRange: 264,
    healthMax: 60,
    mana: 90,
    manaMax: 90,
    manaPerTurn: 30,
    manaCostToCast: 60,
  },
  spawnParams: {
    probability: 20,
    budgetCost: 10,
    unavailableUntilLevelIndex: 8,
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
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image && unit.image.sprite && unit.image.sprite.filters) {
      unit.image.sprite.filters.push(
        new MultiColorReplaceFilter(
          [
            [0xfcffc8, 0x705284], // light
            [0xa6b671, 0x513b5f], // medium
            [0xbfc280, 0x574067], // thigh
            [0xe5e8b6, 0x6a4d7d], // face
            [0x808344, 0x3a2b45], // dark
          ],
          0.11
        )
      );
    }
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld: Underworld) => {
    let didAction = false;
    // If they have enough mana
    if (unit.mana >= manaCostToCast) {
      if (attackTargets.length) {
        let geyserPromises = [];
        await Unit.playAnimation(unit, unit.animations.attack);
        // Remove mana once the cast occurs
        unit.mana -= manaCostToCast;
        didAction = true;
        for (let i = 0; i < attackTargets.length; i++) {
          const attackTarget = attackTargets[i];
          if (attackTarget) {

            geyserPromises.push(new Promise<void>((resolve) => {
              // Space them out in time
              setTimeout(() => {
                Unit.takeDamage(attackTarget, unit.damage, attackTarget, underworld, false);
                makeDarkPriestAttackParticles(attackTarget, false, resolve);
              }, math.distance(unit, attackTarget));
            }));
          }
        }
        await Promise.all(geyserPromises);
      }
    }
    if (!didAction) {
      // Move to closest enemy
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
    return Unit.livingUnitsInDifferentFaction(unit, underworld)
      .filter(u => Unit.inRange(unit, u))
      .sort(math.sortCosestTo(unit))
      .slice(0, NUMBER_OF_GEYSERS);
  }
};


export default unit;
