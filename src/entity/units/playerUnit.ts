import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import * as config from '../../config';
import { oneOffImage } from '../../cards/cardUtils';
import { containerSpells } from '../../graphics/PixiUtils';
import { raceTimeout } from '../../Promise';

export const spellmasonUnitId = 'Spellmason';
const playerUnit: UnitSource = {
  id: spellmasonUnitId,
  info: {
    description: 'You and your kin are Spellmasons: mighty wizards that forge magic with nothing but a bit of ingenuity and some mana.',
    image: 'playerIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    // Player clones must be able to deal damage
    damage: 20,
    attackRange: config.PLAYER_BASE_ATTACK_RANGE
  },
  // This is how a user unit would act if controlled by AI (this can happen if you clone yourself)
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    const attackTarget = attackTargets && attackTargets[0];
    // Attack
    if (attackTarget && canAttackTarget) {
      Unit.orient(unit, attackTarget);
      const keyMoment = async () => {
        playSFXKey('hurt');
        oneOffImage(attackTarget, 'spell-effects/spellHurtCuts', containerSpells);
        Unit.takeDamage({
          unit: attackTarget,
          amount: unit.damage,
          sourceUnit: unit,
          fromVec2: unit,
        }, underworld, false);
      }
      await raceTimeout(8_000, 'NPC Spellmason', Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false }));
    } else {
      // Movement:
      const closestEnemy = Unit.findClosestUnitInDifferentFactionSmartTarget(unit, underworld.units);
      if (closestEnemy) {
        const distanceToEnemy = math.distance(unit, closestEnemy);
        // Trick to make the unit only move as far as will put them in range but no closer
        unit.stamina = Math.min(unit.stamina, distanceToEnemy + config.COLLISION_MESH_RADIUS - unit.attackRange);
        await Unit.moveTowards(unit, closestEnemy, underworld);
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.unitType == UnitType.AI) {
      const closestUnit = Unit.findClosestUnitInDifferentFactionSmartTarget(unit, underworld.units);
      if (closestUnit) {
        return [closestUnit];
      } else {
        return [];
      }
    }
    return [];
  },
  animations: {
    idle: 'playerIdle',
    hit: 'playerHit',
    attack: 'playerAttack',
    die: 'playerDeath',
    walk: 'playerWalk',
  },
  sfx: {
    death: 'playerUnitDeath',
    damage: 'unitDamage',
  }
};
export default playerUnit;
