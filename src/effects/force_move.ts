import { raceTimeout } from "../Promise";
import Underworld from "../Underworld";
import { HasSpace } from "../entity/Type";
import { Vec2, multiply, normalized, subtract, add } from "../jmath/Vec";
import { ForceMove, ForceMoveType, ForceMoveUnitOrPickup, isForceMoveUnitOrPickup } from "../jmath/moveWithCollision";

// TODO - Force moves need to be handled differently
// such that they are consistent at different framerates and velocity falloffs
// https://github.com/jdoleary/Spellmasons/issues/381

export const defaultPushDistance = 140; // In game units
const velocity_falloff = 0.992;
export const EXPECTED_MILLIS_PER_GAMELOOP = 16;

export async function forcePushDelta(pushedObject: HasSpace, deltaMovement: Vec2, underworld: Underworld, prediction: boolean): Promise<void> {
  // Do not act on objects that are flagged for removal
  if (pushedObject.flaggedForRemoval) {
    return Promise.resolve();
  }
  // Calculate velocity needed to move object
  let velocity = movementToVelocity(deltaMovement);
  pushedObject.beingPushed = true;

  let forceMoveInst: ForceMoveUnitOrPickup;
  return await raceTimeout(2000, 'Push', new Promise<void>((resolve) => {
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
  let mult = (1 - velocity_falloff);
  return multiply(mult, deltaMovement);
}
// Adds the properties of a newForceMove onto a preexisting force move
export function sumForceMoves(preExistingForceMove: ForceMove, newForceMove: ForceMove) {
  if (isForceMoveUnitOrPickup(newForceMove)) {
    // Since the new force move is mutating the existing force
    // move instead of being added as a new one, resolve it since
    // it won't be processed any more
    // ---
    // This prevents dangling forcemoves that timeout even tho
    // their force effect still takes place
    newForceMove.resolve();
  }
  preExistingForceMove.velocity = add(preExistingForceMove.velocity, newForceMove.velocity);

}