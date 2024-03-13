import * as Unit from '../entity/Unit';
import * as color from '../graphics/ui/colors';
import * as particles from '@pixi/particle-emitter'
import { CardCategory } from '../types/commonTypes';
import type Underworld from '../Underworld';
import { oneOffImage, playDefaultSpellAnimation, playDefaultSpellSFX } from './cardUtils';
import { Spell, refundLastSpell } from './index';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { getOrInitModifier } from './util';
import { distance } from '../jmath/math';
import { addTrail, calculateMaxParticles, createParticleTexture, makeManaTrail } from '../graphics/Particles';
import { containerUnits, startBloodParticleSplatter } from '../graphics/PixiUtils';
import { Vec2 } from '../jmath/Vec';
import { addLerpable } from '../lerpList';
import { soulShardOwnerModifierId } from '../modifierSoulShardOwner';

export const soulShardId = 'Soul Shard';
const spell: Spell = {
  card: {
    id: soulShardId,
    category: CardCategory.Curses,
    sfx: 'sacrifice',
    supportQuantity: true,
    manaCost: 90,
    healthCost: 0,
    expenseScaling: 3,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconSoulShard.png',
    description: ['spell_soul_shard'],
    effect: async (state, card, quantity, underworld, prediction) => {
      // .filter: only target living units
      const targets = state.targetedUnits.filter(u => u.alive && u.faction == state.casterUnit.faction && u != state.casterUnit);
      if (targets.length) {
        playDefaultSpellSFX(card, prediction);
        unitTakeDamageFX(state.casterUnit, underworld, prediction);
        // VFX Trails
        if (!prediction) {
          let promises = [];
          for (let unit of targets) {
            promises.push(makeSoulShardVFX(state.casterUnit, unit, underworld));
          }
          await Promise.all(promises);
        }
        // Effect
        for (let unit of targets) {
          Unit.addModifier(unit, soulShardId, underworld, prediction, quantity, { shardOwnerId: state.casterUnit.id });
          unitTakeDamageFX(unit, underworld, prediction);
        }
      } else {
        refundLastSpell(state, prediction, "Must target an ally");
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
  },
  events: {
    onDamage: (unit, amount, underworld, prediction) => {
      // Redirect all damage to the modifier's source unit
      const modifier = unit.modifiers[soulShardId];
      if (modifier) {
        const shardOwner = getShardOwnerById(modifier.shardOwnerId, underworld, prediction);
        if (shardOwner) {
          // Prevents an infinite loop in the case of multiple
          // shard owners redirecting to eachother
          if (!modifier.hasRedirectedDamage) {
            modifier.hasRedirectedDamage = true;
            Unit.takeDamage(shardOwner, amount, undefined, underworld, prediction, undefined);
            modifier.hasRedirectedDamage = false;
            return 0;
          } else {
            //console.log("Breaking infinite Soul Shard loop: ", modifier.hasRedirectedDamage);
          }
        }
        modifier.hasRedirectedDamage = false;
      }
      return amount;
    }
  },
};

function add(unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1, extra?: any) {
  if (extra.shardOwnerId == undefined) {
    console.log("Cannot add soul shard modifier without a shard owner id");
    return;
  }

  const modifier = getOrInitModifier(unit, soulShardId, { isCurse: true, quantity }, () => {
    unit.onDamageEvents.push(soulShardId);
  });

  if (modifier.shardOwnerId != extra.shardOwnerId) {
    // If we're changing to a new shard owner, remove the modifier from the old one
    if (modifier.shardOwnerId != undefined) {
      removeShardOwner(modifier.shardOwnerId, underworld, prediction);
    }

    const newShardOwner = getShardOwnerById(extra.shardOwnerId, underworld, prediction);
    if (newShardOwner) {
      Unit.addModifier(newShardOwner, soulShardOwnerModifierId, underworld, prediction);
    }
  }

  modifier.shardOwnerId = extra.shardOwnerId;
  modifier.quantity = 1;
}
function remove(unit: Unit.IUnit, underworld: Underworld) {
  const soulShardModifier = unit.modifiers[soulShardId];
  if (soulShardModifier) {
    removeShardOwner(soulShardModifier.shardOwnerId, underworld, unit.isPrediction);
  }
}

function removeShardOwner(shardOwnerId: number, underworld: Underworld, prediction: boolean) {
  const shardOwner = getShardOwnerById(shardOwnerId, underworld, prediction);
  if (shardOwner) {
    const shardOwnerModifier = shardOwner.modifiers[soulShardOwnerModifierId];
    if (shardOwnerModifier) {
      shardOwnerModifier.quantity -= 1;
      if (shardOwnerModifier.quantity <= 0) {
        Unit.removeModifier(shardOwner, soulShardOwnerModifierId, underworld);
      }
    } else {
      console.error("Shard owner does not have the shard owner modifier. This should never happen\n", shardOwner);
    }
  } else {
    console.error("Shard owner with ID does not exist. This should never happen\n", shardOwnerId);
  }
}

function getShardOwnerById(id: number, underworld: Underworld, prediction: boolean): Unit.IUnit | undefined {
  const units = prediction ? underworld.unitsPrediction : underworld.units;
  return units.find(u => u.id == id);
}

export function getNearestShardBearer(unit: Unit.IUnit, underworld: Underworld, prediction: boolean): Unit.IUnit | undefined {
  // Find nearest unit with a matching Soul Shard
  const units = prediction ? underworld.unitsPrediction : underworld.units;

  return units.filter(u =>
    u.alive &&
    u.modifiers[soulShardId] &&
    u.modifiers[soulShardId].shardOwnerId == unit.id)
    .sort((a, b) => distance(a, unit) - distance(b, unit))[0];
}

function unitTakeDamageFX(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  if (prediction) return;

  playSFXKey(unit.sfx.damage);
  Unit.playAnimation(unit, unit.animations.hit, { loop: false, animationSpeed: 0.2 });
  //startBloodParticleSplatter(underworld, unit, unit, { maxRotationOffset: Math.PI / 16, numberOfParticles: 30 });
  // Use all_red shader to flash the unit to show they are taking damage
  if (unit.shaderUniforms.all_red) {
    unit.shaderUniforms.all_red.alpha = 1;
    addLerpable(unit.shaderUniforms.all_red, "alpha", 0, 200);
  }
}

function makeSoulShardVFX(start: Vec2, target: Vec2, underworld: Underworld, totalNumberOfTrails?: number): Promise<void> {
  const texture = createParticleTexture();
  if (!texture) {
    return Promise.resolve();
  }
  const { maxParticles, ratioToDefault } = calculateMaxParticles(90, totalNumberOfTrails);
  return addTrail(
    start,
    target,
    underworld,
    particles.upgradeConfig({
      autoUpdate: true,
      alpha: {
        start: 1,
        end: 0
      },
      scale: {
        start: 1,
        end: 0.2,
        minimumScaleMultiplier: 1
      },
      color: {
        start: color.convertToHashColor(color.healthDarkRed),
        end: color.convertToHashColor(color.healthDarkRed)
      },
      speed: {
        start: 0,
        end: 0,
        minimumSpeedMultiplier: 1
      },
      acceleration: {
        x: 0,
        y: 0
      },
      maxSpeed: 0,
      startRotation: {
        min: 0,
        max: 360
      },
      noRotation: true,
      rotationSpeed: {
        min: 0,
        max: 0
      },
      lifetime: {
        min: 0.4 * ratioToDefault,
        max: 0.4 * ratioToDefault
      },
      blendMode: "normal",
      frequency: 0.011,
      emitterLifetime: -1,
      maxParticles,
      pos: {
        x: 0,
        y: 0
      },
      addAtBack: false,
      spawnType: "point"
    }, [texture]));
}

export default spell;