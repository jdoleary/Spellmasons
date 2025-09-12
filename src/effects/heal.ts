import Underworld from "../Underworld";
import * as Unit from '../entity/Unit';
import * as colors from '../graphics/ui/colors';
import floatingText from "../graphics/FloatingText";
import * as Image from '../graphics/Image';
import * as config from '../config';
import { EffectState } from "../cards";
import { EXPLAIN_OVERFILL, explain } from "../graphics/Explain";
import { manaPotionRestoreAmount } from "../entity/Pickup";
import { isGoru } from "../entity/Player";

export const healSfx = 'heal';
const animationOptions = { loop: false, animationSpeed: 0.3 };
const manaReplaceColors: [number, number][] = [[0xff0000, colors.manaBlue]];

export async function healUnits(units: Unit.IUnit[], amount: number, sourceUnit: Unit.IUnit | undefined, underworld: Underworld, prediction: boolean, state?: EffectState) {
  units = units.filter(u => u.alive);
  if (units.length == 0 || amount == 0) return;

  for (let unit of units) {
    Unit.takeDamage({
      unit: unit,
      amount: -amount,
      sourceUnit: sourceUnit,
    }, underworld, prediction);
  }

  return state;
}

export async function healUnit(unit: Unit.IUnit, amount: number, sourceUnit: Unit.IUnit | undefined, underworld: Underworld, prediction: boolean, state?: EffectState) {
  const units = [unit];
  return await healUnits(units, amount, sourceUnit, underworld, prediction, state);
}

export async function healManaUnits(units: Unit.IUnit[], amount: number, sourceUnit: Unit.IUnit | undefined, underworld: Underworld, prediction: boolean, state?: EffectState) {
  units = units.filter(u => u.alive);
  if (units.length == 0 || amount == 0) return;

  if (!prediction) {
    const power = Math.floor(amount / manaPotionRestoreAmount);
    for (let unit of units) {
      if (player && isGoru(player)) {
        const addSouls = power || 1;
        unit.soulFragments += addSouls;
        if (!prediction) {
          floatingText({ coords: unit, text: `+${addSouls} ${i18n([`soul fragments`])}`, style: { fill: 'white', ...config.PIXI_TEXT_DROP_SHADOW } });
          playSFXKey('potionPickupMana');
        }
      } else if (unit.charges) {
        Unit.drawCharges(unit, underworld, power || 1);
        if (!prediction) {
          floatingText({ coords: unit, text: i18n([`Draw Card`]), style: { fill: 'blue', ...config.PIXI_TEXT_DROP_SHADOW } });
          playSFXKey('potionPickupMana');
        }
      } else {
        // The default animation for restoring mana is the
        // healing animation with a color filter on top of it
        oneOffHealAnimation(unit, true);
        floatingText({ coords: unit, text: `+ ${amount} ${i18n('Mana')}`, style: { fill: 'blue', ...config.PIXI_TEXT_DROP_SHADOW } });
        explain(EXPLAIN_OVERFILL);
        unit.mana += amount;
      }
    }
    playSFXKey('potionPickupMana');
    return state;
  } else {
    for (let unit of units) {
      unit.mana += amount;
    }
    return state;
  }
}


export async function healManaUnit(unit: Unit.IUnit, amount: number, sourceUnit: Unit.IUnit | undefined, underworld: Underworld, prediction: boolean, state?: EffectState) {
  const units = [unit];
  return await healManaUnits(units, amount, sourceUnit, underworld, prediction, state);
}

export function oneOffHealAnimation(imageHaver: any, asMana: boolean = false): Promise<void> {
  // The default animation for restoring mana is the
  // healing animation with a color filter on top of it
  if (asMana) {
    const options = {
      loop: animationOptions.loop,
      animationSpeed: animationOptions.animationSpeed,
      colorReplace: { colors: manaReplaceColors, epsilon: 0.1 }
    };
    // skipSpyPromise: Healing animation doesn't need to be awaited so don't spy on the promise
    return Image.addOneOffAnimation(imageHaver, 'potionPickup', { skipSpyPromise: true }, options);
  } else {
    // skipSpyPromise: Healing animation doesn't need to be awaited so don't spy on the promise
    return Image.addOneOffAnimation(imageHaver, 'potionPickup', { skipSpyPromise: true }, animationOptions)
  }
}