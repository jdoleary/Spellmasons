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
          underworld, prediction,
          0x002c6e, 0x59deff);
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
    logNoTextureWarning('makeCorpseExplosion');
    return;
  }
  const config =
    particles.upgradeConfig({
      autoUpdate: true,
      "alpha": {
        "start": 1,
        "end": 0.5
      },
      "scale": {
        "start": 0.5,
        "end": 0.5,
        "minimumScaleMultiplier": 1
      },
      "color": {
        "start": "#707070",
        "end": "#c2c2c2"
      },
      "speed": {
        "start": 600,
        "end": 600,
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
        "min": 50,
        "max": 50
      },
      "lifetime": {
        "min": 0.2 * size,
        "max": 0.2 * size
      },
      "blendMode": "normal",
      "frequency": 0.001,
      "emitterLifetime": 0.1,
      "maxParticles": 50,
      "pos": {
        "x": 0,
        "y": 0
      },
      "addAtBack": true,
      "spawnType": "point"
    }, [texture]);
  simpleEmitter(position, config);
}
export default spell;
