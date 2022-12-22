import seedrandom from 'seedrandom';
import type { CardCost } from './cards/cardUtils';
import { cardRarityAsString, getCardRarityColor } from './graphics/ui/CardUI';
import { chooseObjectWithProbability } from './jmath/rand';
import { MESSAGE_TYPES } from './types/MessageTypes';
import { IPlayer } from './entity/Player';
import Underworld from './Underworld';
import * as Unit from './entity/Unit';
import { maybeManaOverfillProportionChance, plusManaMinusStamina_manaProportion, plusManaMinusStamina_staminaProportion, plusRangeMinusHealth_healthProportion, plusRangeMinusHealth_rangeProportion, plusStaminaMinusHealth_healthProportion, plusStaminaMinusHealth_staminaProportion } from './config';
import { maybeManaOverfillId } from './modifieMaybeManaOverfill';
export interface IUpgrade {
  title: string;
  type: 'perk' | 'card';
  description: (player: IPlayer) => string;
  thumbnail: string;
  // The maximum number of copies a player can have of this upgrade
  maxCopies?: number;
  // note: effect shouldn't be called directly, use Underworld.chooseUpgrade instead so
  // it will keep track of how many upgrades the player has left to choose
  effect: (player: IPlayer, underworld: Underworld) => void;
  // The probability of getting this as an upgrade
  probability: number;
  cost: CardCost;
}
// Chooses a random card based on the card's probabilities
// minimumProbability ensures that super rare cards won't be presented too early on
// onlyStats: means it'll present stats upgrades instead of card upgrades
export function generateUpgrades(player: IPlayer, numberOfUpgrades: number, minimumProbability: number, usePerks: boolean): IUpgrade[] {
  // Dead players choose special upgrades
  if (usePerks && player.diedDuringLevel) {
    return [...upgradeSourceWhenDead];
  }
  let upgrades: IUpgrade[] = [];
  const filterUpgrades = (u: IUpgrade) =>
    (u.maxCopies === undefined
      ? // Always include upgrades that don't have a specified maxCopies
      true
      : // Filter out  upgrades that the player can't have more of
      player.upgrades.filter((pu) => pu.title === u.title).length <
      u.maxCopies)
    // Now that upgrades are cards too, make sure it doesn't
    // show upgrades that the player already has as cards
    && !player.cards.includes(u.title)
  const filteredUpgradeCardsSource = upgradeCardsSource.filter(filterUpgrades);
  // Every other level, players get to choose from stas upgrades or card upgrades
  // Unless Player already has all of the upgrades, in which case they
  // only have stat upgrades to choose from
  let upgradeList = filteredUpgradeCardsSource.length === 0 || usePerks ? upgradeStatsSource.filter(filterUpgrades) : filteredUpgradeCardsSource;
  // Limit the rarity of cards that are possible to attain
  upgradeList = upgradeList.filter(u => u.probability >= minimumProbability);

  // Clone upgrades for later mutation
  const clonedUpgradeSource = [...upgradeList];
  // Choose from upgrades
  const numberOfCardsToChoose = Math.min(
    numberOfUpgrades,
    clonedUpgradeSource.length,
  );
  for (
    let i = 0;
    // limited by the config.NUMBER_OF_UPGRADES_TO_CHOOSE_FROM or the number of cloned
    // upgrades that are left, whichever is less
    i < numberOfCardsToChoose;
    i++
  ) {
    const upgrade = chooseObjectWithProbability(clonedUpgradeSource, seedrandom());
    if (upgrade) {
      const index = clonedUpgradeSource.indexOf(upgrade);
      upgrades = upgrades.concat(clonedUpgradeSource.splice(index, 1));
    } else {
      console.log('No upgrades to choose from', clonedUpgradeSource);
    }
  }
  return upgrades;
}
export function createUpgradeElement(upgrade: IUpgrade, player: IPlayer, underworld: Underworld) {
  if (globalThis.headless) {
    // There is no DOM in headless mode
    return;
  }
  const { pie } = underworld;
  const element = document.createElement('div');
  element.classList.add('card', 'upgrade');
  if (upgrade.type === 'perk') {
    element.classList.add('perk', 'ui-border');
  } else {
    element.classList.add(cardRarityAsString(upgrade));
  }
  element.dataset.upgrade = upgrade.title;
  const elCardInner = document.createElement('div');
  elCardInner.classList.add('card-inner');
  elCardInner.style.borderColor = getCardRarityColor(upgrade);
  element.appendChild(elCardInner);
  // Card costs
  const elCardBadgeHolder = document.createElement('div');
  elCardBadgeHolder.classList.add('card-badge-holder');
  element.appendChild(elCardBadgeHolder);
  if (upgrade.cost.manaCost) {
    const elCardManaBadge = document.createElement('div');
    elCardManaBadge.classList.add('card-mana-badge', 'card-badge');
    elCardManaBadge.innerHTML = upgrade.cost.manaCost.toString();
    elCardBadgeHolder.appendChild(elCardManaBadge);
  }
  if (upgrade.cost.healthCost) {
    const elCardHealthBadge = document.createElement('div');
    elCardHealthBadge.classList.add('card-health-badge', 'card-badge');
    elCardHealthBadge.innerHTML = upgrade.cost.healthCost.toString();
    elCardBadgeHolder.appendChild(elCardHealthBadge);
  }

  const thumbHolder = document.createElement('div');
  const thumbnail = document.createElement('img');
  thumbnail.src = upgrade.thumbnail;
  thumbHolder.appendChild(thumbnail);
  thumbHolder.classList.add('card-thumb');
  elCardInner.appendChild(thumbHolder);
  const title = document.createElement('h2');
  title.classList.add('card-title');
  title.innerText = i18n(upgrade.title);
  elCardInner.appendChild(title);
  if (upgrade.type === 'card') {
    const rarityText = document.createElement('div');
    rarityText.classList.add('card-rarity')
    rarityText.style.color = getCardRarityColor(upgrade);
    rarityText.innerHTML = cardRarityAsString(upgrade).toLocaleLowerCase();
    elCardInner.appendChild(rarityText);
  }

  const desc = document.createElement('div');
  desc.classList.add('card-description');
  const descriptionText = document.createElement('div');
  descriptionText.innerHTML = upgrade.description(player).trimStart();
  desc.appendChild(descriptionText);

  elCardInner.appendChild(desc);
  element.addEventListener('click', (e) => {
    // Prevent click from "falling through" upgrade and propagating to vote for overworld level
    e.stopPropagation();
    pie.sendData({
      type: MESSAGE_TYPES.CHOOSE_UPGRADE,
      upgrade,
    });
  });
  element.addEventListener('mouseenter', (e) => {
    playSFXKey('click');
  });
  return element;
}
export function getUpgradeByTitle(title: string): IUpgrade | undefined {
  const all_upgrades = [...upgradeCardsSource, ...upgradeSourceWhenDead, ...upgradeStatsSource];
  return all_upgrades.find((u) => u.title === title);
}
export const upgradeSourceWhenDead: IUpgrade[] = [
  {
    title: 'Resurrect',
    type: 'perk',
    description: () => 'Resurrects you so the adventure can continue!',
    thumbnail: 'images/upgrades/resurrect.png',
    // Resurrection happens automatically at the start of each level
    effect: () => { },
    probability: 30,
    cost: { healthCost: 0, manaCost: 0 },
  },
];

export const upgradeStatsSource: IUpgrade[] = [
  {
    title: '+ Max Health',
    type: 'perk',
    description: (player) =>
      `Increases your max health from ${player.unit.healthMax} to ${player.unit.healthMax + maxHealthIncreaseAmount
      }`,
    thumbnail: 'images/upgrades/health1.png',
    effect: (player, underworld) => {
      player.unit.healthMax += maxHealthIncreaseAmount;
      player.unit.health = player.unit.healthMax;
      // Now that the player unit's mana has increased,sync the new
      // mana state with the player's predictionUnit so it is properly
      // refelcted in the health bar
      // (note: this would be auto corrected on the next mouse move anyway)
      underworld.syncPlayerPredictionUnitOnly();
    },
    probability: 40,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: '++ Max Health',
    type: 'perk',
    description: (player) =>
      `Increases your max health from ${player.unit.healthMax} to ${player.unit.healthMax + maxHealthIncreaseAmount * 2
      }`,
    thumbnail: 'images/upgrades/health2.png',
    effect: (player, underworld) => {
      player.unit.healthMax += maxHealthIncreaseAmount * 2;
      player.unit.health = player.unit.healthMax;
      // Now that the player unit's mana has increased,sync the new
      // mana state with the player's predictionUnit so it is properly
      // refelcted in the health bar
      // (note: this would be auto corrected on the next mouse move anyway)
      underworld.syncPlayerPredictionUnitOnly();
    },
    probability: 20,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: '+ Max Mana',
    type: 'perk',
    description: (player) =>
      `Increases your mana from ${player.unit.manaMax} to ${player.unit.manaMax + maxManaIncreaseAmount
      }`,
    thumbnail: 'images/upgrades/mana1.png',
    effect: (player, underworld) => {
      Unit.setPlayerManaMax(player.unit, player.unit.manaMax + maxManaIncreaseAmount);
      // Now that the player unit's mana has increased,sync the new
      // mana state with the player's predictionUnit so it is properly
      // refelcted in the health bar
      // (note: this would be auto corrected on the next mouse move anyway)
      underworld.syncPlayerPredictionUnitOnly();
    },
    probability: 40,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: '++ Max Mana',
    type: 'perk',
    description: (player) =>
      `Increases your mana from ${player.unit.manaMax} to ${player.unit.manaMax + maxManaIncreaseAmount * 2
      }`,
    thumbnail: 'images/upgrades/mana2.png',
    effect: (player, underworld) => {
      Unit.setPlayerManaMax(player.unit, player.unit.manaMax + maxManaIncreaseAmount * 2);
      // Now that the player unit's mana has increased,sync the new
      // mana state with the player's predictionUnit so it is properly
      // refelcted in the health bar
      // (note: this would be auto corrected on the next mouse move anyway)
      underworld.syncPlayerPredictionUnitOnly();
    },
    probability: 20,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: 'Quickling',
    type: 'perk',
    description: (player) =>
      `Increases your stamina to ${Math.floor(100 * plusStaminaMinusHealth_staminaProportion)}% but decreased your max health to ${Math.floor(100 * plusStaminaMinusHealth_healthProportion)}%`,
    thumbnail: 'images/spell/unknown.png',
    effect: (player, underworld) => {
      player.unit.healthMax *= plusStaminaMinusHealth_healthProportion;
      // Round to a whole number
      player.unit.healthMax = Math.max(1, Math.floor(player.unit.healthMax));
      player.unit.health = player.unit.healthMax;
      player.unit.stamina *= plusStaminaMinusHealth_staminaProportion;
      // Now that the player unit's properties have changed ,sync the new
      // state with the player's predictionUnit so it is properly
      // refelcted in the bar
      // (note: this would be auto corrected on the next mouse move anyway)
      underworld.syncPlayerPredictionUnitOnly();
    },
    probability: 10,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: 'Glass Sniper',
    type: 'perk',
    description: (player) =>
      `Increases your cast range to ${Math.floor(100 * plusRangeMinusHealth_rangeProportion)}% but decreased your max health to ${Math.floor(100 * plusRangeMinusHealth_healthProportion)}%`,
    thumbnail: 'images/spell/unknown.png',
    effect: (player, underworld) => {
      player.unit.healthMax *= plusRangeMinusHealth_healthProportion;
      // Round to a whole number
      player.unit.healthMax = Math.max(1, Math.floor(player.unit.healthMax));
      player.unit.health = player.unit.healthMax;
      player.unit.attackRange *= plusRangeMinusHealth_rangeProportion;
      // Now that the player unit's properties have changed, sync the new
      // state with the player's predictionUnit so it is properly
      // refelcted in the bar
      // (note: this would be auto corrected on the next mouse move anyway)
      underworld.syncPlayerPredictionUnitOnly();
    },
    probability: 10,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: 'Stone Tower',
    type: 'perk',
    maxCopies: 1,
    description: (player) =>
      `Increases your mana to ${Math.floor(100 * plusManaMinusStamina_manaProportion)}% but decreased your max stamina to ${Math.floor(100 * plusManaMinusStamina_staminaProportion)}%`,
    thumbnail: 'images/spell/unknown.png',
    effect: (player, underworld) => {
      Unit.setPlayerManaMax(player.unit, player.unit.manaMax * plusManaMinusStamina_manaProportion);

      player.unit.staminaMax *= plusManaMinusStamina_staminaProportion;
      // Round to a whole number
      player.unit.staminaMax = Math.floor(player.unit.staminaMax);
      player.unit.stamina = player.unit.staminaMax;
      // Now that the player unit's properties have changed, sync the new
      // state with the player's predictionUnit so it is properly
      // refelcted in the bar
      // (note: this would be auto corrected on the next mouse move anyway)
      underworld.syncPlayerPredictionUnitOnly();
    },
    probability: 10,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: 'Overflowing Mana',
    type: 'perk',
    maxCopies: 1,
    description: (player) =>
      `Grants a ${Math.floor(100 * maybeManaOverfillProportionChance)}% chance on the start of every turn that you will get 2x mana for that turn.`,
    thumbnail: 'images/spell/unknown.png',
    effect: (player, underworld) => {
      Unit.addModifier(player.unit, maybeManaOverfillId, underworld, false);
    },
    probability: 500,
    cost: { healthCost: 0, manaCost: 0 },
  },
  // {
  //   title: '+ Cast Range',
  //   type: 'perk',
  //   description: (player) =>
  //     `Increases your maximum cast range by ${castRangeIncreaseProportion * 100}%`,
  //   thumbnail: 'images/upgrades/todo.png',
  //   effect: (player) => {
  //     player.unit.attackRange += player.unit.attackRange * castRangeIncreaseProportion;
  //   },
  //   probability: 20,
  //   cost: { healthCost: 0, manaCost: 0 },
  // },
  // {
  //   title: '+ Max Stamina',
  //   type: 'perk',
  //   description: (player) =>
  //     `Increases your stamina by ${maxStaminaIncreaseProportion * 100}%`,
  //   thumbnail: 'images/spell/unknown.png',
  //   effect: (player) => {
  //     player.unit.staminaMax += player.unit.staminaMax * maxStaminaIncreaseProportion;
  //     player.unit.stamina = player.unit.staminaMax;
  //   },
  //   probability: 20,
  //   cost: { healthCost: 0, manaCost: 0 },
  // },
];
const maxManaIncreaseAmount = 10;
const castRangeIncreaseProportion = 0.1;
const maxStaminaIncreaseProportion = 0.2;
const maxHealthIncreaseAmount = 3;
// const manaPerTurnIncreaseAmount = 8;

export const upgradeCardsSource: IUpgrade[] = []

// Template
//   {
//     title: '',
//     description: '',
//     thumbnail: '.png',
//     probability:1
//   },
