import * as Unit from '../Unit';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import { bloodLobber } from '../../graphics/ui/colors';
import * as config from '../../config';
import * as Image from '../../graphics/Image';
import * as colors from '../../graphics/ui/colors';
import { undyingModifierId } from '../../modifierUndying';
import { EffectState, registerEvents } from '../../cards';
import { drawUICircle } from '../../graphics/PlanningView';
import { suffocateCardId } from '../../cards/suffocate';
import { slowCardId } from '../../cards/slow';
import { resurrect_id } from '../../cards/resurrect';
import { corpsePrimedId } from '../../modifierCorpsePrimed';
import { boneShrapnelCardId, boneShrapnelRadius } from '../../cards/bone_shrapnel';
import { makeManaTrail } from '../../graphics/Particles';

export const GORU_UNIT_ID = 'Goru';
const unit: UnitSource = {
  id: GORU_UNIT_ID,
  info: {
    description: 'goru description',
    image: 'units/guruIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    damage: 40,
    attackRange: 400,
    healthMax: 400,
    staminaMax: 300,
    mana: 120,
    manaMax: 120,
    manaPerTurn: 60,
    manaCostToCast: 30,
    bloodColor: bloodLobber,
  },
  spawnParams: {
    // Special case: We spawn the Goru manually, but still want to declare a budget
    probability: 0,
    budgetCost: 40,
    unavailableUntilLevelIndex: 9,
  },
  animations: {
    idle: 'units/guruIdle',
    hit: 'units/guruHit',
    attack: 'units/guruAttack',
    die: 'units/guruDeath',
    walk: 'units/guruIdle',
  },
  sfx: {
    damage: 'goruHurt',
    death: 'goruDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    // TODO - Bug: Undying 2 can be re-added by cloning/splitting/creating a goru with no undying modifier
    // Using originalLife prevents this, but also prevents summoned Goru's from getting undying.
    if (!unit.modifiers[undyingModifierId]) {
      Unit.addModifier(unit, undyingModifierId, underworld, false, 2);
    }
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    // Goru has different actions that require different targets:
    // GetTargets returns all targets that could be valid for either action
    // then we filter to ensure the correct targets are chosen for either action

    // Goru will prioritise actions:
    // - Consume/Explode/Res primed corpses
    // - Attack nearby players
    // - Prime corpses (minimum 3)

    // Some actions will disallow movement
    let canMove = true;

    const primedCorpses = underworld.units.filter(u => u.modifiers[corpsePrimedId])
    if (primedCorpses.length) {
      unit.mana -= unit.manaCostToCast;

      // Consume if close
      // Explode if far and near enemy
      // Resurrect if far and not near enemy
      const corpsesToConsume: Unit.IUnit[] = [];
      const corpsesToExplode: Unit.IUnit[] = [];
      const corpsesToResurrect: Unit.IUnit[] = [];
      for (const target of primedCorpses) {
        if (math.distance(unit, target) < boneShrapnelRadius) {
          corpsesToConsume.push(target);
        } else {
          const enemyUnits = Unit.livingUnitsInDifferentFaction(unit, underworld.units);
          if (enemyUnits.find(u => math.distance(target, u) < boneShrapnelRadius)) {
            corpsesToExplode.push(target);
          } else {
            corpsesToResurrect.push(target);
          }
        }
      }

      // With corpses organized into action lists, run Goru effects
      let promises: Promise<void>[] = [];
      const oldStrength = unit.strength;
      for (const target of corpsesToConsume) {
        // Consume target
        // Copied from sacrifice.ts
        promises.push(makeManaTrail(target, unit, underworld, '#ff6767n', '#ff0000', corpsesToConsume.length * 4)
          .then(() => {
            // Heal Self
            Unit.takeDamage({
              unit: unit,
              amount: -10,
              sourceUnit: unit,
              fromVec2: unit,
            }, underworld, false);

            // Become stronger
            unit.healthMax += 10;
            unit.health += 10;
            unit.staminaMax += 10;
            unit.stamina += 10;
            unit.manaMax += 10;
            unit.mana += 10;
            // Need to scale bone shrapnel damage
            //unit.damage += 10;
            unit.attackRange += 10;
            unit.strength += 1;

            // Remove Corpse
            Unit.cleanup(target);
          }));
      }
      await Promise.all(promises);
      Unit.updateStrengthSpriteScaling(unit, oldStrength);
      promises = [];

      await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
        for (const target of corpsesToExplode) {
          // Explode Target
          promises.push(new Promise((resolve) => {
            createVisualLobbingProjectile(
              unit,
              target,
              'projectile/lobberProjectile',
            ).then(() => {
              // Bone Shrapnel
              underworld.castCards({
                casterCardUsage: {},
                casterUnit: unit,
                casterPositionAtTimeOfCast: unit,
                cardIds: [boneShrapnelCardId],
                castLocation: target,
                prediction: false,
                outOfRange: false,
                castForFree: true,
              });
              resolve();
            });
          }));
        }
        await Promise.all(promises);
        promises = [];

        for (const target of corpsesToResurrect) {
          // Resurrect Target
          promises.push(new Promise((resolve) => {
            createVisualLobbingProjectile(
              unit,
              target,
              'projectile/lobberProjectile',
            ).then(() => {
              // Resurrect
              underworld.castCards({
                casterCardUsage: {},
                casterUnit: unit,
                casterPositionAtTimeOfCast: unit,
                cardIds: [resurrect_id],
                castLocation: target,
                prediction: false,
                outOfRange: false,
                castForFree: true,
              });
              resolve();
            });
          }));
        }
        await Promise.all(promises);
        promises = [];
      })

      canMove = false;
    } else {
      if (attackTargets) {
        // Attack enemies in range
        const enemiesInRange = attackTargets.filter(u => u.alive && u.faction != unit.faction && math.distance(unit, u) <= unit.attackRange);
        if (enemiesInRange.length) {
          unit.mana -= unit.manaCostToCast;

          let promises: Promise<void>[] = [];
          await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
            for (const enemy of enemiesInRange) {
              promises.push(new Promise((resolve) => {
                createVisualLobbingProjectile(
                  unit,
                  enemy,
                  'projectile/lobberProjectile',
                ).then(() => {
                  // Add projectile hit animation
                  Image.addOneOffAnimation(enemy, 'projectile/lobberProjectileHit');

                  // Inflict slow and suffocate
                  Unit.addModifier(enemy, slowCardId, underworld, false, 1);
                  if (!unit.modifiers[suffocateCardId]) {
                    Unit.addModifier(enemy, suffocateCardId, underworld, false, 1);
                  }

                  Unit.takeDamage({
                    unit: enemy,
                    amount: unit.damage,
                    sourceUnit: unit,
                    fromVec2: unit,
                  }, underworld, false);

                  resolve();
                })
              }))
            }
          });
          await Promise.all(promises);
        }

        // Allows a 2nd playComboAnimation() without significant await time
        Unit.returnToDefaultSprite(unit);

        // Prime Corpses
        const deadUnits = attackTargets.filter(u => !u.alive && u.unitType != UnitType.PLAYER_CONTROLLED);
        if (deadUnits.length >= 3) {
          unit.mana -= unit.manaCostToCast;

          canMove = false;
          let promises: Promise<void>[] = [];
          await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
            for (const deadUnit of deadUnits) {
              promises.push(new Promise((resolve) => {
                createVisualLobbingProjectile(
                  unit,
                  deadUnit,
                  'projectile/lobberProjectile',
                ).then(() => {
                  Unit.addModifier(deadUnit, corpsePrimedId, underworld, false, 1);
                  resolve();
                });
              }));
            }
          });
          await Promise.all(promises);
        }
      }
    }

    if (canMove) {
      // Goru can move after some actions
      // Movement: Walk towards nearest enemy, prioritizing players
      const nearestEnemy = Unit.closestInListOfUnits(unit, underworld.getRemainingPlayerUnits().filter(u => u.faction != unit.faction))
        || Unit.closestInListOfUnits(unit, Unit.livingUnitsInDifferentFaction(unit, underworld.units));
      if (nearestEnemy) {
        const distanceToTarget = math.distance(unit, nearestEnemy);
        if (distanceToTarget > unit.attackRange / 2) {
          // The following is a hacky way to make them not move too close to the enemy
          unit.stamina = Math.min(unit.stamina, distanceToTarget - unit.attackRange / 2);
          await Unit.moveTowards(unit, nearestEnemy, underworld);
        }
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    // Can either target living enemies, or any dead units
    const possibleTargets = underworld.getUnitsWithinDistanceOfTarget(unit, unit.attackRange, false)
      .filter(u => !u.flaggedForRemoval && (
        u.alive && u.faction != unit.faction
        || !u.alive
      ));

    if (possibleTargets.length) {
      return possibleTargets;
    } else {
      return [];
    }
  }
};

export default unit;
