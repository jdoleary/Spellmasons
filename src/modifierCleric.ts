import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import * as Upgrade from './Upgrade';
import { healCardId } from './cards/add_heal';

export const runeClericId = 'Cleric';

export default function registerCleric() {
  registerModifiers(runeClericId, {
    description: i18n('class_cleric'),
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeClericId, { isCurse: false, quantity, keepOnDeath: true }, () => {
          const upgrade = Upgrade.getUpgradeByTitle(healCardId);
          if (upgrade) {
            underworld.forceUpgrade(player, upgrade, true);
          } else {
            console.error('Could not find arrow upgrade for Archer rune');
          }
        });
      } else {
        console.error(`Cannot add rune ${runeClericId}, no player is associated with unit`);
      }
    },
    cost: 5,
  });
}
