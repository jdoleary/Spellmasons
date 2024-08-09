import { registerEvents, registerModifiers } from "./cards";
import { getOrInitModifier, Modifier } from "./cards/util";
import * as Unit from './entity/Unit';
import Underworld from './Underworld';
import { distance } from "./jmath/math";
import { setPower } from "./entity/Pickup";
import { makeManaTrail } from "./graphics/Particles";
import { getColorFromPotion } from "./cards/potion_shatter";
import { convertToHashColor } from "./graphics/ui/colors";
import { chooseOneOfSeeded, getUniqueSeedString } from "./jmath/rand";
import seedrandom from "seedrandom";

// Empower [quantity] potions within cast range each turn. (Can target the same potion multiple times)
export const secretIngredientsId = 'Secret Ingredients';
export default function registerSecretIngredients() {
  registerModifiers(secretIngredientsId, {
    description: 'rune_secret_ingredients',
    costPerUpgrade: 100,
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
        const random = seedrandom(`${getUniqueSeedString(underworld)} - ${unit.id}`);
        const potions = getAllPotionsInAttackRange(unit, underworld, prediction);
        if (potions.length > 0) {
          for (let i = 0; i < modifier.quantity; i++) {
            const potion = chooseOneOfSeeded(potions, random);
            if (potion) {
              makeManaTrail(unit, potion, underworld, convertToHashColor(getColorFromPotion(potion)), '#ff0000', potions.length * modifier.quantity).then(() =>
                setPower(potion, potion.power + modifier.quantity)
              );
            } else {
              console.error("Could not select potion from potions: ", potions);
            }
          }
        }
      }
    }
  });
}

function getAllPotionsInAttackRange(unit: Unit.IUnit, underworld: Underworld, prediction: boolean) {
  let potions = prediction ? underworld.pickupsPrediction : underworld.pickups;
  potions = potions.filter(p => p.name.includes("Potion") && distance(unit, p) <= unit.attackRange);
  return potions;
}