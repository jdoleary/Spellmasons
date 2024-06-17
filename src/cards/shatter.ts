import * as particles from 'jdoleary-fork-pixi-particle-emitter'
import * as Unit from '../entity/Unit';
import { Spell, refundLastSpell } from './index';
import { CardCategory } from '../types/commonTypes';
import { createParticleTexture, logNoTextureWarning, simpleEmitter } from '../graphics/Particles';
import { Vec2 } from '../jmath/Vec';
import * as colors from '../graphics/ui/colors';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { freezeCardId } from './freeze';
import { baseExplosionRadius, explode } from '../effects/explode';
import { playDefaultSpellSFX } from './cardUtils';

export const shatterCardId = 'Shatter';
const damageMult = 2;
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
    sfx: 'shatter',
    thumbnail: 'spellIconShatter.png',
    description: [`spell_shatter`, Unit.GetSpellDamage(undefined, damageMult).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // Only target frozen units
      const targetedUnits = state.targetedUnits.filter(u => u.modifiers[freezeCardId]);
      if (targetedUnits.length == 0) {
        refundLastSpell(state, prediction, "Target a frozen unit!");
        return state;
      }

      playDefaultSpellSFX(card, prediction);
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
        explode(location, radius, Unit.GetSpellDamage(state.casterUnit.damage, damageMult) * quantity, 0,
          state.casterUnit,
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

  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeIceExplosion');
    return;
  }

  const config = {
    "alpha": {
      "start": 0.8,
      "end": 0.8
    },
    "scale": {
      "start": 1,
      "end": 0.5,
      "minimumScaleMultiplier": 0.4
    },
    "color": {
      "start": "#a1e3f7",
      "end": "#a1e3f7"
    },
    "speed": {
      "start": 300,
      "end": 300,
      "minimumSpeedMultiplier": 0.8
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
      "max": 0
    },
    "lifetime": {
      "min": 0.4,
      "max": 0.4
    },
    "blendMode": "normal",
    "frequency": 0.003,
    "emitterLifetime": 0.1,
    "maxParticles": 500,
    "pos": {
      "x": 0,
      "y": 0
    },
    "addAtBack": false,
    "spawnType": "circle",
    "spawnCircle": {
      "x": 0,
      "y": 0,
      "r": 0
    }
  };
  const scalar = Math.sqrt(size);
  config.speed.start *= scalar;
  config.speed.end *= scalar;
  config.lifetime.min *= scalar;
  config.lifetime.max *= scalar;
  simpleEmitter(position, particles.upgradeConfig(config, [texture]));
}
export default spell;
