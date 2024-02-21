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
import { containerProjectiles } from '../graphics/PixiUtils';
import { HasSpace } from '../entity/Type';
import Underworld from '../Underworld';

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

      if (!prediction) {
        await meteorProjectiles(meteorLocations, underworld)
      }

      let promises = [];
      playDefaultSpellSFX(card, prediction);
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

  const arrivalTime = 2000; //ms
  const distanceOffset = 150;

  // Setup meteor data
  const meteors: { destination: Vec2, travelTime: number, angle: number }[] = [];
  for (let meteorLocation of meteorLocations) {
    const travelTime = randFloat(500, 2000); //ms
    const angleFromUp = randFloat(-30, 30);
    meteors.push({ destination: meteorLocation, travelTime: travelTime, angle: angleFromUp })
  }
  meteors.sort((a, b) => b.travelTime - a.travelTime);
  console.log(meteors);

  let timePassed = 0; //ms
  for (let meteor of meteors) {
    // Can't access destination, speed, or angle
    //createVisualFlyingProjectile({ x: meteor.destination.x, y: meteor.destination.y + 100 }, meteor.destination,)

    const spawnTime = arrivalTime - meteor.travelTime;
    await new Promise(resolve => setTimeout(resolve, spawnTime - timePassed));
    timePassed = spawnTime;

    const startPos = { x: meteor.destination.x, y: meteor.destination.y - distanceOffset };
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

export default spell;