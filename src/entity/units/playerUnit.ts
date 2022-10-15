import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import * as slash from '../../cards/slash';

const unit: UnitSource = {
  id: 'Spellmason',
  info: {
    description: 'You and your kin are Spellmasons: mighty wizards that forge magic with nothing but a bit of ingenuity and some mana.',
    image: 'units/playerIdle',
    subtype: UnitSubType.PLAYER_CONTROLLED,
  },
  unitProps: {},
  // This is how a user unit would act if controlled by AI (this can happen if you clone yourself)
  action: async (unit: Unit.IUnit, attackTarget: Unit.IUnit | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    // Attack
    if (attackTarget && canAttackTarget) {
      // Archers attack or move, not both; so clear their existing path
      unit.path = undefined;
      Unit.orient(unit, attackTarget);
      const keyMoment = () => underworld.castCards({}, unit, [slash.id], attackTarget, false, false);
      await Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false });
    }
    // Movement:
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit, underworld);
    if (closestEnemy) {
      const distanceToEnemy = math.distance(unit, closestEnemy);
      // Trick to make the unit only move as far as will put them in range but no closer
      unit.stamina = Math.min(unit.stamina, distanceToEnemy - unit.attackRange);
      await Unit.moveTowards(unit, closestEnemy, underworld);
    }
  },
  animations: {
    idle: 'units/playerIdle',
    hit: 'units/playerHit',
    attack: 'units/playerAttack',
    die: 'units/playerDeath',
    walk: 'units/playerWalk',
  },
  sfx: {
    death: 'playerUnitDeath',
    damage: 'unitDamage',
  }
};
export default unit;
