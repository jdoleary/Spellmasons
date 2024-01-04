import { raceTimeout } from "../Promise";
import Underworld from "../Underworld";
import { HasSpace } from "../entity/Type";
import { Vec2, multiply, normalized, subtract } from "../jmath/Vec";
import { ForceMoveType, ForceMoveUnitOrPickup } from "../jmath/moveWithCollision";

export const defaultPushDistance = 50; // In game units
const velocity_falloff = 0.9950;
const EXPECTED_MILLIS_PER_GAMELOOP = 0.15;
export async function forcePushDelta(pushedObject: HasSpace, deltaMovement: Vec2, underworld: Underworld, prediction: boolean): Promise<void> {
  // Calculate velocity needed to move object
  let velocity = movementToVelocity(deltaMovement);
  pushedObject.beingPushed = true;

  let forceMoveInst: ForceMoveUnitOrPickup;
  return await raceTimeout(2000, 'Push', new Promise<void>((resolve) => {
    // Experiment: canCreateSecondOrderPushes now is ALWAYS disabled.
    // I've had feedback that it's suprising - which is bad for a tactical game
    // also I suspect it has significant performance costs for levels with many enemies
    forceMoveInst = { type: ForceMoveType.UNIT_OR_PICKUP, canCreateSecondOrderPushes: false, alreadyCollided: [], pushedObject, velocity, velocity_falloff, resolve }
    underworld.addForceMove(forceMoveInst, prediction);
  })).then(() => {
    if (forceMoveInst) {
      // Now that the push has completed, allow this object to be pushed again
      forceMoveInst.pushedObject.beingPushed = false;
      forceMoveInst.timedOut = true;
    }
  });
}

// Shorthand Function
export async function forcePushTowards(pushedObject: HasSpace, towards: Vec2, distance: number, underworld: Underworld, prediction: boolean): Promise<void> {
  // Pushes the object to another by a certain distance
  const dir = subtract(pushedObject, towards);
  return forcePushDelta(pushedObject, multiply(distance, normalized(dir)), underworld, prediction);
}

// Shorthand Function
export async function forcePushAwayFrom(pushedObject: HasSpace, awayFrom: Vec2, distance: number, underworld: Underworld, prediction: boolean): Promise<void> {
  // Pushes the object away from another by a certain distance
  const dir = subtract(awayFrom, pushedObject);
  return forcePushDelta(pushedObject, multiply(distance, normalized(dir)), underworld, prediction);
}

// Shorthand Function
export async function forcePushToDestination(pushedObject: HasSpace, destination: Vec2, distanceMultiplier: number, underworld: Underworld, prediction: boolean): Promise<void> {
  // The movement is the difference between the object and its destination
  // Multiply by magnitude where 0.5 moves it halfway to destination and 2 moves it twice as far
  const delta = subtract(pushedObject, destination);
  return forcePushDelta(pushedObject, multiply(distanceMultiplier, delta), underworld, prediction);
}

// Find starting velocity based on the direction and distance we want to move
function movementToVelocity(deltaMovement: Vec2): Vec2 {
  return multiply((1 - velocity_falloff) / EXPECTED_MILLIS_PER_GAMELOOP, deltaMovement)
}




// interface forcePushArgs {
//   pushedObject: HasSpace;
//   awayFrom: Vec2;
//   velocityStartMagnitude: number;
//   canCreateSecondOrderPushes: boolean;
//   resolve: () => void;
// }
// export function makeForcePush(args: forcePushArgs, underworld: Underworld, prediction: boolean): ForceMove {
//   const { pushedObject, awayFrom, resolve, velocityStartMagnitude, canCreateSecondOrderPushes } = args;
//   const velocity = similarTriangles(pushedObject.x - awayFrom.x, pushedObject.y - awayFrom.y, distance(pushedObject, awayFrom), velocityStartMagnitude);
//   const velocity_falloff = 0.9956;
//   pushedObject.beingPushed = true;
//   // Experiment: canCreateSecondOrderPushes now is ALWAYS disabled.
//   // I've had feedback that it's suprising - which is bad for a tactical game
//   // also I suspect it has significant performance costs for levels with many enemies
//   const forceMoveInst: ForceMoveUnitOrPickup = { type: ForceMoveType.UNIT_OR_PICKUP, pushedObject, alreadyCollided: [], canCreateSecondOrderPushes: false, velocity, velocity_falloff, resolve }
//   if (prediction) {
//     underworld.forceMovePrediction.push(forceMoveInst);
//   } else {
//     underworld.addForceMove(forceMoveInst);
//   }
//   return forceMoveInst;

// }
// export async function forcePush(pushedObject: HasSpace, awayFrom: Vec2, magnitude: number, underworld: Underworld, prediction: boolean): Promise<void> {
//   let forceMoveInst: ForceMove;
//   if (equal(pushedObject, awayFrom)) {
//     // An object pushed awayfrom itself wont move and so this can resolve immediately
//     return Promise.resolve();

//   }
//   // An object being pushed cannot be pushed more than once simultaneously
//   if (pushedObject.beingPushed) {
//     return Promise.resolve();
//   }
//   return await raceTimeout(3000, 'Push', new Promise<void>((resolve) => {
//     // Experiment: canCreateSecondOrderPushes is now ALWAYS disabled.
//     // I've had feedback that it's suprising - which is bad for a tactical game
//     // also I suspect it has significant performance costs for levels with many enemies
//     forceMoveInst = makeForcePush({ pushedObject, awayFrom, velocityStartMagnitude: magnitude, resolve, canCreateSecondOrderPushes: false }, underworld, prediction);
//   })).then(() => {
//     if (forceMoveInst) {
//       // Now that the push has completed, allow this object to be pushed again
//       forceMoveInst.pushedObject.beingPushed = false;
//       forceMoveInst.timedOut = true;
//     }
//   });

// }


// export async function pull(pushedObject: HasSpace, towards: Vec2, quantity: number, underworld: Underworld, prediction: boolean): Promise<void> {
//   // Set the velocity so it's just enough to pull the unit into you
//   let velocity = multiply((1 - velocity_falloff) / EXPECTED_MILLIS_PER_GAMELOOP, { x: towards.x - pushedObject.x, y: towards.y - pushedObject.y });
//   velocity = multiply(quantity, velocity);
//   let forceMoveInst: ForceMoveUnitOrPickup;
//   return await raceTimeout(2000, 'Pull', new Promise<void>((resolve) => {
//     // Experiment: canCreateSecondOrderPushes now is ALWAYS disabled.
//     // I've had feedback that it's suprising - which is bad for a tactical game
//     // also I suspect it has significant performance costs for levels with many enemies
//     forceMoveInst = { type: ForceMoveType.UNIT_OR_PICKUP, canCreateSecondOrderPushes: false, alreadyCollided: [], pushedObject, velocity, velocity_falloff, resolve }
//     if (prediction) {
//       underworld.forceMovePrediction.push(forceMoveInst);
//     } else {

//       underworld.addForceMove(forceMoveInst);
//     }
//   })).then(() => {
//     if (forceMoveInst) {
//       forceMoveInst.timedOut = true;
//     }
//   });

// }