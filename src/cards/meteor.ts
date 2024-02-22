import Underworld from '../Underworld';
import { HasSpace } from '../entity/Type';
import { refundLastSpell, Spell } from './index';
import { CardCategory } from '../types/commonTypes';
import { playDefaultSpellSFX } from './cardUtils';
import { CardRarity, probabilityMap } from '../types/commonTypes';
import { addWarningAtMouse } from '../graphics/PlanningView';
import { Vec2 } from '../jmath/Vec';
import { baseExplosionRadius, explode } from '../effects/explode';
import { defaultPushDistance } from '../effects/force_move';
import * as colors from '../graphics/ui/colors';
import { randFloat } from '../jmath/rand';
import * as Image from '../graphics/Image';
import { makeForceMoveProjectile } from '../jmath/moveWithCollision';
import { containerProjectiles, containerSpells } from '../graphics/PixiUtils';
import * as particles from '@pixi/particle-emitter'
import { createParticleTexture, logNoTextureWarning, wrappedEmitter } from '../graphics/Particles';

export const meteorCardId = 'meteor';
const damage = 60;
const baseRadius = 100;
const basePushDistance = 100;
const spell: Spell = {
  card: {
    id: meteorCardId,
    category: CardCategory.Damage,
    supportQuantity: true,
    sfx: 'push',
    manaCost: 60,
    healthCost: 0,
    expenseScaling: 2,
    allowNonUnitTarget: true,
    probability: probabilityMap[CardRarity.RARE],
    thumbnail: 'spellIconMeteor.png',
    description: 'Big meteor', // TODO - Description
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
        await meteorProjectiles(meteorLocations, underworld)
        playDefaultSpellSFX(card, prediction);
      }

      let promises = [];
      // TODO - Update with new radiusBoost https://github.com/jdoleary/Spellmasons/pull/491
      const adjustedRadius = baseRadius + state.aggregator.radius;
      for (let meteorLocation of meteorLocations) {
        promises.push(explode(meteorLocation, adjustedRadius, damage * quantity, basePushDistance,
          underworld, prediction,
          colors.bloatExplodeStart, colors.bloatExplodeEnd))
      }
      await Promise.all(promises);
      return state;
    },
  },
};

async function meteorProjectiles(meteorLocations: Vec2[], underworld: Underworld) {
  // We want all meteors to hit at the same time.
  // Fore cinematic purposes, they will start at different times
  // and come from different angles (30 to -30 degrees from "up")

  const arrivalTime = 600; //ms
  const distanceOffset = 300;

  // Setup meteor data
  const meteors: { destination: Vec2, travelTime: number, angle: number }[] = [];
  for (let meteorLocation of meteorLocations) {
    const travelTime = randFloat(200, arrivalTime); //ms
    const angleFromUp = randFloat(-30, 30);
    meteors.push({ destination: meteorLocation, travelTime: travelTime, angle: angleFromUp })
  }
  meteors.sort((a, b) => b.travelTime - a.travelTime);

  if (meteors.length == 0 || meteors[0] == undefined) return;

  // Don't wait for the first meteor
  let timePassed = arrivalTime - meteors[0].travelTime; //ms
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

    attachMeteorParticles(pushedObject, underworld);
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

  return;
}

// TODO - Don't destroy meteor particles after impact
function attachMeteorParticles(target: any, underworld: Underworld, resolver?: () => void) {
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
  if (containerSpells) {
    const wrapped = wrappedEmitter(particleConfig, containerSpells, resolver);
    if (wrapped) {
      underworld.particleFollowers.push({
        displayObject: wrapped.container,
        emitter: wrapped.emitter,
        target,
      })
    } else {
      console.warn('Failed to create meteor particle emitter');
    }
  }
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