import { AdjustmentFilter } from '@pixi/filter-adjustment';
import type { UnitSource } from './index';
import { UnitSubType, UnitType } from '../../types/commonTypes';
import * as Unit from '../Unit';
import * as math from '../../jmath/math';
import Underworld from '../../Underworld';
import * as slash from '../../cards/slash';
import * as config from '../../config';
import { makeCorruptionParticles } from '../../graphics/ParticleCollection';
import purify from '../../cards/purify';
import consumeAlly from '../../cards/consume_ally';
import { calculateCost } from '../../cards/cardUtils';
import seedrandom from 'seedrandom';
import { makeManaTrail } from '../../graphics/Particles';
import { addPixiSpriteAnimated, containerUnits } from '../../graphics/PixiUtils';
import { findRandomGroundLocation } from './summoner';
import { pickups, PICKUP_SPIKES_NAME } from '../Pickup';
import { Vec2 } from '../../jmath/Vec';

export const bossmasonUnitId = 'Bossmason';
const bossmasonMana = 200;
const unit: UnitSource = {
  id: bossmasonUnitId,
  info: {
    description: 'A nexus of dark magic! Beware.',
    image: 'units/playerIdle',
    subtype: UnitSubType.RANGED_RADIUS,
  },
  unitProps: {
    attackRange: config.PLAYER_BASE_ATTACK_RANGE + 30,
    healthMax: 60,
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
    // Purify self if cursed

    let cost = calculateCost([purify.card], {});
    if (cost.manaCost <= unit.mana && unit.modifiers && Object.values(unit.modifiers).some(m => m.isCurse)) {
      const keyMoment = () => underworld.castCards({}, unit, [purify.card.id], unit, false, false);
      await Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false });
    }
    // Consume allies if hurt
    cost = calculateCost([consumeAlly.card], {});
    if (cost.manaCost <= unit.mana && unit.health < unit.healthMax) {
      const closestUnit = Unit.findClosestUnitInSameFaction(unit, underworld);
      if (closestUnit) {
        const keyMoment = () => underworld.castCards({}, unit, [consumeAlly.card.id], closestUnit, false, false);
        await Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false });
      }
    }
    // Summon Traps:
    const summonTrapsManaCost = 50;
    if (summonTrapsManaCost <= unit.mana) {
      unit.mana -= summonTrapsManaCost;

      const keyMoment = () => {
        let lastPromise = Promise.resolve();
        let numberOfSummons = 8;
        const seed = seedrandom(`${underworld.seed}-${underworld.turn_number}-${unit.id}`);
        for (let i = 0; i < numberOfSummons; i++) {
          const coords = findRandomGroundLocation(underworld, unit, seed);
          if (coords) {
            lastPromise = makeManaTrail(unit, coords, underworld, '#930e0e', '#ff0000').then(() => {
              return summonTrap(coords, underworld);
            });
          } else {
            console.log("Summoner could not find valid spawn");
          }
        }
        return lastPromise;
      };
      await Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false });
    }

    const attackTarget = attackTargets && attackTargets[0];
    // Attack
    // TODO: Check mana cost
    if (attackTarget && canAttackTarget) {
      Unit.orient(unit, attackTarget);
      const keyMoment = () => underworld.castCards({}, unit, [slash.slashCardId], attackTarget, false, false);
      await Unit.playComboAnimation(unit, 'playerAttackSmall', keyMoment, { animationSpeed: 0.2, loop: false });
    }
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
export default unit;
