import { AdjustmentFilter } from '@pixi/filter-adjustment';
import { allUnits, UnitSource } from './index';
import { Faction, UnitSubType, UnitType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import Underworld from '../../Underworld';
import * as config from '../../config';
import { makeCorruptionParticles } from '../../graphics/ParticleCollection';
import purify from '../../cards/purify';
import sacrifice from '../../cards/sacrifice';
import { calculateCost } from '../../cards/cardUtils';
import seedrandom from 'seedrandom';
import { makeManaTrail } from '../../graphics/Particles';
import { addPixiSpriteAnimated, containerUnits } from '../../graphics/PixiUtils';
import { findRandomGroundLocation } from './summoner';
import { pickups, PICKUP_SPIKES_NAME, RED_PORTAL, removePickup } from '../Pickup';
import { Vec2 } from '../../jmath/Vec';
import { skyBeam } from '../../VisualEffects';
import * as Pickup from '../Pickup';
import * as math from '../../jmath/math';
import { summoningSicknessId } from '../../modifierSummoningSickness';
import { BLOOD_GOLEM_ID } from './bloodGolem';
import { BLOOD_ARCHER_ID } from './blood_archer';

export const bossmasonUnitId = 'Bossmason';
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
          for (let i = 0; i < numberOfSummons; i++) {
            const coords = findRandomGroundLocation(underworld, unit, seed);
            if (coords) {
              lastPromise = makeManaTrail(unit, coords, underworld, '#930e0e', '#ff0000').then(() => {
                Pickup.create({ pos: coords, pickupSource: redPortalPickupSource }, underworld, false);
              });
            } else {
              console.log("Summoner could not find valid spawn");
            }
          }
          return lastPromise;
        };
        await Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false });
      } else {
        // Teleport to a red portal
        // and turn the rest into enemies
        let bossmasonTeleported = false;
        for (let portal of redPortals) {
          if (!bossmasonTeleported) {
            bossmasonTeleported = true;
            skyBeam(unit);
            unit.x = portal.x;
            unit.y = portal.y;
            removePickup(portal, underworld, false);
          } else {
            summonUnitAtPickup(portal, underworld);
          }
        }
      }
    } else {
      console.error('Could not find redPortalPickupSource');
    }

    // Purify self if cursed
    let cost = calculateCost([purify.card], {});
    if (cost.manaCost <= unit.mana && unit.modifiers && Object.values(unit.modifiers).some(m => m.isCurse)) {
      const keyMoment = () => underworld.castCards({}, unit, [purify.card.id], unit, false, false, magicColor);
      await Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false });
    }
    // Consume allies if hurt
    cost = calculateCost([sacrifice.card], {});
    if (cost.manaCost <= unit.mana && unit.health < unit.healthMax) {
      const closestUnit = Unit.findClosestUnitInSameFaction(unit, underworld);
      if (closestUnit) {
        const keyMoment = () => underworld.castCards({}, unit, [sacrifice.card.id], closestUnit, false, false, magicColor);
        await Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false });
      }
    }

    // const attackTarget = attackTargets && attackTargets[0];
    // // Attack
    // // TODO: Check mana cost
    // if (attackTarget && canAttackTarget) {
    //   Unit.orient(unit, attackTarget);
    //   const keyMoment = () => underworld.castCards({}, unit, [slash.slashCardId], attackTarget, false, false, magicColor);
    //   await Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false });
    // }
  },
  getUnitAttackTargets: (unit: Unit.IUnit, underworld: Underworld) => {
    // Should be always true, since bossmasons is always AI
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
function summonTrap(coords: Vec2, underworld: Underworld) {
  const trap = pickups.findIndex(p => p.name == PICKUP_SPIKES_NAME);
  if (trap !== -1) {
    return new Promise<void>((resolve) => {
      const animationSprite = addPixiSpriteAnimated('pickups/trapAttack', containerUnits, {
        loop: false,
        animationSpeed: -0.15,
        onComplete: () => {
          if (animationSprite?.parent) {
            animationSprite.parent.removeChild(animationSprite);
          }
          resolve();
        }
      });
      if (animationSprite) {
        // Play in reverse so it looks like it's unfolding
        animationSprite.gotoAndPlay(animationSprite.totalFrames - 1);
        animationSprite.anchor.set(0.5);
        animationSprite.x = coords.x;
        animationSprite.y = coords.y;
      }
      const animationSprite2 = addPixiSpriteAnimated('pickups/trapAttackMagic', containerUnits, {
        loop: false,
        animationSpeed: -0.15,
        onComplete: () => {
          if (animationSprite2?.parent) {
            animationSprite2.parent.removeChild(animationSprite2);
          }
          resolve();
        }
      });
      if (animationSprite2) {
        // Play in reverse so it looks like it's unfolding
        animationSprite2.gotoAndPlay(animationSprite2.totalFrames - 1);
      }
    }).then(() => {
      underworld.spawnPickup(trap, coords, false);
    })
  } else {
    console.error('Could not find trap pickup');
    return Promise.resolve();
  }
}
function summonUnitAtPickup(pickup: Pickup.IPickup, underworld: Underworld) {
  const enemyIsClose = underworld.units.filter(u => u.faction == Faction.ALLY).some(u => math.distance(pickup, u) <= config.PLAYER_BASE_ATTACK_RANGE)
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
      Faction.ENEMY,
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
