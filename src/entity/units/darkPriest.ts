import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import * as config from '../../config';
import Underworld from '../../Underworld';
import { makeDarkPriestAttackParticles } from '../../graphics/ParticleCollection';

const manaCostToCast = 30;
const NUMBER_OF_GEISERS = 6;
const unit: UnitSource = {
  id: 'dark priest',
  info: {
    description: 'Releasing geysers of dark energy, the dark priest damages it\'s enemies in a long line.',
    image: 'units/priestIdle',
    subtype: UnitSubType.SUPPORT_CLASS,
  },
  unitProps: {
    attackRange: 264,
    healthMax: 6,
    damage: 4,
    manaCostToCast
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 7,
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
        // @ts-ignore for some reason ts is flagging this as an error but it works fine
        // in pixi.
        new MultiColorReplaceFilter(
          [
            [0xfcffc8, 0x782b2b], // light
            [0xa6b671, 0x531e1e], // medium
            [0xbfc280, 0x5a2121], // thigh
            [0xe5e8b6, 0x6d2828], // face
            [0x808344, 0x3c1616], // dark
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
      const attackTarget = attackTargets && attackTargets[0];
      if (attackTarget) {
        // Attack or move, not both; so clear their existing path
        unit.path = undefined;
        const distToAttackTarget = math.distance(unit, attackTarget);
        let geiserPromises = [];
        await Unit.playAnimation(unit, unit.animations.attack);
        // Remove mana once the cast occurs
        unit.mana -= manaCostToCast;
        didAction = true;
        for (let i = 0; i < NUMBER_OF_GEISERS; i++) {
          geiserPromises.push(new Promise<void>((resolve) => {
            const nextGeiserPosition = math.getCoordsAtDistanceTowardsTarget(unit, attackTarget, distToAttackTarget + config.COLLISION_MESH_RADIUS * 2 * i, true);
            if (underworld.isCoordOnWallTile(nextGeiserPosition)) {
              resolve();
              return;
            }
            // Space them out in time
            setTimeout(() => {
              makeDarkPriestAttackParticles(nextGeiserPosition, false, resolve);
              const withinRadius = underworld.getEntitiesWithinDistanceOfTarget(
                nextGeiserPosition,
                config.COLLISION_MESH_RADIUS * 2,
                false
              );
              // Wait a moment before dealing damage
              setTimeout(() => {
                withinRadius.forEach(entity => {
                  if (Unit.isUnit(entity)) {
                    Unit.takeDamage(entity, unit.damage, undefined, underworld, false);
                  }
                });
              }, 100);

            }, 100 * i);
          }));
        }
        await Promise.all(geiserPromises);
      }
    }
    console.log('jtest', didAction)
    if (!didAction) {
      console.log('jtest move toward')
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
    const closestUnit = Unit.findClosestUnitInDifferentFaction(unit, underworld);
    if (closestUnit) {
      return [closestUnit];
    } else {
      return [];
    }
  }
};

export default unit;
