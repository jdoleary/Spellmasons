import { AdjustmentFilter } from '@pixi/filter-adjustment';
import { allUnits, UnitSource } from './index';
import { Faction, UnitSubType, UnitType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import Underworld from '../../Underworld';
import * as config from '../../config';
import { makeCorruptionParticles } from '../../graphics/ParticleCollection';
import purify from '../../cards/purify';
import sacrifice from '../../cards/sacrifice';
import slash from '../../cards/slash';
import { calculateCost } from '../../cards/cardUtils';
import seedrandom from 'seedrandom';
import { makeManaTrail } from '../../graphics/Particles';
import { findRandomGroundLocation } from './summoner';
import { pickups, RED_PORTAL, removePickup } from '../Pickup';
import { skyBeam } from '../../VisualEffects';
import * as Pickup from '../Pickup';
import * as math from '../../jmath/math';
import * as Vec from '../../jmath/Vec';
import { summoningSicknessId } from '../../modifierSummoningSickness';
import { BLOOD_GOLEM_ID } from './bloodGolem';
import { BLOOD_ARCHER_ID } from './blood_archer';
import { tryFallInOutOfLiquid } from '../Obstacle';

export const bossmasonUnitId = 'Deathmason';
const NUMBER_OF_ATTACK_TARGETS = 8;
const bossmasonMana = 200;
const magicColor = 0x321d73;
const unit: UnitSource = {
  id: bossmasonUnitId,
  info: {
    description: 'A nexus of dark magic! Beware.',
    image: 'units/playerIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: config.PLAYER_BASE_ATTACK_RANGE * 3,
    healthMax: 600,
    manaMax: bossmasonMana,
    manaPerTurn: bossmasonMana
  },
  init: (unit: Unit.IUnit, underworld: Underworld) => {
    if (unit.image) {

      const adjustmentFilter = new AdjustmentFilter({
        saturation: 0.4,
        contrast: 5,
        brightness: 0.2
      });
      if (!unit.image.sprite.filters) {
        unit.image.sprite.filters = [];
      }
      unit.image.sprite.filters.push(adjustmentFilter);
      makeCorruptionParticles(unit, false, underworld);
    }
  },
  // This is how a user unit would act if controlled by AI (this can happen if you clone yourself)
  action: async (unit: Unit.IUnit, attackTargets: Unit.IUnit[] | undefined, underworld: Underworld, canAttackTarget: boolean) => {
    // Attack or move, not both; so clear their existing path
    unit.path = undefined;

    const seed = seedrandom(`${underworld.seed}-${underworld.turn_number}-${unit.id}`);

    const redPortals = underworld.pickups.filter(p => p.name == RED_PORTAL);
    const redPortalPickupSource = pickups.find(p => p.name == RED_PORTAL);
    if (redPortalPickupSource) {
      if (redPortals.length == 0) {
        // Spawn new red portals
        let numberOfSummons = 8;
        const keyMoment = () => {
          let lastPromise = Promise.resolve();
          const portalCoords = [];
          for (let i = 0; i < numberOfSummons; i++) {
            const coords = findRandomGroundLocation(underworld, unit, seed);
            if (coords) {
              portalCoords.push(coords);
            } else {
              console.log("Summoner could not find valid spawn");
            }
          }
          for (let coord of portalCoords) {
            // Prevent red portals from spawning too close to each other which could cause
            // the player to teleport through more than one
            if (portalCoords.some(p => {
              // Don't compare with self
              if (p == coord) {
                return false;
              }
              const dist = math.distance(p, coord);
              // + 10 is just extra margin to be sure
              return dist <= config.COLLISION_MESH_RADIUS + 10;
            })) {
              // Don't allow spawning 2 red portals on top of each other
              continue;
            }
            // Spawn the portals
            lastPromise = makeManaTrail(unit, coord, underworld, '#930e0e', '#ff0000').then(() => {
              Pickup.create({ pos: coord, pickupSource: redPortalPickupSource }, underworld, false);
            });

          }
          return lastPromise;
        };
        await Unit.playComboAnimation(unit, 'playerAttackMedium0', keyMoment, { animationSpeed: 0.2, loop: false });

        // After spawning portals the bossmason can purify or heal
        const purifyCost = calculateCost([purify.card], {});
        const sacrificeCost = calculateCost([sacrifice.card], {});
        // Purify self if cursed
        if (purifyCost.manaCost <= unit.mana && unit.modifiers && Object.values(unit.modifiers).some(m => m.isCurse)) {
          const keyMoment = () => underworld.castCards({
            casterCardUsage: {},
            casterUnit: unit,
            casterPositionAtTimeOfCast: Vec.clone(unit),
            cardIds: [purify.card.id],
            castLocation: unit,
            prediction: false,
            outOfRange: false,
            magicColor
          });
          await Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false });
        } else if (sacrificeCost.manaCost <= unit.mana && unit.health < unit.healthMax) {
          // Consume allies if hurt
          // Note: Do not allow Deathmason to siphon allied player units
          const closestUnit = Unit.livingUnitsInSameFaction(unit, underworld).filter(u => u.unitType !== UnitType.PLAYER_CONTROLLED && Unit.inRange(unit, u))[0]
          if (closestUnit) {
            const keyMoment = () => underworld.castCards({
              casterCardUsage: {},
              casterUnit: unit,
              casterPositionAtTimeOfCast: Vec.clone(unit),
              cardIds: [sacrifice.card.id],
              castLocation: closestUnit,
              prediction: false,
              outOfRange: false,
              magicColor
            });
            await Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false });
          }
        }
      } else {
        const attackTarget = attackTargets && attackTargets[0];
        // Attack
        const slashCost = calculateCost([slash.card, slash.card, slash.card], {});
        if (slashCost.manaCost <= unit.mana && attackTarget && canAttackTarget) {
          const keyMoment = () => {
            let lastPromise = Promise.resolve();
            for (let target of attackTargets) {
              lastPromise = underworld.castCards({
                casterCardUsage: {},
                casterUnit: unit,
                casterPositionAtTimeOfCast: Vec.clone(unit),
                cardIds: [slash.card.id, slash.card.id, slash.card.id],
                castLocation: target,
                prediction: false,
                outOfRange: false,
                magicColor
              })
                // .then() removes <EffectState> from the return type
                .then(() => { });
            }
            return lastPromise;
          }
          await Unit.playComboAnimation(unit, 'playerAttackEpic', keyMoment, { animationSpeed: 0.2, loop: false });
        }
        // Teleport to a red portal
        // and turn the rest into enemies
        let bossmasonTeleported = false;
        for (let portal of redPortals) {
          if (!bossmasonTeleported) {
            bossmasonTeleported = true;
            skyBeam(unit);
            unit.x = portal.x;
            unit.y = portal.y;
            tryFallInOutOfLiquid(unit, underworld, false);
            removePickup(portal, underworld, false);
          } else {
            summonUnitAtPickup(unit, portal, underworld);
          }
        }
      }
    } else {
      console.error('Could not find redPortalPickupSource');
    }


  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    // Should be always true, since bossmasons is always AI
    if (unit.unitType == UnitType.AI) {
      return Unit.livingUnitsInDifferentFaction(unit, underworld)
        .filter(u => math.distance(unit, u) <= unit.attackRange)
        .map(u => ({ unit: u, dist: math.distance(unit, u) }))
        .sort((a, b) => {
          return a.dist - b.dist;
        })
        .map(x => x.unit)
        .slice(0, NUMBER_OF_ATTACK_TARGETS);
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
function summonUnitAtPickup(summoner: Unit.IUnit, pickup: Pickup.IPickup, underworld: Underworld) {
  const enemyIsClose = underworld.units.filter(u => u.faction != summoner.faction).some(u => math.distance(pickup, u) <= config.PLAYER_BASE_ATTACK_RANGE)
  let sourceUnit = allUnits[BLOOD_ARCHER_ID];
  if (enemyIsClose) {
    sourceUnit = allUnits[BLOOD_GOLEM_ID];
  }

  if (sourceUnit) {
    const summonedUnit = Unit.create(
      sourceUnit.id,
      // Start the unit at the summoners location
      pickup.x,
      pickup.y,
      // A unit always summons units in their own faction
      summoner.faction,
      sourceUnit.info.image,
      UnitType.AI,
      sourceUnit.info.subtype,
      sourceUnit.unitProps,
      underworld
    );
    // Add summoning sickeness so they can't act after they are summoned
    Unit.addModifier(summonedUnit, summoningSicknessId, underworld, false);
    removePickup(pickup, underworld, false);
  } else {
    console.error('Source unit not found in summonUnitAtPickup', enemyIsClose)
  }

}
export default unit;
