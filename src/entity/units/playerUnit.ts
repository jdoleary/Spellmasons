import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import * as config from '../../config';
import { oneOffImage } from '../../cards/cardUtils';
import { containerSpells } from '../../graphics/PixiUtils';

export const spellmasonUnitId = 'Spellmason';
const playerUnit: UnitSource = {
  id: spellmasonUnitId,
  info: {
    description: 'You and your kin are Spellmasons: mighty wizards that forge magic with nothing but a bit of ingenuity and some mana.',
    image: 'units/playerIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: config.PLAYER_BASE_ATTACK_RANGE
  },
  // This is how a user unit would act if controlled by AI (this can happen if you clone yourself)
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    const attackTarget = attackTargets && attackTargets[0];
    // Attack
    if (attackTarget && canAttackTarget) {
      // Archers attack or move, not both; so clear their existing path
      unit.path = undefined;
      Unit.orient(unit, attackTarget);
      const keyMoment = async () => {
        playSFXKey('hurt');
        oneOffImage(attackTarget, 'spell-effects/spellHurtCuts', containerSpells);
        Unit.takeDamage(attackTarget, unit.damage, unit, underworld, false);
      }
      await Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false });
    }
    // Movement:
    const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit, underworld);
    if (closestEnemy) {
      const distanceToEnemy = math.distance(unit, closestEnemy);
      // Trick to make the unit only move as far as will put them in range but no closer
      unit.stamina = Math.min(unit.stamina, distanceToEnemy + config.COLLISION_MESH_RADIUS - unit.attackRange);
      await Unit.moveTowards(unit, closestEnemy, underworld);
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.unitType == UnitType.AI) {
      const closestUnit = Unit.findClosestUnitInDifferentFaction(unit, underworld);
      if (closestUnit) {
        return [closestUnit];
      } else {
        return [];
      }
    }
    return [];
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
export default playerUnit;
