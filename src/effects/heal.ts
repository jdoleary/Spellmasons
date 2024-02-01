import Underworld from "../Underworld";
import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import floatingText from "../graphics/FloatingText";
import * as Image from '../graphics/Image';
import * as config from '../config';
import { playDefaultSpellSFX } from "../cards/cardUtils";
import { healCardId } from "../cards/add_heal";
import { EffectState } from "../cards";
import { sendManaCardId } from "../cards/send_mana";
import { EXPLAIN_OVERFILL, explain } from "../graphics/Explain";

const animationOptions = { loop: false, animationSpeed: 0.3 };

export async function healUnits(units: Unit.IUnit[], amount: number, underworld: Underworld, prediction: boolean, state?: EffectState, useFx: boolean = true) {
  units = units.filter(u => u.alive);
  if (units.length == 0 || amount == 0) return;

  if (useFx && !prediction) {
    if (allCards) {
      playDefaultSpellSFX(allCards[healCardId], prediction);
    }
    let animationPromise = undefined;
    for (let unit of units) {
      // All heals animate simultaneously, so just await the last promise
      // Instead of using Promise.All()
      floatingText({ coords: unit, text: `+${Math.abs(amount)} Health` });
      Unit.takeDamage(unit, -amount, undefined, underworld, prediction, state);
      animationPromise = Image.addOneOffAnimation(unit, 'spell-effects/potionPickup', {}, animationOptions);
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

export async function healUnit(unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, state?: EffectState, useFx: boolean = true) {
  const units = [unit];
  return await healUnits(units, amount, underworld, prediction, state, useFx);
}

export async function healManaUnits(units: Unit.IUnit[], amount: number, underworld: Underworld, prediction: boolean, state?: EffectState, useFx: boolean = true) {
  units = units.filter(u => u.alive);
  if (units.length == 0 || amount == 0) return;

  if (useFx && !prediction) {
    if (allCards) {
      playDefaultSpellSFX(allCards[sendManaCardId], prediction);
    }
    let animationPromise = undefined;
    for (let unit of units) {
      // All heals animate simultaneously, so just await the last promise
      // Instead of using Promise.All()
      floatingText({ coords: unit, text: `+ ${amount} Mana`, style: { fill: 'blue', ...config.PIXI_TEXT_DROP_SHADOW } });
      unit.mana += amount;
      explain(EXPLAIN_OVERFILL);
      // TODO - Create mana version of this healing effect or improve support for colorfilter
      animationPromise = Image.addOneOffAnimation(unit, 'spell-effects/potionPickup', {}, animationOptions);
    }
    await animationPromise;
    return state;
  } else {
    for (let unit of units) {
      unit.mana += amount;
    }
    return state;
  }
}

export async function healManaUnit(unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, state?: EffectState, useFx: boolean = true) {
  const units = [unit];
  return await healManaUnits(units, amount, underworld, prediction, state, useFx);
}