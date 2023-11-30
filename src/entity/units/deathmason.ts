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
const portalCastCost = 150;
const unit: UnitSource = {
  id: bossmasonUnitId,
  info: {
    description: 'deathmason description',
    image: 'units/playerIdle',
    subtype: UnitSubType.SUPPORT_CLASS,
  },
  unitProps: {
    damage: 0,
    attackRange: config.PLAYER_BASE_ATTACK_RANGE * 3,
    healthMax: 600,
    manaMax: bossmasonMana,
    manaPerTurn: 100
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

    const portalName = unit.faction == Faction.ENEMY ? RED_PORTAL : Pickup.BLUE_PORTAL;
    const deathmasonPortals = underworld.pickups.filter(p => p.name == portalName);
    const deathmasonPortalPickupSource = pickups.find(p => p.name == portalName);
    if (deathmasonPortalPickupSource) {
      if (deathmasonPortals.length == 0 && unit.mana >= portalCastCost) {
        unit.mana -= portalCastCost;
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
            lastPromise = makeManaTrail(unit, coord, underworld, unit.faction == Faction.ENEMY ? '#930e0e' : '#0e0e93', '#ff0000').then(() => {
              const portal = Pickup.create({ pos: coord, pickupSource: deathmasonPortalPickupSource, logSource: 'deathmason' }, underworld, false);
              // @ts-ignore, this flag is necessary to distinguish portals that will spawn units from those that just teleport you
              // It is not a part of the IPickup interface and therefore needs ts-ignore
              portal.doesSpawn = true;
            });

          }
          return lastPromise;
        };
        await Unit.playComboAnimation(unit, 'playerAttackMedium0', keyMoment, { animationSpeed: 0.2, loop: false });

        // After spawning portals the bossmason can heal
        const sacrificeCost = calculateCost([sacrifice.card], {});
        if (sacrificeCost.manaCost <= unit.mana && unit.health < unit.healthMax) {
          unit.mana -= sacrificeCost.manaCost;
          // Consume allies if hurt
          // Note: Do not allow Deathmason to siphon allied player units
          const closestUnit = Unit.livingUnitsInSameFaction(unit, underworld).filter(u => u.unitType !== UnitType.PLAYER_CONTROLLED && u.unitSourceId !== bossmasonUnitId && Unit.inRange(unit, u))[0]
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
      }
    } else {
      console.error('Could not find redPortalPickupSource');
    }


  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    // Should be always true, since bossmasons is always AI
    if (unit.unitType == UnitType.AI) {
      const portalName = unit.faction == Faction.ENEMY ? RED_PORTAL : Pickup.BLUE_PORTAL;
      const deathmasonPortals = underworld.pickups.filter(p => p.name == portalName);
      return unit.mana >= portalCastCost && deathmasonPortals.length == 0 ? [unit] : [];
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
export function summonUnitAtPickup(faction: Faction, pickup: Pickup.IPickup, underworld: Underworld) {
  const enemyIsClose = underworld.units.filter(u => u.faction != faction).some(u => math.distance(pickup, u) <= config.PLAYER_BASE_ATTACK_RANGE)
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
      faction,
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
