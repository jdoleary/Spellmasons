import * as Unit from '../Unit';
import { allUnits, type UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import { createVisualLobbingProjectile } from '../Projectile';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import { bloodLobber } from '../../graphics/ui/colors';
import * as config from '../../config';
import * as Image from '../../graphics/Image';
import * as colors from '../../graphics/ui/colors';
import { undyingModifierId } from '../../modifierUndying';
import { resurrect_id } from '../../cards/resurrect';
import { primedCorpseId } from '../../modifierPrimedCorpse';
import { boneShrapnelCardId, boneShrapnelRadius } from '../../cards/bone_shrapnel';
import { makeManaTrail } from '../../graphics/Particles';
import seedrandom from 'seedrandom';
import { Vec2 } from '../../jmath/Vec';
import { summoningSicknessId } from '../../modifierSummoningSickness';
import { chooseOneOfSeeded, getUniqueSeedString } from '../../jmath/rand';
import { oneOffImage } from '../../cards/cardUtils';
import { containerUnits } from '../../graphics/PixiUtils';
import { BLOOD_GOLEM_ID } from './bloodGolem';
import { BLOOD_ARCHER_ID } from './blood_archer';

const projectileColorReplace: { colors: [number, number][]; epsilon: number } = {
  colors: [[0x899da2, 0xffffff], [0x758d92, 0xf1f1f1]],
  epsilon: 0.2
};
export const GORU_UNIT_ID = 'Goru';
const unit: UnitSource = {
  id: GORU_UNIT_ID,
  info: {
    description: 'goru description',
    image: 'guruIdle',
    subtype: UnitSubType.GORU_BOSS,
  },
  unitProps: {
    damage: 30,
    attackRange: 400,
    healthMax: 400,
    staminaMax: 300,
    mana: 100,
    manaMax: 100,
    manaPerTurn: 60,
    manaCostToCast: 40,
    bloodColor: bloodLobber,
  },
  spawnParams: {
    // Special case: We spawn the Goru manually, but still want to declare a budget
    probability: 0,
    budgetCost: 40,
    unavailableUntilLevelIndex: 9,
  },
  animations: {
    idle: 'guruIdle',
    hit: 'guruHit',
    attack: 'guruAttack',
    die: 'guruDeath',
    walk: 'guruIdle',
  },
  sfx: {
    damage: 'goruHurt',
    death: 'goruDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    // TODO - Bug: Undying can be re-added by cloning/splitting/creating a Goru with no undying modifier
    // Using originalLife might prevent this, but also prevents summoned Goru's from getting undying.
    if (!unit.modifiers[undyingModifierId]) {
      Unit.addModifier(unit, undyingModifierId, underworld, false, 1);
    }
  },
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    // Goru has 2 "action points" and 5 actions to choose from
    // Actions are prioritized as follows:
    // - 2AP - Consume/Explode/Resurrect primed corpses
    // - 2AP - Prime corpses (minimum 3)
    // - 1AP - Attack enemies
    // - 1AP - Summon allies
    // - 1AP - Move
    let actionPoints = 2;

    // - Action -
    // Consume/Explode/Resurrect primed corpses
    if (actionPoints >= 2 && unit.mana >= unit.manaCostToCast) {
      const primedCorpses = underworld.units.filter(u => u.modifiers[primedCorpseId])
      if (primedCorpses.length) {
        Unit.returnToDefaultSprite(unit);
        // Triggering corpse effects should feel like a high impact action
        // and there are a lot of things happening at once for the player
        // so we want the Goru to focus on it and not move after
        actionPoints -= 2;
        unit.mana -= unit.manaCostToCast;

        // Consume if close
        // Explode if far and near enemy
        // Resurrect if far and not near enemy
        const corpsesToConsume: Unit.IUnit[] = [];
        const corpsesToExplode: Unit.IUnit[] = [];
        const corpsesToResurrect: Unit.IUnit[] = [];
        for (const target of primedCorpses) {
          if (target.unitType === UnitType.PLAYER_CONTROLLED) {
            // If Goru primes an ally player, resurrect them
            corpsesToResurrect.push(target);
          } else if (math.distance(unit, target) < boneShrapnelRadius) {
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
        if (corpsesToConsume.length) {
          for (const target of corpsesToConsume) {
            // Consume target
            // Adds red overlay effect on target as they get consumed
            promises.push(new Promise<void>(resolve => oneOffImage(target, 'summonerMagic', containerUnits, () => {
              // Trail copied from sacrifice.ts
              makeManaTrail(target, unit, underworld, '#ff6767n', '#ff0000', corpsesToConsume.length * 4)
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
                  unit.staminaMax += 10;
                  unit.manaMax += 10;
                  // TODO - Doesn't scale bone shrapnel damage. Should it?
                  unit.damage += 10;
                  unit.attackRange += 10;
                  unit.strength += 1;

                  // Remove Corpse
                  Unit.cleanup(target);
                  resolve();
                })
            })));
          }
          await Promise.all(promises);
          promises = [];
          Unit.returnToDefaultSprite(unit);
          // Fixes Goru sprite size after consuming
          Image.setScaleFromModifiers(unit.image, unit.strength);
          // TODO - Red VFX Doesn't scale with Goru sprite size
          // Adds red overlay effect to Goru
          await new Promise<void>(resolve => oneOffImage(unit, 'summonerMagic', containerUnits, resolve));
        }

        if (corpsesToExplode.length) {
          await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
            for (const target of corpsesToExplode) {
              // Explode Target
              promises.push(new Promise((resolve) => {
                createVisualLobbingProjectile(
                  unit,
                  target,
                  'projectile/lobberProjectile',
                  { colorReplace: projectileColorReplace, loop: true }
                ).then(() => {
                  // Add projectile hit animation
                  Image.addOneOffAnimation(target, 'projectile/lobberProjectileHit');

                  // Bone Shrapnel
                  underworld.castCards({
                    casterCardUsage: {},
                    casterUnit: unit,
                    casterPositionAtTimeOfCast: unit,
                    cardIds: [boneShrapnelCardId],
                    castLocation: target,
                    initialTargetedUnitId: target.id,
                    prediction: false,
                    outOfRange: false,
                    castForFree: true,
                  });
                  resolve();
                });
              }));
            }
          });
          await Promise.all(promises);
          promises = [];
          Unit.returnToDefaultSprite(unit);
        }

        if (corpsesToResurrect.length) {
          await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
            for (const target of corpsesToResurrect) {
              // Resurrect Target
              promises.push(new Promise((resolve) => {
                createVisualLobbingProjectile(
                  unit,
                  target,
                  'projectile/lobberProjectile',
                  { colorReplace: projectileColorReplace, loop: true }
                ).then(() => {
                  // Add projectile hit animation
                  Image.addOneOffAnimation(target, 'projectile/lobberProjectileHit');

                  // Resurrect
                  underworld.castCards({
                    casterCardUsage: {},
                    casterUnit: unit,
                    casterPositionAtTimeOfCast: unit,
                    cardIds: [resurrect_id],
                    castLocation: target,
                    initialTargetedUnitId: target.id,
                    prediction: false,
                    outOfRange: false,
                    castForFree: true,
                  });
                  resolve();
                });
              }));
            }
          });
          await Promise.all(promises);
          promises = [];
          Unit.returnToDefaultSprite(unit);
        }
      }
    }

    // - Action -
    // Prime corpses in range to trigger them next turn
    if (actionPoints >= 2 && unit.mana >= unit.manaCostToCast) {
      const deadUnits = underworld.units.filter(u =>
        !u.alive
        // Only resurrect players if they are on the same faction as Goru
        && (u.unitType != UnitType.PLAYER_CONTROLLED || u.faction === unit.faction)
        && math.distance(unit, u) <= unit.attackRange);
      if (deadUnits.length >= 3) {
        // The corpse priming should feel like a "wind up" / channeled ability,
        // so we want the Goru to focus on it and not move after
        actionPoints -= 2;
        unit.mana -= unit.manaCostToCast;

        let promises: Promise<void>[] = [];
        await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
          for (const target of deadUnits) {
            promises.push(new Promise((resolve) => {
              createVisualLobbingProjectile(
                unit,
                target,
                'projectile/lobberProjectile',
                { colorReplace: projectileColorReplace, loop: true }
              ).then(() => {
                // Add projectile hit animation
                Image.addOneOffAnimation(target, 'projectile/lobberProjectileHit');

                Unit.addModifier(target, primedCorpseId, underworld, false, 1);
                resolve();
              });
            }));
          }
        });
        await Promise.all(promises);
        promises = [];
        Unit.returnToDefaultSprite(unit);
      }
    }

    // - Action -
    // Attack nearby enemies
    if (actionPoints >= 1 && unit.mana >= unit.manaCostToCast) {
      const enemiesInRange = underworld.units.filter(u => u.alive && u.faction != unit.faction && u.unitSubType != UnitSubType.DOODAD && math.distance(unit, u) <= unit.attackRange);
      if (enemiesInRange.length) {
        Unit.returnToDefaultSprite(unit);
        actionPoints -= 1;
        unit.mana -= unit.manaCostToCast;

        let promises: Promise<void>[] = [];
        await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
          for (const target of enemiesInRange) {
            promises.push(new Promise((resolve) => {
              createVisualLobbingProjectile(
                unit,
                target,
                'projectile/lobberProjectile',
                { colorReplace: projectileColorReplace, loop: true }
              ).then(() => {
                // Add projectile hit animation
                Image.addOneOffAnimation(target, 'projectile/lobberProjectileHit');

                Unit.takeDamage({
                  unit: target,
                  amount: unit.damage,
                  sourceUnit: unit,
                  fromVec2: unit,
                }, underworld, false);
                resolve();
              });
            }));
          }
        });
        await Promise.all(promises);
        promises = [];
        Unit.returnToDefaultSprite(unit);
      }
    }

    // - Action - 
    // Summon units if I have few allies, or less allies than enemies
    if (actionPoints >= 1 && unit.mana >= unit.manaCostToCast) {
      const numberOfAllies = underworld.units.filter(u => u.alive && u.faction == unit.faction && u.unitSubType != UnitSubType.DOODAD).length;
      const numberOfEnemies = underworld.units.filter(u => u.alive && u.faction != unit.faction && u.unitSubType != UnitSubType.DOODAD).length;
      if (numberOfAllies < 6 || numberOfAllies < numberOfEnemies) {
        actionPoints -= 1;
        unit.mana -= unit.manaCostToCast;

        const numberOfSummons = 4;
        const summonTypes = [allUnits[BLOOD_GOLEM_ID], allUnits[BLOOD_ARCHER_ID]];
        const summons: { coords: Vec2, sourceUnit: UnitSource }[] = [];
        const seed = seedrandom(`${getUniqueSeedString(underworld)}-${unit.id}`);
        for (let i = 0; i < numberOfSummons; i++) {
          const coords = underworld.findValidSpawnInRadius(unit, false, seed, { maxRadius: unit.attackRange, unobstructedPoint: unit });
          if (coords) {
            const sourceUnit = chooseOneOfSeeded(summonTypes, seed);
            if (sourceUnit) {
              summons.push({ coords, sourceUnit })
            } else {
              console.error("Grou failed to summon: sourceUnit undefined", summonTypes);
            }
          } else {
            console.error("Grou could not find valid spawn for summon");
          }
        }

        let promises: Promise<void>[] = [];
        await Unit.playComboAnimation(unit, unit.animations.attack, async () => {
          for (const target of summons) {
            promises.push(new Promise((resolve) => {
              createVisualLobbingProjectile(
                unit,
                target.coords,
                'projectile/lobberProjectile',
                { colorReplace: projectileColorReplace, loop: true }
              ).then(() => {
                // Add projectile hit animation
                Image.addOneOffAnimation(target, 'projectile/lobberProjectileHit');

                const summonedUnit = Unit.create(
                  target.sourceUnit.id,
                  // Start the unit at the summoners location
                  target.coords.x,
                  target.coords.y,
                  // A unit always summons units in their own faction
                  unit.faction,
                  target.sourceUnit.info.image,
                  UnitType.AI,
                  target.sourceUnit.info.subtype,
                  target.sourceUnit.unitProps,
                  underworld
                );
                // Add summoning sickeness so they can't act after they are summoned
                Unit.addModifier(summonedUnit, summoningSicknessId, underworld, false);
                // Adds red summon effect
                promises.push(new Promise<void>(resolve => oneOffImage(target.coords, 'summonerMagic', containerUnits, resolve)));
                resolve();
              });
            }));
          }
        });
        await Promise.all(promises);
        promises = [];
        Unit.returnToDefaultSprite(unit);
      }
    }

    // TODO - https://github.com/jdoleary/Spellmasons/issues/663
    // This should say (actionPoints >= 1), to allow the Goru movement after attacking/summoning
    // Using (actionPoints >= 2) ensures the Goru never moves after taking an action,
    // which prevents the above issue from happening
    if (actionPoints >= 2) {
      // Goru can move after some actions
      // Movement: Walk towards nearest enemy, prioritizing players
      const nearestEnemy = Unit.closestInListOfUnits(unit, underworld.getRemainingPlayerUnits().filter(u => u.faction != unit.faction))
        || Unit.closestInListOfUnits(unit, Unit.livingUnitsInDifferentFaction(unit, underworld.units));
      if (nearestEnemy) {
        const distanceToTarget = math.distance(unit, nearestEnemy);
        if (distanceToTarget > 120) {
          // The following is a hacky way to make them not move too close to the enemy
          unit.stamina = Math.min(unit.stamina, distanceToTarget - 120);
          await Unit.moveTowards(unit, nearestEnemy, underworld);
        }
      }
    }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    // TODO - Improve attention marker and smart filter? See: underworld.getSmartTargets()
    // If the goru has mana, he will usually take an action
    if (unit.mana >= unit.manaCostToCast) {
      return [unit];
    }
    return [];
  }
}
export default unit;
