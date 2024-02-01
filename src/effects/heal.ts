import Underworld from "../Underworld";
import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import floatingText from "../graphics/FloatingText";
import * as Image from '../graphics/Image';
import { playDefaultSpellSFX } from "../cards/cardUtils";
import { healCardId } from "../cards/add_heal";
import { EffectState } from "../cards";

export async function healUnits(units: Unit.IUnit[], amount: number, underworld: Underworld, prediction: boolean, state?: EffectState, useHealFx: boolean = true) {
  units = units.filter(u => u.alive);
  if (units.length == 0) return;

  if (useHealFx && !prediction) {
    if (allCards) {
      playDefaultSpellSFX(allCards[healCardId], prediction);
    }
    let animationPromise = undefined;
    for (let unit of units) {
      // All heals animate simultaneously, so just await the last promise
      // Instead of using Promise.All()
      floatingText({ coords: unit, text: `+${Math.abs(amount)} Health` });
      Unit.takeDamage(unit, -amount, undefined, underworld, prediction, state);
      animationPromise = Image.addOneOffAnimation(unit, 'spell-effects/potionPickup', {}, { loop: false, animationSpeed: 0.3 });
    }
    await animationPromise;
    return state;
  } else {
    for (let unit of units) {
      Unit.takeDamage(unit, -amount, undefined, underworld, prediction, state);
    }
    return state;
  }
}

export async function healUnit(unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, state?: EffectState, useHealFx: boolean = true) {
  const units = [unit];
  return await healUnits(units, amount, underworld, prediction, state, useHealFx);
}