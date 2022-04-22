import { getCardRarityColor } from './CardUI';
import { NUMBER_OF_UPGRADES_TO_CHOOSE_FROM } from './config';
import { chooseObjectWithProbability } from './math';
import { MESSAGE_TYPES } from './MessageTypes';
import type { IPlayer } from './Player';
export interface IUpgrade {
  title: string;
  description: (player: IPlayer) => string;
  thumbnail: string;
  // The maximum number of copies a player can have of this upgrade
  maxCopies?: number;
  effect: (player: IPlayer) => void;
  // The probability of getting this as an upgrade
  probability: number;
}
// Chooses a random card based on the card's probabilities
export function generateUpgrades(player: IPlayer): IUpgrade[] {
  // Dead players choose special upgrades
  if (!player.unit.alive) {
    return [...upgradeSourceWhenDead];
  }
  let upgrades: IUpgrade[] = [];
  const isAltitudeEven = window.underworld.levelIndex % 2 == 0;
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
  const upgradeList = filteredUpgradeCardsSource.length === 0 || isAltitudeEven ? upgradeStatsSource.filter(filterUpgrades) : filteredUpgradeCardsSource;
  // Clone upgrades for later mutation
  const clonedUpgradeSource = [...upgradeList];
  // Choose from upgrades
  const numberOfCardsToChoose = Math.min(
    NUMBER_OF_UPGRADES_TO_CHOOSE_FROM,
    clonedUpgradeSource.length,
  );
  for (
    let i = 0;
    // limited by the config.NUMBER_OF_UPGRADES_TO_CHOOSE_FROM or the number of cloned
    // upgrades that are left, whichever is less
    i < numberOfCardsToChoose;
    i++
  ) {
    const upgrade = chooseObjectWithProbability(clonedUpgradeSource)
    if (upgrade) {
      const index = clonedUpgradeSource.indexOf(upgrade);
      upgrades = upgrades.concat(clonedUpgradeSource.splice(index, 1));
    } else {
      console.error('could not choose upgrade with probability', clonedUpgradeSource);
    }
  }
  return upgrades;
}
export function createUpgradeElement(upgrade: IUpgrade, player: IPlayer) {
  const element = document.createElement('div');
  element.classList.add('card');
  const elCardInner = document.createElement('div');
  elCardInner.classList.add('card-inner');
  elCardInner.style.borderColor = getCardRarityColor(upgrade);
  elCardInner.style.backgroundColor = getCardRarityColor(upgrade);
  element.appendChild(elCardInner);
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
  desc.innerText = upgrade.description(player);
  elCardInner.appendChild(desc);
  element.addEventListener('click', (e) => {
    // Prevent click from "falling through" upgrade and propagating to vote for overworld level
    e.stopPropagation();
    window.pie.sendData({
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
  },
];
export const upgradeStatsSource: IUpgrade[] = [
  {
    title: '+ Max Health',
    description: (player) =>
      `Increases your max health from ${player.unit.healthMax} to ${player.unit.healthMax + maxHealthIncreaseAmount
      }`,
    thumbnail: 'images/upgrades/plus_max_health.png',
    effect: (player) => {
      player.unit.healthMax += maxHealthIncreaseAmount;
      player.unit.health += maxHealthIncreaseAmount;
    },
    probability: 30,
  },
  {
    title: '+ Max Mana',
    description: (player) =>
      `Increases your mana from ${player.unit.manaMax} to ${player.unit.manaMax + maxManaIncreaseAmount
      }`,
    thumbnail: 'images/upgrades/todo.png',
    effect: (player) => {
      player.unit.manaMax += maxManaIncreaseAmount;
      player.unit.mana += maxManaIncreaseAmount;
    },
    probability: 30,
  },
  {
    title: '+ Mana per turn',
    description: (player) =>
      `Increases your mana per turn from ${player.unit.manaPerTurn} per turn to ${player.unit.manaPerTurn + manaPerTurnIncreaseAmount
      } per turn.`,
    thumbnail: 'images/upgrades/todo.png',
    effect: (player) => {
      player.unit.manaPerTurn += maxManaIncreaseAmount;
    },
    probability: 30,
  },
  {
    title: '+ Max Stamina',
    description: (player) =>
      `Increases your stamina from ${player.unit.staminaMax} to ${player.unit.staminaMax + maxStaminaIncreaseAmount
      }`,
    thumbnail: 'images/spell/walk.png',
    effect: (player) => {
      player.unit.staminaMax += maxStaminaIncreaseAmount;
    },
    probability: 30,
  },
];
const maxManaIncreaseAmount = 20;
const maxStaminaIncreaseAmount = 50;
const maxHealthIncreaseAmount = 5;
const manaPerTurnIncreaseAmount = 5;

export const upgradeCardsSource: IUpgrade[] = []

// Template
//   {
//     title: '',
//     description: '',
//     thumbnail: '.png',
//     probability:1
//   },
