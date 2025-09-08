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
import { chooseOneOfSeeded, getUniqueSeedString, shuffle } from '../../jmath/rand';
import { oneOffImage } from '../../cards/cardUtils';
import { containerUnits } from '../../graphics/PixiUtils';
import { BLOOD_GOLEM_ID } from './bloodGolem';
import { BLOOD_ARCHER_ID } from './blood_archer';
import { IPlayer } from '../Player';
import floatingText from '../../graphics/FloatingText';
import { test_ignorePromiseSpy } from '../../promiseSpy';
import { MESSAGE_TYPES } from '../../types/MessageTypes';

const projectileColorReplace: { colors: [number, number][]; epsilon: number } = {
  colors: [[0x899da2, 0xffffff], [0x758d92, 0xf1f1f1]],
  epsilon: 0.2
};
export const GORU_UNIT_ID = 'Goru';
export const GORU_DEFAULT_IMAGE_PATH = 'guruIdle';
export const GORU_ATTACK_IMAGE_PATH = 'guruAttack';
const unit: UnitSource = {
  id: GORU_UNIT_ID,
  info: {
    description: 'goru description',
    image: GORU_DEFAULT_IMAGE_PATH,
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
    idle: GORU_DEFAULT_IMAGE_PATH,
    hit: 'guruHit',
    attack: GORU_ATTACK_IMAGE_PATH,
    die: 'guruDeath',
    walk: 'guruIdle',
  },
  sfx: {
    damage: 'goruHurt',
    death: 'goruDeath'
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    // Using originalLife might prevent Undying getting re-added by cloning/splitting/creating a Goru with no undying modifier,
    //  but also prevents summoned Goru's from getting undying.
    if (unit.originalLife && !unit.modifiers[undyingModifierId]) {
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
      // u.faction === unit.faction: to keep competing gorus from using each other's primed corpses, when a corpse is primed
      // it will be converted to the gorus faction so they don't use each others if there is an ally and enemy goru.
      const primedCorpses = underworld.units.filter(u => u.modifiers[primedCorpseId] && u.faction === unit.faction)
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
            const enemyUnits = Unit.livingUnitsInDifferentFaction(unit, underworld.units)
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
                  'lobberProjectile',
                  { colorReplace: projectileColorReplace, loop: true }
                ).then(() => {
                  // Add projectile hit animation
                  Image.addOneOffAnimation(target, 'lobberProjectileHit');

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
                  'lobberProjectile',
                  { colorReplace: projectileColorReplace, loop: true }
                ).then(() => {
                  // Add projectile hit animation
                  Image.addOneOffAnimation(target, 'lobberProjectileHit');

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
        // Not already primed
        && !u.modifiers[primedCorpseId]
        // Only resurrect players if they are on the same faction as Goru
        && (u.unitType != UnitType.PLAYER_CONTROLLED || u.faction === unit.faction)
        && math.distance(unit, u) <= unit.attackRange
        // Exclude unacting units such as decoys
        && (u.damage > 0 || u.staminaMax > 0));
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
                'lobberProjectile',
                { colorReplace: projectileColorReplace, loop: true }
              ).then(() => {
                // Add projectile hit animation
                Image.addOneOffAnimation(target, 'lobberProjectileHit');

                Unit.addModifier(target, primedCorpseId, underworld, false, 1);
                // When a corpse is primed, change their faction so that Gorus of differing
                // factions won't use each other's primed corpses
                target.faction = unit.faction;
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
                'lobberProjectile',
                { colorReplace: projectileColorReplace, loop: true }
              ).then(() => {
                // Add projectile hit animation
                Image.addOneOffAnimation(target, 'lobberProjectileHit');

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
        const validSpawnCoords = underworld.findValidSpawns({ spawnSource: unit, ringLimit: 10, prediction: false, radius: config.spawnSize }, { allowLiquid: false });
        const chosenCoords = shuffle(validSpawnCoords, seed).slice(0, numberOfSummons);
        for (let i = 0; i < numberOfSummons; i++) {
          const coords = chosenCoords[i];
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
                'lobberProjectile',
                { colorReplace: projectileColorReplace, loop: true }
              ).then(() => {
                // Add projectile hit animation
                Image.addOneOffAnimation(target, 'lobberProjectileHit');

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

export function tryCollectSoul(player: IPlayer, u: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  // tryCollectSoul must only be invoked on...
  if (
    !(
      !prediction
      // ...self player (so that the soul collection can be networked)
      && player == globalThis.player
      // ...player of wizardType Goru
      && player.wizardType === 'Goru'
      // ...not own unit (can't collect own souls)
      && u !== player.unit
      // ...dead target units
      && !u.alive
      // ...who have souls
      && u.soulFragments > 0
      && !u.soulsBeingCollected
    )
  ) {
    return;
  }
  if (exists(player.unit.soulLeftToCollect) && player.unit.soulLeftToCollect <= 0) {
    return;
  }
  const distanceFromCorpse = math.distance(u, player.unit);
  if (globalThis.player == player && player.unit.alive && player.isSpawned && distanceFromCorpse <= config.GORU_SOUL_COLLECT_RADIUS) {
    // Prevent multiple gorus from collecting souls from the same corpse at the same time
    const goruPlayers = underworld.players.filter(p => p.wizardType == 'Goru');
    if (goruPlayers.length > 1) {
      const closestGoru = goruPlayers.reduce((closest, current) => {
        const curDistanceFromCorpse = math.distance(u, current.unit);
        if (curDistanceFromCorpse < closest.dist) {
          return { player: current, dist: curDistanceFromCorpse };
        }
        return closest;
      }, { player: globalThis.player, dist: distanceFromCorpse }).player;
      // Only collect if current player is closer than other gorus
      if (closestGoru != globalThis.player) {
        return;
      }
    }
    u.soulsBeingCollected = true;
    underworld.pie.sendData({
      type: MESSAGE_TYPES.COLLECT_SOULS,
      victim_unit_id: u.id,
      soulFragments: u.soulFragments,
    });
  }
}
export function tryCollectSouls(player: IPlayer, underworld: Underworld, prediction: boolean) {
  underworld.units.forEach(u => {
    tryCollectSoul(player, u, underworld, prediction);
  });

}
export function getSoulDebtHealthCost(player: IPlayer | undefined, prediction: boolean): number {
  if (!player) {
    return 0;
  }
  const unit = prediction ? player.unit.predictionCopy : player.unit;
  if (!unit) {
    console.error('getSoulDebtHealthCost: unexpected, player missing unit ref');
    return 0;
  }
  // triggerSoulDebt must only be invoked on...
  if (
    !(
      // ...player of wizardType Goru
      player.wizardType === 'Goru'
      // ... player is in soul debt
      && unit.soulFragments < 0
    )
  ) {
    return 0;
  }
  if (unit.soulFragments < 0) {
    return Math.round(Math.abs(unit.soulFragments) * config.GORU_SOUL_DEBT_PROPORTION_HEALTH_COST * unit.healthMax);
  }
  return 0;

}