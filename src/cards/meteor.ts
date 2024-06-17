import Underworld from '../Underworld';
import { HasSpace } from '../entity/Type';
import { refundLastSpell, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { addWarningAtMouse } from '../graphics/PlanningView';
import { Vec2 } from '../jmath/Vec';
import { explode } from '../effects/explode';
import * as colors from '../graphics/ui/colors';
import { randFloat } from '../jmath/rand';
import * as Image from '../graphics/Image';
import { makeForceMoveProjectile } from '../jmath/moveWithCollision';
import { containerProjectiles } from '../graphics/PixiUtils';
import * as particles from 'jdoleary-fork-pixi-particle-emitter';
import { createParticleTexture, logNoTextureWarning, wrappedEmitter } from '../graphics/Particles';
import { stopAndDestroyForeverEmitter } from '../graphics/ParticleCollection';
import { raceTimeout } from '../Promise';
import { GetSpellDamage } from '../entity/Unit';

export const meteorCardId = 'meteor';
const damageMult = 3;
const baseRadius = 100;
const basePushDistance = 100;
const spell: Spell = {
  card: {
    id: meteorCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    sfx: 'meteorFall',
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 2,
    allowNonUnitTarget: true,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconMeteor.png',
    description: ['spell_meteor', GetSpellDamage(undefined, damageMult).toString()],
    effect: async (state, card, quantity, underworld, prediction) => {
      // We should create a meteor at each targeted unit
      // Or if no targeted units, at the cast location
      const targetedUnits = state.targetedUnits.filter(u => u.alive);
      let meteorLocations: Vec2[] = [];
      if (targetedUnits.length > 0) {
        targetedUnits.forEach(u => {
          meteorLocations.push({ x: u.x, y: u.y })
        });
      }
      else {
        // If cast location is out of bounds, refund
        if (underworld.isCoordOnWallTile(state.castLocation)) {
          if (prediction) {
            const WARNING = "Invalid Summon Location";
            addWarningAtMouse(WARNING);
          } else {
            refundLastSpell(state, prediction, 'Invalid summon location, mana refunded.')
          }
          return state;
        }
        // Add cast location to targets [];
        meteorLocations.push(state.castLocation);
      }

      if (!prediction && !globalThis.headless) {
        playDefaultSpellSFX(card, prediction);
        await raceTimeout(1500, 'meteor', meteorProjectiles(meteorLocations, underworld));
        playSFXKey('meteorExplode');
      }

      const adjustedRadius = baseRadius * (1 + (0.25 * state.aggregator.radiusBoost));
      for (let meteorLocation of meteorLocations) {
        explode(meteorLocation, adjustedRadius, GetSpellDamage(state.casterUnit.damage, damageMult) * quantity, basePushDistance,
          state.casterUnit,
          underworld, prediction,
          colors.bloatExplodeStart, colors.bloatExplodeEnd)
      }
      await underworld.awaitForceMoves();
      return state;
    },
  },
};

async function meteorProjectiles(meteorLocations: Vec2[], underworld: Underworld) {
  // We want all meteors to hit at the same time.
  // Fore cinematic purposes, they will start at different times
  // and come from different angles (30 to -30 degrees from "up")

  const arrivalTime = 1500; //ms
  const distanceOffset = 1500;

  // Setup meteor data
  const meteors: { destination: Vec2, travelTime: number, angle: number }[] = [];
  for (let meteorLocation of meteorLocations) {
    const travelTime = randFloat(arrivalTime / 4, arrivalTime); //ms
    const angleFromUp = randFloat(-30, 30);
    meteors.push({ destination: meteorLocation, travelTime: travelTime, angle: angleFromUp })
  }
  meteors.sort((a, b) => b.travelTime - a.travelTime);

  if (meteors.length == 0 || meteors[0] == undefined) return;

  // Don't wait for the first meteor
  let timePassed = arrivalTime - meteors[0].travelTime; //ms
  const emitters = [];
  for (let meteor of meteors) {
    // Can't access destination, speed, or angle
    //createVisualFlyingProjectile({ x: meteor.destination.x, y: meteor.destination.y + 100 }, meteor.destination,)

    const spawnTime = arrivalTime - meteor.travelTime;
    await new Promise(resolve => setTimeout(resolve, spawnTime - timePassed));
    timePassed = spawnTime;

    const angleInRadians = meteor.angle * (Math.PI / 180);
    // Calculate new point coordinates
    const startPos = {
      x: meteor.destination.x + distanceOffset * Math.sin(angleInRadians),
      y: meteor.destination.y - distanceOffset * Math.cos(angleInRadians),
    }
    let image: Image.IImageAnimated | undefined;
    image = Image.create(startPos, 'projectile/arrow', containerProjectiles)
    if (image) {
      image.sprite.rotation = Math.atan2(meteor.destination.y - startPos.y, meteor.destination.x - startPos.x);
    }
    const pushedObject: HasSpace = {
      x: startPos.x,
      y: startPos.y,
      radius: 1,
      inLiquid: false,
      image,
      immovable: false,
      beingPushed: false
    }

    emitters.push(attachMeteorParticles(pushedObject, underworld));
    makeForceMoveProjectile({
      pushedObject,
      startPoint: startPos,
      endPoint: meteor.destination,
      speed: distanceOffset / meteor.travelTime,
      doesPierce: true,
      ignoreUnitIds: underworld.units.map(u => u.id),
      collideFnKey: "",
    }, underworld, false);
  }

  await new Promise(resolve => setTimeout(resolve, arrivalTime - timePassed));
  // all meteors have arrived
  for (let e of emitters) {
    if (e) {
      // "Stop" producing new particles
      // by making the frequency super high and then
      // stopping the emitter once the existing particles have
      // faded out
      e.frequency = 100000;
      // Destroy after existing particles have faded
      setTimeout(() => {
        stopAndDestroyForeverEmitter(e);
      }, e.maxLifetime);
    }
  }

  return;
}

// TODO - Don't destroy meteor particles after impact
function attachMeteorParticles(target: any, underworld: Underworld, resolver?: () => void): particles.Emitter | undefined {
  const texture = createParticleTexture();
  if (!texture) {
    logNoTextureWarning('makeMeteorParticles');
    if (resolver) {
      resolver();
    }
    return;
  }
  const particleConfig =
    particles.upgradeConfig(meteorEmitterConfig(), [texture]);
  if (containerProjectiles) {
    const wrapped = wrappedEmitter(particleConfig, containerProjectiles, resolver);
    if (wrapped) {
      underworld.particleFollowers.push({
        displayObject: wrapped.container,
        emitter: wrapped.emitter,
        target,
      });
      return wrapped.emitter;
    } else {
      console.warn('Failed to create meteor particle emitter');
    }
  }
  return undefined;
}

// TODO - Update this: Currently using deathmason particle config
const meteorEmitterConfig = () => ({
  autoUpdate: true,
  "alpha": {
    "start": 1,
    "end": 0.2
  },
  "scale": {
    "start": 4,
    "end": 1,
    "minimumScaleMultiplier": 1
  },
  "color": {
    "start": "#fa3e14",
    "end": "#080404"
  },
  "speed": {
    "start": 0,
    "end": 0,
    "minimumSpeedMultiplier": 1
  },
  "acceleration": {
    "x": 0,
    "y": 0
  },
  "maxSpeed": 0,
  "startRotation": {
    "min": 210,
    "max": 330
  },
  "noRotation": false,
  "rotationSpeed": {
    "min": 0,
    "max": 0
  },
  "lifetime": {
    "min": 0.4,
    "max": 0.8
  },
  "blendMode": "normal",
  "frequency": 0.005,
  "emitterLifetime": 0,
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
    "r": 10
  }
});

export default spell;