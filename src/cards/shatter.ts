import * as particles from '@pixi/particle-emitter'
import * as Unit from '../entity/Unit';
import { Spell, refundLastSpell } from './index';
import { CardCategory } from '../types/commonTypes';
import { createParticleTexture, logNoTextureWarning, simpleEmitter } from '../graphics/Particles';
import { Vec2 } from '../jmath/Vec';
import * as colors from '../graphics/ui/colors';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { freezeCardId } from './freeze';
import { baseExplosionRadius, explode } from '../effects/explode';
import { boneShrapnelParticleConfig } from './bone_shrapnel';

export const shatterCardId = 'Shatter';
const damage = 40;
const baseRadius = 100;

const spell: Spell = {
  card: {
    id: shatterCardId,
    requires: [freezeCardId],
    category: CardCategory.Damage,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: probabilityMap[CardRarity.UNCOMMON],
    thumbnail: 'spellIconShatter.png',
    description: `Shatters the ice surrounding a frozen unit, dealing ${damage} damage to it and all units nearby. Stackable to increase damage. Radius increases with freeze stacks.`,
    effect: async (state, card, quantity, underworld, prediction) => {
      // Only target frozen units
      const targetedUnits = state.targetedUnits.filter(u => u.modifiers[freezeCardId]);
      if (targetedUnits.length == 0) {
        refundLastSpell(state, prediction, "Target a frozen unit!");
        return state;
      }

      // We can't use a simple for-loop here, because one explosion may cause
      // another unit to die and thus lose their freeze modifier before they shatter.
      // Instead, we'll cache an array of locations and radii
      // to create the explosions in a second for-loop
      let explosions: { location: Vec2, radius: number }[] = [];
      for (let unit of targetedUnits) {
        const freezeMod = unit.modifiers[freezeCardId];
        if (freezeMod) {
          // Every additional stack of freeze counts towards radius boost
          // +50% radius per radius boost
          const adjustedRadiusBoost = freezeMod.quantity - 1 + state.aggregator.radiusBoost;
          const adjustedRadius = baseRadius * (1 + (0.5 * adjustedRadiusBoost));
          explosions.push({ location: unit, radius: adjustedRadius });
          Unit.removeModifier(unit, freezeCardId, underworld);
        }
      }
      for (let { location, radius } of explosions) {
        explode(location, radius, damage * quantity, 0,
          underworld, prediction);
        makeShatterParticles(location, radius / baseRadius, prediction);
      }
      return state;
    },
  },
  modifiers: {
  },
  events: {
  }
};

// Copied from bone_shrapnel.ts
function makeShatterParticles(position: Vec2, size: number, prediction: boolean) {
  if (prediction || globalThis.headless) {
    // Don't show if just a prediction
    return;
  }

  //
  const textureBoneShrapnel = createParticleTexture();
  if (!textureBoneShrapnel) {
    logNoTextureWarning('makeCorpseExplosion');
    return;
  }
  const configBoneShrapnel = boneShrapnelParticleConfig;
  configBoneShrapnel.lifetime.max *= size;
  configBoneShrapnel.lifetime.min *= size;
  simpleEmitter(position, particles.upgradeConfig(configBoneShrapnel, [textureBoneShrapnel]));

  const textureIceExplosion = createParticleTexture();
  if (!textureIceExplosion) {
    logNoTextureWarning('makeIceExplosion');
    return;
  }
  const configIceExplosion = iceExplosionConfig;
  configIceExplosion.lifetime.max *= size;
  configIceExplosion.lifetime.min *= size;
  simpleEmitter(position, particles.upgradeConfig(configIceExplosion, [textureIceExplosion]));
}

const iceExplosionConfig = {
  autoUpdate: true,
  "alpha": {
    "start": 1,
    "end": 0
  },
  "scale": {
    "start": 2,
    "end": 1,
  },
  "color": {
    "start": colors.convertToHashColor(0x002c6e),
    "end": colors.convertToHashColor(0x59deff)
  },
  "speed": {
    "start": 500,
    "end": 50,
    "minimumSpeedMultiplier": 1
  },
  "acceleration": {
    "x": 0,
    "y": 0
  },
  "maxSpeed": 0,
  "startRotation": {
    "min": 0,
    "max": 360
  },
  "noRotation": false,
  "rotationSpeed": {
    "min": 0,
    "max": 300
  },
  "lifetime": {
    "min": 0.5,
    "max": 0.5
  },
  "blendMode": "normal",
  "frequency": 0.0001,
  "emitterLifetime": 0.1,
  "maxParticles": 300,
  "pos": {
    "x": 0,
    "y": 0
  },
  "addAtBack": true,
  "spawnType": "circle",
  "spawnCircle": {
    "x": 0,
    "y": 0,
    "r": 0
  }
}
export default spell;
