import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType } from '../commonTypes';
import * as math from '../math';
import { createVisualLobbingProjectile } from '../Projectile';
import Shield from '../cards/shield';
import { apply as purify } from '../cards/purify';

const CAST_MANA_COST = 30;
const unit: UnitSource = {
  id: 'priest',
  info: {
    description: 'The priest heals damaged allies, and if it\'s allies are at full health it will bless them with a Shield.',
    image: 'units/priestIdle',
    subtype: UnitSubType.SUPPORT_CLASS,
  },
  unitProps: {
    attackRange: 400
  },
  spawnParams: {
    probability: 20,
    unavailableUntilLevelIndex: 5,
  },
  animations: {
    idle: 'units/priestIdle',
    hit: 'units/priestHit',
    attack: 'units/priestAttack',
    die: 'units/priestDeath',
    walk: 'units/priestWalk',
  },
  extraTooltipInfo: () => {
    return `Mana cost per cast: ${CAST_MANA_COST}`;
  },
  action: async (unit: Unit.IUnit) => {
    // Move to closest ally
    const closestAlly = Unit.findClosestUnitInSameFaction(unit);
    if (closestAlly) {
      const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestAlly, unit.stamina);
      await Unit.moveTowards(unit, moveTo);
    } else {
      // flee from closest enemey
      const closestEnemy = Unit.findClosestUnitInDifferentFaction(unit);
      if (closestEnemy) {
        const moveTo = math.getCoordsAtDistanceTowardsTarget(unit, closestEnemy, -unit.stamina);
        await Unit.moveTowards(unit, moveTo);
      }
    }
    // If they have enough mana
    if (unit.mana >= CAST_MANA_COST) {
      // Heal an ally
      const damagedAllys = window.underworld.units.filter(
        (u) => u.faction === unit.faction && u.alive && u.health < u.healthMax,
      );
      if (damagedAllys.length) {
        for (let ally of damagedAllys) {
          if (Unit.inRange(unit, ally)) {
            const chosenUnit = damagedAllys[0];
            if (chosenUnit) {
              await Unit.playAnimation(unit, unit.animations.attack);
              await createVisualLobbingProjectile(
                unit,
                chosenUnit,
                'holy-projectile.png',
              );
              // Heal for 2
              Unit.takeDamage(chosenUnit, -2, false, undefined);
              // Purify
              purify(chosenUnit);
              // Remove mana once the cast occurs
              unit.mana -= CAST_MANA_COST;
            }
            break;
          }
        }
      } else {
        // if there are no damaged allies cast shield on the closest:
        if (closestAlly) {
          if (Unit.inRange(unit, closestAlly)) {
            await Unit.playAnimation(unit, unit.animations.attack);
            await createVisualLobbingProjectile(
              unit,
              closestAlly,
              'holy-projectile.png',
            );
            Unit.addModifier(closestAlly, Shield.card.id);
            purify(closestAlly);
            // Remove mana once the cast occurs
            unit.mana -= CAST_MANA_COST;
          }
        }
      }
    }
  },
};

export default unit;
