import * as Unit from '../Unit';
import type { UnitSource } from './index';
import * as math from '../../jmath/math';
import { UnitSubType } from '../../types/commonTypes';
import Underworld from '../../Underworld';
import { makeAncientParticles } from '../../graphics/ParticleCollection';
import { makeManaTrail } from '../../graphics/Particles';

const numberOfTargets = 3;
export const ANCIENT_UNIT_ID = 'ancient';
const unit: UnitSource = {
  id: ANCIENT_UNIT_ID,
  info: {
    description: 'ancient description',
    image: 'units/ancient',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    damage: 3,
    attackRange: 1200,
    staminaMax: 0,
    healthMax: 30,
    mana: 30,
    manaMax: 30,
    manaPerTurn: 5,
    manaCostToCast: 10,
    bloodColor: 0x426061,
  },
  spawnParams: {
    probability: 30,
    budgetCost: 2,
    unavailableUntilLevelIndex: 4,
  },
  animations: {
    idle: 'units/ancient',
    hit: 'units/ancient',
    attack: 'units/ancient',
    die: 'units/ancient_dead',
    walk: 'units/ancient',
  },
  sfx: {
    damage: 'ancientHit',
    death: 'ancientDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image) {
      unit.image.sprite.anchor.y = 0.2;
    }
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    // Attack
    if (attackTargets && attackTargets.length && canAttackTarget && unit.mana >= unit.manaCostToCast) {
      let promises = [];
      unit.mana -= unit.manaCostToCast;
      for (let i = 0; i < numberOfTargets; i++) {
        const attackTarget = attackTargets[i];
        if (attackTarget) {
          // Attack or move, not both; so clear their existing path
          unit.path = undefined;
          Unit.orient(unit, attackTarget);
          makeAncientParticles(unit, false);
          promises.push(makeManaTrail(unit, attackTarget, underworld, '#5a7879', '#304748').then(() => {
            Unit.takeDamage(attackTarget, unit.damage, attackTarget, underworld, false, undefined);
          }));
        }
      }
      await Promise.all(promises);
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
      .slice(0, numberOfTargets);
  }
};

export default unit;
