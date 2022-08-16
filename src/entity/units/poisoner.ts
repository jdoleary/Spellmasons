import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as Unit from '../Unit';
import * as math from '../../jmath/math';
import * as poison from '../../cards/poison';
import { addPixiSpriteAnimated, containerSpells, containerUnits } from '../../graphics/PixiUtils';
import { bloodPoisoner } from '../../graphics/ui/colors';

const unit: UnitSource = {
  id: 'poisoner',
  info: {
    description: 'A poisoner will cast a poison curse on it\'s enemies.',
    image: 'units/poisIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: 210,
    bloodColor: bloodPoisoner
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 7,
  },
  animations: {
    idle: 'units/poisIdle',
    hit: 'units/poisHit',
    attack: 'units/poisAttack',
    die: 'units/poisDeath',
    walk: 'units/poisWalk',
  },
  action: async (unit: Unit.IUnit, _attackTarget, underworld) => {
    const nonPoisonedEnemyUnits = underworld.units.filter(
      (u) =>
        u.faction !== unit.faction &&
        u.alive &&
        u.modifiers.poison === undefined,
    );
    if (nonPoisonedEnemyUnits.length) {
      const chosenUnit = nonPoisonedEnemyUnits[0];
      if (chosenUnit) {
        if (Unit.inRange(unit, chosenUnit)) {
          // Poisoners attack or move, not both; so clear their existing path
          unit.path = undefined;
          await Unit.playAnimation(unit, unit.animations.attack);
          createVisualLobbingProjectile(
            unit,
            chosenUnit,
            'projectile/poisonerProjectile',
          ).then(() => {
            // prediction is false because unit.action doesn't yet ever occur during a prediction
            Unit.addModifier(chosenUnit, poison.id, underworld, false);
            // Add projectile hit animation
            Unit.addOneOffAnimation(chosenUnit, 'projectile/poisonerProjectileHit');
          });
        } else {
          // Only move if not in range
          const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, chosenUnit, unit.stamina);
          await Unit.moveTowards(unit, moveTo, underworld);
        }
      }
    }
  },
};
export default unit;
