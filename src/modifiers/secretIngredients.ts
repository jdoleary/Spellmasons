import { registerEvents, registerModifiers } from "../cards";
import { getOrInitModifier } from "../cards/util";
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import { distance } from "../jmath/math";
import { setPower } from "../entity/Pickup";
import { makeManaTrail } from "../graphics/Particles";
import { getColorFromPotion } from "../cards/potion_shatter";
import { convertToHashColor } from "../graphics/ui/colors";

// Empower the nearest potion by [quantity] each turn
export const secretIngredientsId = 'Secret Ingredients';
const powerScale = 0.5;
export default function registerSecretIngredients() {
  registerModifiers(secretIngredientsId, {
    description: 'rune_secret_ingredients',
    _costPerUpgrade: 120,
    add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
      getOrInitModifier(unit, secretIngredientsId, { isCurse: false, quantity, keepOnDeath: true }, () => {
        Unit.addEvent(unit, secretIngredientsId);
      });
    },
  });
  registerEvents(secretIngredientsId, {
    onTurnStart: async (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => {
      const modifier = unit.modifiers[secretIngredientsId];
      if (modifier && unit.alive) {
        const nearestPotion = getNearestPotion(unit, underworld, prediction);
        if (nearestPotion) {
          makeManaTrail(unit, nearestPotion, underworld, convertToHashColor(getColorFromPotion(nearestPotion)), '#ff0000', modifier.quantity).then(() =>
            setPower(nearestPotion, nearestPotion.power + (modifier.quantity * powerScale))
          );
        }
      }
    }
  });
}

function getNearestPotion(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  let potions = prediction ? underworld.pickupsPrediction : underworld.pickups;
  potions = potions.filter(p => p.name.includes("Potion")).sort((a, b) => distance(a, unit) - distance(b, unit));
  return potions[0];
}