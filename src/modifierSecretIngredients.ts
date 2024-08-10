import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import { distance } from "./jmath/math";
import { setPower } from "./entity/Pickup";
import { makeManaTrail } from "./graphics/Particles";
import { getColorFromPotion } from "./cards/potion_shatter";
import { convertToHashColor } from "./graphics/ui/colors";

// Empower potions within cast range each turn
export const secretIngredientsId = 'Secret Ingredients';
export default function registerSecretIngredients() {
  registerModifiers(secretIngredientsId, {
    description: 'rune_secret_ingredients',
    costPerUpgrade: 200,
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
        const potions = getAllPotionsInAttackRange(unit, underworld, prediction);
        potions.forEach(p => {
          makeManaTrail(unit, p, underworld, convertToHashColor(getColorFromPotion(p)), '#ff0000', potions.length * modifier.quantity).then(() =>
            setPower(p, p.power + modifier.quantity)
          );
        });
      }
    }
  });
}

function getAllPotionsInAttackRange(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  let potions = prediction ? underworld.pickupsPrediction : underworld.pickups;
  potions = potions.filter(p => p.name.includes("Potion") && distance(unit, p) <= unit.attackRange);
  return potions;
}