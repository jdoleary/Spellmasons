import * as Unit from '../Unit';
import type { UnitSource } from './index';
import * as math from '../../jmath/math';
import { UnitSubType } from '../../types/commonTypes';
import Underworld from '../../Underworld';
import { makeAncientParticles } from '../../graphics/ParticleCollection';
import { makeManaTrail } from '../../graphics/Particles';

const numberOfTargets = 6;
export const CORRUPTED_ANCIENT_UNIT_ID = 'Corrupted Ancient';
const unit: UnitSource = {
  id: CORRUPTED_ANCIENT_UNIT_ID,
  info: {
    description: 'ancient description',
    image: 'ancient_corrupted',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    damage: 6,
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
    probability: 10,
    budgetCost: 4,
    unavailableUntilLevelIndex: 7,
  },
  animations: {
    idle: 'ancient_corrupted',
    hit: 'ancient_corrupted',
    attack: 'ancient_corrupted',
    die: 'ancient_corrupted_dead',
    walk: 'ancient_corrupted',
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
      const numberOfAllyAncients = underworld.units.reduce((sum, cur) => cur.faction == unit.faction && cur.unitSourceId == unit.unitSourceId ? sum + 1 : sum, 0);
      for (let i = 0; i < numberOfTargets; i++) {
        const attackTarget = attackTargets[i];
        if (attackTarget) {
          Unit.orient(unit, attackTarget);
          makeAncientParticles(unit, false);
          promises.push(makeManaTrail(unit, attackTarget, underworld, '#5a7879', '#304748', numberOfAllyAncients).then(() => {
            Unit.takeDamage({
              unit: attackTarget,
              amount: unit.damage,
              sourceUnit: unit,
              fromVec2: unit,
            }, underworld, false);
          }));
        }
      }
      await Promise.all(promises);
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    return Unit.livingUnitsInDifferentFaction(unit, underworld.units)
      .filter(u => Unit.inRange(unit, u))
      .sort(math.sortCosestTo(unit))
      .slice(0, numberOfTargets);
  }
};

export default unit;
