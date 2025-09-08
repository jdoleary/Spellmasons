import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as math from '../../jmath/math';
import * as config from '../../config';
import Underworld from '../../Underworld';
import { makeDarkPriestAttackParticles, makeParticleExplosion } from '../../graphics/ParticleCollection';

const manaCostToCast = 60;
const NUMBER_OF_GEYSERS = 6;
export const DARK_PRIEST_ID = 'dark priest';
const unit: UnitSource = {
  id: DARK_PRIEST_ID,
  info: {
    description: ['dark_priest_copy', NUMBER_OF_GEYSERS.toString()],
    image: 'dark_priest/priestIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    damage: 40,
    attackRange: 264,
    healthMax: 120,
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
    idle: 'dark_priest/priestIdle',
    hit: 'dark_priest/priestHit',
    attack: 'dark_priest/priestAttack',
    die: 'dark_priest/priestDeath',
    walk: 'dark_priest/priestWalk',
  },
  sfx: {
    damage: 'priestHurt',
    death: 'priestDeath',
  },
  action: async (unit: Unit.IUnit, attackTargets, underworld: Underworld) => {
    let didAction = false;
    // If they have enough mana
    if (unit.mana >= manaCostToCast) {
      if (attackTargets.length) {
        let geyserPromises: Promise<void>[] = [];
        playSFXKey('darkPriestAttack');
        await Unit.playAnimation(unit, unit.animations.attack);
        // Remove mana once the cast occurs
        unit.mana -= manaCostToCast;
        didAction = true;
        makeParticleExplosion(unit, unit.attackRange / 140, 0x513b5f, 0x2c2134, false);
        attackTargets.forEach(u => {
          if (headless) {
            Unit.takeDamage({
              unit: u,
              amount: unit.damage,
              sourceUnit: unit,
              fromVec2: unit,
            }, underworld, false);

          } else {

            const dist = math.distance(unit, u);
            geyserPromises.push(new Promise<void>(res => {
              setTimeout(() => {
                Unit.takeDamage({
                  unit: u,
                  amount: unit.damage,
                  sourceUnit: unit,
                  fromVec2: unit,
                }, underworld, false);
                makeDarkPriestAttackParticles(u, false);
                res();
              }, dist)
            }))
          }
        })

        await Promise.all(geyserPromises);
      }
    }
    if (!didAction) {
      // Move to closest enemy
      const closestEnemy = Unit.findClosestUnitInDifferentFactionSmartTarget(unit, underworld.units);
      if (closestEnemy) {
        const distanceToEnemy = math.distance(unit, closestEnemy);
        // The following is a hacky way to make them not move too close to the enemy
        unit.stamina = Math.min(unit.stamina, distanceToEnemy - config.COLLISION_MESH_RADIUS);
        await Unit.moveTowards(unit, closestEnemy, underworld);
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    return Unit.livingUnitsInDifferentFaction(unit, underworld.units)
      .filter(u => Unit.inRange(unit, u))
  }
};


export default unit;
