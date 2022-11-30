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
const unit: UnitSource = {
  id: 'dark priest',
  info: {
    description: `Releasing geysers of dark energy, the dark priest can attack up to ${NUMBER_OF_GEYSERS} of enemies at once.`,
    image: 'units/priestIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: 264,
    healthMax: 6,
    damage: 4,
    manaCostToCast,
    manaMax: manaCostToCast * 2,
    manaPerTurn: 30
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 11,
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
          0.1
        )
      );
    }
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld: Underworld) => {
    let didAction = false;
    // If they have enough mana
    if (unit.mana >= manaCostToCast) {
      if (attackTargets.length) {
        // Attack or move, not both; so clear their existing path
        unit.path = undefined;
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
                makeDarkPriestAttackParticles(attackTarget, false, resolve);
                setTimeout(() => {
                  Unit.takeDamage(attackTarget, unit.damage, undefined, underworld, false);
                }, math.distance(unit, attackTarget));
              }, 100 * i);
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
      .filter(u => math.distance(unit, u) <= unit.attackRange)
      .map(u => ({ unit: u, dist: math.distance(unit, u) }))
      .sort((a, b) => {
        return a.dist - b.dist;
      })
      .map(x => x.unit)
      .slice(0, NUMBER_OF_GEYSERS);
  }
};


export default unit;
