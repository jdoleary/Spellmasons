import { registerModifiers } from "../cards";
import * as Player from '../entity/Player';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

const rerollRuneId = 'reroll'
export default function registerStatUpgradeModifiers() {
  registerModifiers(rerollRuneId, {
    description: `reroll_rune_description`,
    _costPerUpgrade: 15,
    constant: true,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (!player) {
        console.error('Attempted to upgrade stat for unit with no associated player');
        return;
      }
      Player.incrementPresentedRunesForPlayer(player, underworld);
    },
    probability: 0,
  });
}
