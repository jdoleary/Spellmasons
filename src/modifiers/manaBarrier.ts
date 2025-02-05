import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import * as config from '../config';
import * as Image from '../graphics/Image';
import floatingText from "../graphics/FloatingText";
import Underworld from '../Underworld';
import type { Sprite } from 'pixi.js';

// Damage is taken from mana before health at [quantity]% effectiveness
export const manaBarrierId = 'Mana Barrier';
export const modifierImagePath = 'modifierShield.png';
export default function registerManaBarrier() {
  registerModifiers(manaBarrierId, {
    description: ('rune_manabarrier'),
    unitOfMeasure: ('% effectiveness'),
    _costPerUpgrade: 100,
    maxUpgradeCount: 3,
    quantityPerUpgrade: 5,
    addModifierVisuals: (unit: Unit.IUnit, underworld: Underworld) => {
      // Add subsprite image
      // @ts-ignore: imagePath is a property that i've added and is not a part of the PIXI type
      // which is used for identifying the sprite or animation that is currently active
      // Add subsprite image
      const animatedBarrierSprite = unit.image?.sprite.children.find(c => c.imagePath == modifierImagePath)
        || Image.addSubSprite(unit.image, modifierImagePath);
      if (animatedBarrierSprite) {
        // Make it blue just so it looks distinct from shield
        (animatedBarrierSprite as Sprite).tint = 0x0000ff;
      }

    },
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, manaBarrierId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, manaBarrierId);
      });
    },
    subsprite: {
      imageName: modifierImagePath,
      alpha: 0.5,
      anchor: {
        x: 0.5,
        y: 0.5,
      },
      scale: {
        x: 1.0,
        y: 1.0,
      },
    },
  });
  registerEvents(manaBarrierId, {
    onTooltip: (unit: Unit.IUnit, underworld: Underworld) => {
      const modifier = unit.modifiers[manaBarrierId];
      if (modifier) {
        // This returns the maximum blockable damage,
        // based on the unit's mana and modifier quantity
        // We need to update this any time mana changes
        modifier.tooltip = `${i18n('Mana Barrier')}: ${Math.floor(unit.mana * CalcMult(modifier.quantity))} ${i18n('Damage')}`
      }
    },
    onTakeDamage: (unit: Unit.IUnit, amount: number, underworld: Underworld, prediction: boolean, damageDealer?: Unit.IUnit) => {
      const modifier = unit.modifiers[manaBarrierId];
      if (modifier) {
        // If the incoming effect is damage (not healing)
        if (amount > 0) {
          // Damage should be taken from mana before health
          const blockableDamage = Math.min(amount, unit.mana * CalcMult(modifier.quantity));
          if (blockableDamage > 0) {
            amount -= blockableDamage;
            unit.mana -= blockableDamage / CalcMult(modifier.quantity);
            if (!prediction) {
              floatingText({
                coords: unit,
                text: 'Shielded from damage!',
                style: {
                  fill: 'blue',
                  ...config.PIXI_TEXT_DROP_SHADOW
                },
              });
            }
          }
        }
      }

      // Does not modify incoming damage/healing otherwise
      return amount;
    },
  });
}

function CalcMult(quantity: number): number {
  // Each Quantity = 1% barrier effectiveness
  // 100(%) quantity = 1:1 ratio = 1 mana blocks 1 damage
  // 20(%) quantity = 5:1 ratio = 5 mana blocks 1 damage
  return quantity / 100;
}