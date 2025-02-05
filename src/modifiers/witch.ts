import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import * as Upgrade from '../Upgrade';
import { contaminate_id } from '../cards/contaminate';

// Grants a cheaper/empowered contaminate
export const runeWitchId = 'Witch';
export default function registerWitch() {
  registerModifiers(runeWitchId, {
    description: 'rune_witch',
    _costPerUpgrade: 100,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeWitchId, { isCurse: false, quantity, keepOnDeath: true }, () => {
          const upgrade = Upgrade.getUpgradeByTitle(contaminate_id);
          if (upgrade) {
            underworld.forceUpgrade(player, upgrade, true);
          } else {
            console.error('Could not find contaminate upgrade for Witch rune');
          }
        });
      } else {
        console.error(`Cannot add rune ${runeWitchId}, no player is associated with unit`);
      }
    },
  });
}
