import { SubmergeId } from "./cards/submerge";
import { HasSpace } from "./entity/Type";
import { isUnit, IUnit, takeDamage } from "./entity/Unit";
import Events from "./Events";
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
  let damage = {
    'water': 20,
    'lava': 30,
    'blood': 40,
    'ghost': 50
  }[underworld.lastLevelCreated.biome] * liquidDamageMultiplier;

  let adjustedDamage = damage;

  // Trigger in liquid events
  const events = [...unit.events, ...underworld.events];
  for (let eventName of events) {
    const fn = Events.onLiquidSource[eventName];
    if (fn) {
      adjustedDamage = fn(unit, true, damage, underworld, prediction, sourceUnit);
    }
  }

  takeDamage({ unit, amount: adjustedDamage, sourceUnit }, underworld, prediction);

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
  // Do not remove inLiquid if entity has Submerge curse
  if (isUnit(entity) && entity.modifiers[SubmergeId]) {
    return;
  }
  entity.inLiquid = false;
  if (entity.image) {
    removeMask(entity.image);
  }
}