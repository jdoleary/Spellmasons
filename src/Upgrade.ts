import { NUMBER_OF_UPGRADES_TO_CHOOSE_FROM } from './config';
import { MESSAGE_TYPES } from './MessageTypes';
import * as config from './config';
import * as CardUI from './CardUI';
import { checkForGetCardOnTurn, IPlayer } from './Player';
import makeSeededRandom from './rand';
export interface IUpgrade {
  title: string;
  description: string;
  thumbnail: string;
  // The maximum number of copies a player can have of this upgrade
  maxCopies?: number;
  effect: (player: IPlayer) => void;
}
// Chooses a random card based on the card's probabilities
export function generateUpgrades(player: IPlayer): IUpgrade[] {
  // Dead players choose special upgrades
  if (!player.unit.alive) {
    return [...upgradeSourceWhenDead];
  }
  let upgrades = [];
  const random = makeSeededRandom(`${window.clientId}-${window.game.level}`);
  // Clone upgrades for later mutation
  const clonedUpgradeSource = [...upgradeSource].filter((u) =>
    u.maxCopies === undefined
      ? // Always include upgrades that don't have a specified maxCopies
        true
      : // Filter out  upgrades that the player can't have more of
        player.upgrades.filter((pu) => pu.title === u.title).length <
        u.maxCopies,
  );
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
    const randomIndex = random.integer(0, clonedUpgradeSource.length - 1);
    upgrades = upgrades.concat(clonedUpgradeSource.splice(randomIndex, 1));
  }
  return upgrades;
}
export function createUpgradeElement(upgrade: IUpgrade) {
  const element = document.createElement('div');
  element.classList.add('card');
  const elCardInner = document.createElement('div');
  elCardInner.classList.add('card-inner');
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
  desc.innerText = upgrade.description;
  elCardInner.appendChild(desc);
  element.addEventListener('click', (e) => {
    window.pie.sendData({
      type: MESSAGE_TYPES.CHOOSE_UPGRADE,
      upgrade,
    });
  });
  return element;
}
export const upgradeSourceWhenDead: IUpgrade[] = [
  {
    title: 'Resurrect',
    description:
      'You have died, but find yourself resurrected as your allies enter the portal.',
    thumbnail: 'images/spell/resurrect.png',
    // Resurrection happens automatically at the start of each level
    effect: () => {},
  },
];
export const upgradeSource: IUpgrade[] = [
  {
    title: '+ Cast Range',
    description: 'Increases how far away you can cast',
    thumbnail: 'images/upgrades/plus_range.png',
    effect: (player) => player.range++,
  },
  {
    title: '+ Card Frequency',
    description:
      'Decreases the number of turns that it takes to get a new card',
    thumbnail: 'images/upgrades/plus_card_frequency.png',
    maxCopies: config.PLAYER_BASE_TURNS_PER_CARD - 1,
    effect: (player) => {
      player.turnsPerCard--;
      // Check if decreasing the turnsPerCard will land on the current turn
      // as being a turn that the player should get a card so that they don't get skipped
      checkForGetCardOnTurn(player);
    },
  },
  {
    title: 'More Cards',
    description: `Gives you ${config.UPGRADE_MORE_CARDS_AMOUNT} more cards immediately`,
    thumbnail: 'images/upgrades/more_cards.png',
    effect: (player) => {
      for (let i = 0; i < config.UPGRADE_MORE_CARDS_AMOUNT; i++) {
        const card = CardUI.generateCard();
        CardUI.addCardToHand(card, player);
      }
    },
  },
];

// Template
//   {
//     title: '',
//     description: '',
//     thumbnail: 'images/spell/.png',
//     probability:1
//   },
