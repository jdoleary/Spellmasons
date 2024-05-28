import Underworld from "../Underworld";
import { HasSpace } from "../entity/Type";
import { Vec2 } from "../jmath/Vec";
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import * as Obstacle from '../entity/Obstacle';
import { skyBeam } from '../VisualEffects';
import * as colors from '../graphics/ui/colors';

export function teleport(object: HasSpace, newLocation: Vec2, underworld: Underworld, prediction: boolean, usePredictionLines?: boolean) {
  if (usePredictionLines) {
    // Show prediction lines before the move actually occurs
    if (prediction && globalThis.predictionGraphics) {
      globalThis.predictionGraphics.lineStyle(4, colors.forceMoveColor, 1.0);
      globalThis.predictionGraphics.moveTo(object.x, object.y);
      globalThis.predictionGraphics.lineTo(newLocation.x, newLocation.y);
      // Draw circle at the end so the line path isn't a trail of rectangles with sharp edges
      globalThis.predictionGraphics.lineStyle(1, colors.forceMoveColor, 1.0);
      globalThis.predictionGraphics.beginFill(colors.forceMoveColor);
      globalThis.predictionGraphics.drawCircle(newLocation.x, newLocation.y, 3);
      globalThis.predictionGraphics.endFill();
    }
  }

  if (Unit.isUnit(object)) {
    // Moves the unit to location and resets path
    Unit.setLocation(object, newLocation, underworld, prediction);
    // Check to see if unit interacts with liquid
    Obstacle.tryFallInOutOfLiquid(object, underworld, prediction);
  } else if (Pickup.isPickup(object)) {
    Pickup.setPosition(object, newLocation.x, newLocation.y);
  } else {
    object.x = newLocation.x;
    object.y = newLocation.y;
  }

  if (!prediction) {
    // Animate effect of unit spawning from the sky
    skyBeam(newLocation);
  }
}