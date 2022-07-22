import seedrandom from 'seedrandom';
import type { CardCost } from './cards/cardUtils';
import { getCardRarityColor } from './graphics/ui/CardUI';
import { chooseObjectWithProbability, probabilityToRarity } from './jmath/rand';
import { MESSAGE_TYPES } from './types/MessageTypes';
import type { IPlayer } from './entity/Player';
import Underworld from './Underworld';
export interface IUpgrade {
  title: string;
  description: (player: IPlayer) => string;
  thumbnail: string;
  // The maximum number of copies a player can have of this upgrade
  maxCopies?: number;
  effect: (player: IPlayer, underworld: Underworld) => void;
  // The probability of getting this as an upgrade
  probability: number;
  cost: CardCost;
}
// Chooses a random card based on the card's probabilities
// minimumProbability ensures that super rare cards won't be presented too early on
// onlyStats: means it'll present stats upgrades instead of card upgrades
export function generateUpgrades(player: IPlayer, numberOfUpgrades: number, minimumProbability: number, onlyStats: boolean): IUpgrade[] {
  // Dead players choose special upgrades
  if (!player.unit.alive) {
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
  let upgradeList = filteredUpgradeCardsSource.length === 0 || onlyStats ? upgradeStatsSource.filter(filterUpgrades) : filteredUpgradeCardsSource;
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
export function createUpgradeElement(upgrade: IUpgrade, player: IPlayer) {
  if (globalThis.headless) {
    // There is no DOM in headless mode
    return;
  }
  const element = document.createElement('div');
  element.classList.add('card', 'upgrade');
  element.dataset.upgrade = upgrade.title;
  const elCardInner = document.createElement('div');
  elCardInner.classList.add('card-inner');
  elCardInner.style.borderColor = getCardRarityColor(upgrade);
  elCardInner.style.backgroundColor = getCardRarityColor(upgrade);
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
  title.innerText = upgrade.title;
  elCardInner.appendChild(title);

  const desc = document.createElement('div');
  desc.classList.add('card-description');
  const descriptionText = document.createElement('div');
  descriptionText.innerHTML = upgrade.description(player);
  desc.appendChild(descriptionText);
  const rarityText = document.createElement('div');
  rarityText.innerHTML = `Rarity: ${probabilityToRarity(upgrade.probability)}`;
  desc.appendChild(rarityText);

  elCardInner.appendChild(desc);
  element.addEventListener('click', (e) => {
    // Prevent click from "falling through" upgrade and propagating to vote for overworld level
    e.stopPropagation();
    globalThis.pie.sendData({
      type: MESSAGE_TYPES.CHOOSE_UPGRADE,
      upgrade,
    });
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
    description: (player) =>
      `Increases your max health from ${player.unit.healthMax} to ${player.unit.healthMax + maxHealthIncreaseAmount
      }`,
    thumbnail: 'images/upgrades/plus_max_health.png',
    effect: (player, underworld) => {
      player.unit.healthMax += maxHealthIncreaseAmount;
      player.unit.health = player.unit.healthMax;
      // Now that the player unit's mana has increased,sync the new
      // mana state with the player's predictionUnit so it is properly
      // refelcted in the health bar
      // (note: this would be auto corrected on the next mouse move anyway)
      underworld.syncPlayerPredictionUnitOnly();
    },
    probability: 30,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: '+ Max Mana',
    description: (player) =>
      `Increases your mana from ${player.unit.manaMax} to ${player.unit.manaMax + maxManaIncreaseAmount
      }`,
    thumbnail: 'images/upgrades/todo.png',
    effect: (player, underworld) => {
      player.unit.manaMax += maxManaIncreaseAmount;
      player.unit.mana = player.unit.manaMax;
      player.unit.manaPerTurn = player.unit.manaMax;
      // Now that the player unit's mana has increased,sync the new
      // mana state with the player's predictionUnit so it is properly
      // refelcted in the health bar
      // (note: this would be auto corrected on the next mouse move anyway)
      underworld.syncPlayerPredictionUnitOnly();
    },
    probability: 30,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: '+ Cast Range',
    description: (player) =>
      `Increases your maximum cast range by ${castRangeIncreaseProportion * 100}%`,
    thumbnail: 'images/upgrades/todo.png',
    effect: (player) => {
      player.unit.attackRange += player.unit.attackRange * castRangeIncreaseProportion;
    },
    probability: 30,
    cost: { healthCost: 0, manaCost: 0 },
  },
  {
    title: '+ Max Stamina',
    description: (player) =>
      `Increases your stamina by ${maxStaminaIncreaseProportion * 100}%`,
    thumbnail: 'images/spell/walk.png',
    effect: (player) => {
      player.unit.staminaMax += player.unit.staminaMax * maxStaminaIncreaseProportion;
      player.unit.stamina = player.unit.staminaMax;
    },
    probability: 30,
    cost: { healthCost: 0, manaCost: 0 },
  },
];
const maxManaIncreaseAmount = 10;
const castRangeIncreaseProportion = 0.1;
const maxStaminaIncreaseProportion = 0.2;
const maxHealthIncreaseAmount = 4;
// const manaPerTurnIncreaseAmount = 8;

export const upgradeCardsSource: IUpgrade[] = []

// Template
//   {
//     title: '',
//     description: '',
//     thumbnail: '.png',
//     probability:1
//   },
