import { HasSpace } from "./entity/Type";
import { isUnit, IUnit, takeDamage } from "./entity/Unit";
import { explain, EXPLAIN_LIQUID_DAMAGE } from "./graphics/Explain";
import { addMask, removeMask } from "./graphics/Image";
import { liquidmancerId } from "./modifierLiquidmancer";
import type Underworld from "./Underworld";

// sourceUnit is the unit that caused 'entity' to fall in liquid
export function doLiquidEffect(underworld: Underworld, unit: IUnit, prediction: boolean, sourceUnit?: IUnit) {
  if (!underworld.lastLevelCreated) {
    return;
  }
  let liquidDamageMultiplier = 1;
  underworld.players.forEach(p => {
    const liquidmancerModifier = p.unit.modifiers[liquidmancerId];
    if (liquidmancerModifier) {
      liquidDamageMultiplier += 0.01 * liquidmancerModifier.quantity;
    }
  });

  switch (underworld.lastLevelCreated.biome) {
    case 'water':
      takeDamage({ unit, amount: 20 * liquidDamageMultiplier, sourceUnit }, underworld, prediction);
      break;
    case 'lava':
      takeDamage({ unit, amount: 30 * liquidDamageMultiplier, sourceUnit }, underworld, prediction);
      break;
    case 'blood':
      takeDamage({ unit, amount: 40 * liquidDamageMultiplier, sourceUnit }, underworld, prediction);
      break;
    case 'ghost':
      takeDamage({ unit, amount: 50 * liquidDamageMultiplier, sourceUnit }, underworld, prediction);
      break;
    default:
      console.error('Unknown biome')
      break;
  }

}

export const LIQUID_MASK = 'liquid-mask';
// sourceUnit is the unit that caused 'entity' to fall in liquid
export function add(entity: HasSpace, underworld: Underworld, prediction: boolean, sourceUnit?: IUnit) {
  // Can't set inLiquid if they are already in liquid
  if (!entity.inLiquid) {
    entity.inLiquid = true;
    if (isUnit(entity)) {
      explain(EXPLAIN_LIQUID_DAMAGE);
      doLiquidEffect(underworld, entity, prediction, sourceUnit);
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