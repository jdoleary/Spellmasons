import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as Unit from '../Unit';
import * as math from '../../jmath/math';
import * as poison from '../../cards/poison';
import { addPixiSpriteAnimated, containerSpells, containerUnits } from '../../graphics/PixiUtils';

const unit: UnitSource = {
  id: 'poisoner',
  info: {
    description: 'A poisoner will cast a poison curse on it\'s enemies.',
    image: 'units/poisIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: 210
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
  action: async (unit: Unit.IUnit) => {
    const nonPoisonedEnemyUnits = window.underworld.units.filter(
      (u) =>
        u.faction !== unit.faction &&
        u.alive &&
        u.modifiers.poison === undefined,
    );
    if (nonPoisonedEnemyUnits.length) {
      const chosenUnit = nonPoisonedEnemyUnits[0];
      if (chosenUnit) {
        if (Unit.inRange(unit, chosenUnit)) {
          await Unit.playAnimation(unit, unit.animations.attack);
          createVisualLobbingProjectile(
            unit,
            chosenUnit,
            'projectile/poisonerProjectile',
          ).then(() => {
            Unit.addModifier(chosenUnit, poison.id);
            // Add projectile hit animation
            const animationSprite = addPixiSpriteAnimated('projectile/poisonerProjectileHit', containerUnits, {
              loop: false,
              animationSpeed: 0.2,
              onComplete: () => {
                if (animationSprite?.parent) {
                  animationSprite.parent.removeChild(animationSprite)
                } else {
                  console.error('Expected poisoner animationSprite to have parent so it could be removed but it did not.')
                }
              }
            });
            if (animationSprite) {
              animationSprite.anchor.set(0.5);
              animationSprite.x = chosenUnit.x;
              animationSprite.y = chosenUnit.y;
            }

          });
        }
        const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, chosenUnit, unit.stamina);
        await Unit.moveTowards(unit, moveTo);
      }
    }
  },
};
export default unit;
