import { registerModifiers } from "./cards";
import { getOrInitModifier } from "./cards/util";
import { IPlayer } from "./entity/Player";
import * as Unit from './entity/Unit';
import { runeFarGazerId } from "./modifierFarGazer";
import { runeTimemasonId } from "./modifierTimemason";
import Underworld from './Underworld';

const wordMap: { [key: string]: string } = {
  'attackRange': 'Cast Range',
  'manaMax': 'Mana',
  'healthMax': 'Health',
  'staminaMax': 'Stamina',
  'Good Looks': 'Good Looks'
}
export default function registerStatUpgradeModifiers() {
  ['healthMax', 'manaMax', 'staminaMax', 'attackRange'].map(stat => {
    registerModifiers(wordMap[stat] || stat, {
      description: `rune_${stat}`,
      costPerUpgrade: 30,
      // addModifierVisuals,
      add: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number = 1) => {
        const statBumpAmount: Pick<Unit.IUnit, "attackRange" | "manaMax" | "healthMax" | "staminaMax"> = {
          attackRange: 20, //previously 8
          manaMax: 5,
          healthMax: 20, //previously 8
          staminaMax: 20 //previously 10
        }
        const player = underworld.players.find(p => p.unit == unit);
        if (!player) {
          console.error('Attempted to upgrade stat for unit with no associated player');
          return;
        }

        const unitStatKey = stat as keyof typeof statBumpAmount;
        if (stat && statBumpAmount[unitStatKey] && player.unit[unitStatKey]) {
          let statBump = statBumpAmount[unitStatKey] || 10;
          statBump = modifyStatBumpAmount(statBump, unitStatKey, player);

          player.unit[unitStatKey] += statBump;
          const nonMaxStatKey = stat.replace('Max', '') as keyof Pick<Unit.IUnit, "attackRange" | "mana" | "health" | "stamina">;
          if (stat.endsWith('Max') && typeof player.unit[nonMaxStatKey] === 'number') {
            player.unit[nonMaxStatKey] += statBump;
          }

          if (player == globalThis.player) {
            // Now that the player unit's properties have changed, sync the new
            // state with the player's predictionUnit so it is properly
            // reflected in the bar
            // (note: this would be auto corrected on the next mouse move anyway)
            underworld.syncPlayerPredictionUnitOnly();
            Unit.syncPlayerHealthManaUI(underworld);
          }
        }
      },
      probability: 0,
    });
  })
}

function modifyStatBumpAmount(statBump: number, unitStatKey: "attackRange" | "manaMax" | "healthMax" | "staminaMax", player: IPlayer): number {
  switch (unitStatKey) {
    case "healthMax": {
      // No current modifiers
      break;
    }
    case "manaMax": {
      // Timemason gets 2x mana
      if (player.unit.modifiers[runeTimemasonId]) {
        statBump *= 2;
      }
      break;
    }
    case "staminaMax": {
      // Fargazer gets 0.5x stamina
      if (player.unit.modifiers[runeFarGazerId]) {
        statBump /= 2;
      }
      break;
    }
    case "attackRange": {
      // Fargazer gets 2x attack range
      if (player.unit.modifiers[runeFarGazerId]) {
        statBump *= 2;
      }
      break;
    }
  }

  return statBump;
}