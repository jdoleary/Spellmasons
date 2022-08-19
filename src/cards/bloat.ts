import * as particles from '@pixi/particle-emitter'
import { IUnit, takeDamage } from '../entity/Unit';
import * as Unit from '../entity/Unit';
import * as Image from '../graphics/Image';
import { Spell } from './index';
import { drawPredictionCircle } from '../graphics/PlanningView';
import { forcePush, velocityStartMagnitude } from './push';
import type Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { animateSpell } from './cardUtils';
import { createParticleTexture, simpleEmitter } from '../graphics/Particles';
import { Vec2 } from '../jmath/Vec';
import * as colors from '../graphics/ui/colors';

const id = 'Bloat';
const imageName = 'explode-on-death.png';
const damage = 3;
const range = 140;
function add(unit: IUnit, underworld: Underworld, prediction: boolean, quantity: number) {
  // First time setup
  if (!unit.modifiers[id]) {
    unit.modifiers[id] = {
      isCurse: true,
      quantity
    };
    // Add event
    if (!unit.onDeathEvents.includes(id)) {
      unit.onDeathEvents.push(id);
    }
    // Add subsprite image
    if (unit.image) {
      // Visually "bloat" the image
      unit.image.sprite.scale.x = 1.5;
    }
  }
}
function remove(unit: IUnit, underworld: Underworld) {
  if (unit.image) {
    // reset the scale
    unit.image.sprite.scale.x = 1.0;
  }
}

const spell: Spell = {
  card: {
    id,
    category: CardCategory.Curses,
    supportQuantity: true,
    manaCost: 15,
    healthCost: 0,
    expenseScaling: 1,
    probability: 50,
    thumbnail: 'spellIconBloat.png',
    description: `Cursed targets explode when they die dealing ${damage} damage to all units within the
    explosion radius.
    Multiple stacks of bloat will increase the amount of damage done when the unit explodes.`,
    effect: async (state, card, quantity, underworld, prediction) => {
      for (let unit of state.targetedUnits) {
        Unit.addModifier(unit, id, underworld, prediction, quantity);
      }
      return state;
    },
  },
  modifiers: {
    add,
    remove,
    subsprite: {
      imageName,
      alpha: 1.0,
      anchor: {
        x: 0,
        y: 0,
      },
      scale: {
        x: 0.5,
        y: 0.5,
      },
    },
  },
  events: {
    onDeath: async (unit: IUnit, underworld: Underworld, prediction: boolean) => {
      const quantity = unit.modifiers[id]?.quantity || 1;
      drawPredictionCircle(unit, range, colors.healthRed, 'Explosion Radius');
      if (!prediction) {
        animateSpell(unit, 'explode-on-death.png');
        playSFXKey('bloatExplosion');
      }
      makeBloatExplosionWithParticles(unit, prediction);
      underworld.getUnitsWithinDistanceOfTarget(
        unit,
        range,
        prediction
      ).forEach(u => {
        // Deal damage to units
        takeDamage(u, damage * quantity, u, underworld, prediction);
        // Push units away from exploding unit
        forcePush(u, unit, velocityStartMagnitude, underworld, prediction);
      });
      underworld.getPickupsWithinDistanceOfTarget(
        unit,
        range,
        prediction
      ).forEach(p => {
        // Push pickups away
        forcePush(p, unit, velocityStartMagnitude, underworld, prediction);
      })
    }
  }
};
function makeBloatExplosionWithParticles(position: Vec2, prediction: boolean) {
  if (prediction) {
    // Don't show if just a prediction
    return
  }
  const texture = createParticleTexture();
  if (!texture) {
    console.error('No texture for makeBloatExplosion')
    return
  }
  const config =
    particles.upgradeConfig({
      autoUpdate: true,
      "alpha": {
        "start": 1,
        "end": 0
      },
      "scale": {
        "start": 3,
        "end": 2,
      },
      "color": {
        "start": "#d66437",
        "end": "#f5e8b6"
      },
      "speed": {
        "start": 900,
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
        "min": 0.3,
        "max": 0.3
      },
      "blendMode": "normal",
      "frequency": 0.0001,
      "emitterLifetime": 0.1,
      "maxParticles": 2000,
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
    }, [texture]);
  simpleEmitter(position, config);
}
export default spell;
