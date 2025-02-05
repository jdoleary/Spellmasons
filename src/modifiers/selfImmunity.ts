import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import floatingText from "../graphics/FloatingText";
import Underworld from '../Underworld';

// Grants a unit invulnerability to its own damage (I.E. explosives)
export const selfInvulnerabilityId = 'Self Invulnerability';
export default function registerSelfInvulnerability() {
  registerModifiers(selfInvulnerabilityId, {
    description: 'rune_self_invulnerability',
    stage: "Amount Override",
    _costPerUpgrade: 80,
    maxUpgradeCount: 1,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, selfInvulnerabilityId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, selfInvulnerabilityId);
      });
    }
  });
  registerEvents(selfInvulnerabilityId, {
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[selfInvulnerabilityId];
      if (modifier) {
        // Set tooltip:
        modifier.tooltip = `${i18n('Invulnerable')} to self ${i18n('Damage')}`;
      }
    },
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      const modifier = unit.modifiers[selfInvulnerabilityId];
      if (modifier) {
        // If the source of incoming damage is myself, negate it
        if (damageDealer == unit && amount > 0) {
          amount = 0;
          floatingText({ coords: unit, text: 'Self-Invulnerable', prediction });
        }
      }

      return amount;
    }
  });
}