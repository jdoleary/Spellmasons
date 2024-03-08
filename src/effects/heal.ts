import Underworld from "../Underworld";
import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import floatingText from "../graphics/FloatingText";
import * as Image from '../graphics/Image';
import * as config from '../config';
import heal from "../cards/add_heal";
import sendMana from "../cards/send_mana";
import { playDefaultSpellSFX } from "../cards/cardUtils";
import { EffectState } from "../cards";
import { EXPLAIN_OVERFILL, explain } from "../graphics/Explain";

const animationOptions = { loop: false, animationSpeed: 0.3 };
const manaReplaceColors: [number, number][] = [[0xff0000, colors.manaBlue]];

export async function healUnits(source: any | undefined, units: Unit.IUnit[], amount: number, underworld: Underworld, prediction: boolean, state?: EffectState, useFx: boolean = true) {
  units = units.filter(u => u.alive);
  if (units.length == 0 || amount == 0) return;

  if (useFx && !prediction) {
    playDefaultSpellSFX(heal.card, prediction);
    let animationPromise = undefined;
    for (let unit of units) {
      // All heals animate simultaneously, so just await the last promise
      // Instead of using Promise.All()
      floatingText({ coords: unit, text: globalThis.getChosenLanguageCode() == 'en' ? `+${Math.abs(amount)} Health` : `${i18n('heal')} ${Math.abs(amount)}` });
      Unit.takeDamage({
        source: source,
        unit: unit,
        amount: -amount,
      }, underworld, prediction);
      animationPromise = oneOffHealAnimation(unit);
    }
    await animationPromise;
    return state;
  } else {
    for (let unit of units) {
      Unit.takeDamage({
        source: source,
        unit: unit,
        amount: -amount,
      }, underworld, prediction);
    }
    return state;
  }
}

export async function healUnit(source: any | undefined, unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, state?: EffectState, useFx: boolean = true) {
  const units = [unit];
  return await healUnits(source, units, amount, underworld, prediction, state, useFx);
}

export async function healManaUnits(source: any | undefined, units: Unit.IUnit[], amount: number, underworld: Underworld, prediction: boolean, state?: EffectState, useFx: boolean = true) {
  units = units.filter(u => u.alive);
  if (units.length == 0 || amount == 0) return;

  if (useFx && !prediction) {
    playDefaultSpellSFX(sendMana.card, prediction);
    let animationPromise = undefined;
    for (let unit of units) {
      // All heals animate simultaneously, so just await the last promise
      // Instead of using Promise.All()
      floatingText({ coords: unit, text: `+ ${amount} ${i18n('Mana')}`, style: { fill: 'blue', ...config.PIXI_TEXT_DROP_SHADOW } });
      unit.mana += amount;
      explain(EXPLAIN_OVERFILL);
      // The default animation for restoring mana is the
      // healing animation with a color filter on top of it
      animationPromise = oneOffHealAnimation(unit, true);
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

export async function healManaUnit(source: any | undefined, unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, state?: EffectState, useFx: boolean = true) {
  const units = [unit];
  return await healManaUnits(source, units, amount, underworld, prediction, state, useFx);
}

function oneOffHealAnimation(imageHaver: any, asMana: boolean = false): Promise<void> {
  // The default animation for restoring mana is the
  // healing animation with a color filter on top of it
  if (asMana) {
    const options = {
      loop: animationOptions.loop,
      animationSpeed: animationOptions.animationSpeed,
      colorReplace: { colors: manaReplaceColors, epsilon: 0.1 }
    };
    return Image.addOneOffAnimation(imageHaver, 'spell-effects/potionPickup', {}, options);
  } else {
    return Image.addOneOffAnimation(imageHaver, 'spell-effects/potionPickup', {}, animationOptions)
  }
}