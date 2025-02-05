import { registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import * as Upgrade from '../Upgrade';
import { BLOOD_GOLEM_ID } from "../entity/units/bloodGolem";

export const runeBloodWarlockId = 'Blood Warlock';
export default function registerBloodWarlock() {
  registerModifiers(runeBloodWarlockId, {
    description: 'rune_bloodwarlock',
    _costPerUpgrade: 160,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeBloodWarlockId, { isCurse: false, quantity, keepOnDeath: true }, () => {
          const upgrade = Upgrade.getUpgradeByTitle(BLOOD_GOLEM_ID);
          if (upgrade) {
            underworld.forceUpgrade(player, upgrade, true);
          } else {
            console.error('Could not find blood golem upgrade upgrade for BloodWarlock rune');
          }
        });
      } else {
        console.error(`Cannot add rune ${runeBloodWarlockId}, no player is associated with unit`);
      }
    },
  });
}
