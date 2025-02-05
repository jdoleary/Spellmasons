import seedrandom from "seedrandom";
import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import { chooseObjectWithProbability, getUniqueSeedString } from "../jmath/rand";
import Underworld from '../Underworld';
import { addOneOffAnimation } from "../graphics/Image";
import floatingText from "../graphics/FloatingText";

export const blackCoinId = 'Black Coin';
export default function registerBlackCoin() {
  registerModifiers(blackCoinId, {
    description: ('rune_black_coin'),
    _costPerUpgrade: 100,
    unitOfMeasure: '% Chance',
    quantityPerUpgrade: 1,
    maxUpgradeCount: 80,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, blackCoinId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, blackCoinId);
      });
    }
  });
  registerEvents(blackCoinId, {
    onDealDamage: (damageDealer: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageReciever?: Unit.IUnit) => {
      if (prediction) {
        // Hide the result of black coin during prediction
        return amount
      }
      // Never proc black coin on self, this just feels bad
      if (damageReciever && damageDealer.id == damageReciever.id) {
        return amount;
      }
      const modifier = damageDealer.modifiers[blackCoinId];
      if (modifier && damageReciever && !Unit.isBoss(damageReciever.unitSourceId)) {
        const seed = seedrandom(getUniqueSeedString(underworld) + `-${damageReciever.id}-${damageReciever.health}`);
        const useBlackCoin = chooseObjectWithProbability([{ useBlackCoin: true, probability: modifier.quantity }, { useBlackCoin: false, probability: 100 - modifier.quantity }], seed)?.useBlackCoin || false;
        // Do fatal damage
        if (useBlackCoin) {
          Unit.die(damageReciever, underworld, prediction, damageDealer);
          addOneOffAnimation(damageReciever, 'coin', {}, { loop: false, colorReplace: { colors: [[0xe7b338, 0x181818], [0xf1d462, 0x393939]], epsilon: 0.1 }, scale: 0.5 });
          playSFXKey('blackCoin');
          floatingText({ coords: damageReciever, text: 'Black Coin', style: { fill: 0x000 } });

        }
      }


      return amount;
    }
  });
}