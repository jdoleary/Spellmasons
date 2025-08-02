import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import * as Upgrade from './Upgrade';
import * as captureSoul from './cards/capture_soul';

export const runeNecromancerId = 'Necromancer';

export default function registerNecromancer() {
  registerModifiers(runeNecromancerId, {
    description: i18n('class_necromancer'),
    _costPerUpgrade: 200,
    maxUpgradeCount: 1,
    omitForWizardType: ['Goru', 'Deathmason'],
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      const player = underworld.players.find(p => p.unit == unit);
      if (player) {
        getOrInitModifier(unit, runeNecromancerId, { isCurse: false, quantity, keepOnDeath: true }, () => {
          const upgrade = Upgrade.getUpgradeByTitle(captureSoul.id);
          if (upgrade) {
            underworld.forceUpgrade(player, upgrade, true);
          } else {
            console.error('Could not find arrow upgrade for Archer rune');
          }
        });

      } else {
        console.error('Cannot add rune Necromancer, no player is associated with unit');
      }
    },
  });
}
