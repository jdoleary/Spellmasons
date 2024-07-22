import { registerModifiers } from "./cards";
import { arrowCardId } from "./cards/arrow";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import * as Upgrade from './Upgrade';

export const runeArcherId = 'Archer';

export default function registerArcher() {
  registerModifiers(runeArcherId, {
    description: i18n('class_archer'),
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeArcherId, { isCurse: false, quantity, keepOnDeath: true }, () => {
          const upgrade = Upgrade.getUpgradeByTitle(arrowCardId);
          if (upgrade) {
            underworld.forceUpgrade(player, upgrade, true);
          } else {
            console.error('Could not find arrow upgrade for Archer rune');
          }
        });

      } else {
        console.error('Cannot add rune Archer, no player is associated with unit');
      }
    },
    cost: 5,
  });
}
