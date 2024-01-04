import { raceTimeout } from "../Promise";
import Underworld from "../Underworld";
import { HasSpace } from "../entity/Type";
import { Vec2, multiply, normalized, subtract } from "../jmath/Vec";
import { ForceMoveType, ForceMoveUnitOrPickup } from "../jmath/moveWithCollision";

// TODO - Force moves need to be handled differently
// such that they are consistent at different framerates and velocity falloffs

export const defaultPushDistance = 140; // In game units
const velocity_falloff = 0.992;
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
  const dir = subtract(towards, pushedObject);
  return forcePushDelta(pushedObject, multiply(distance, normalized(dir)), underworld, prediction);
}

// Shorthand Function
export async function forcePushAwayFrom(pushedObject: HasSpace, awayFrom: Vec2, distance: number, underworld: Underworld, prediction: boolean): Promise<void> {
  // Pushes the object away from another by a certain distance
  const dir = subtract(pushedObject, awayFrom);
  return forcePushDelta(pushedObject, multiply(distance, normalized(dir)), underworld, prediction);
}

// Shorthand Function
export async function forcePushToDestination(pushedObject: HasSpace, destination: Vec2, distanceMultiplier: number, underworld: Underworld, prediction: boolean): Promise<void> {
  // The movement is the difference between the object and its destination
  // Multiply by magnitude where 0.5 moves it halfway to destination and 2 moves it twice as far
  const delta = subtract(destination, pushedObject);
  return forcePushDelta(pushedObject, multiply(distanceMultiplier, delta), underworld, prediction);
}

// Find starting velocity based on the direction and distance we want to move
function movementToVelocity(deltaMovement: Vec2): Vec2 {
  let mult = (1 - velocity_falloff) / EXPECTED_MILLIS_PER_GAMELOOP;
  mult /= 7; //correction for in game units
  return multiply(mult, deltaMovement);
}