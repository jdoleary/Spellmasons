import { HasSpace } from "./entity/Type";
import { isUnit, IUnit, takeDamage } from "./entity/Unit";
import { explain, EXPLAIN_LIQUID_DAMAGE } from "./graphics/Explain";
import { addMask, removeMask } from "./graphics/Image";
import type Underworld from "./Underworld";

export function doLiquidEffect(underworld: Underworld, unit: IUnit, prediction: boolean) {
  if (!underworld.lastLevelCreated) {
    return;
  }
  switch (underworld.lastLevelCreated.biome) {
    case 'water':
      takeDamage({ unit, amount: 20 }, underworld, prediction);
      break;
    case 'lava':
      takeDamage({ unit, amount: 30 }, underworld, prediction);
      break;
    case 'blood':
      takeDamage({ unit, amount: 40 }, underworld, prediction);
      break;
    case 'ghost':
      takeDamage({ unit, amount: 50 }, underworld, prediction);
      break;
    default:
      console.error('Unknown biome')
      break;
  }

}

export const LIQUID_MASK = 'liquid-mask';
export function add(entity: HasSpace, underworld: Underworld, prediction: boolean) {
  // Can't set inLiquid if they are already in liquid
  if (!entity.inLiquid) {
    entity.inLiquid = true;
    if (isUnit(entity)) {
      explain(EXPLAIN_LIQUID_DAMAGE);
      doLiquidEffect(underworld, entity, prediction);
    }
    if (entity.image) {
      addMask(entity.image, LIQUID_MASK);
    }
    if (!prediction) {
      playSFXKey(`fallIntoLiquid-${underworld.lastLevelCreated?.biome}`);
    }
  }
}
export function remove(entity: HasSpace) {
  entity.inLiquid = false;
  if (entity.image) {
    removeMask(entity.image);
  }
}