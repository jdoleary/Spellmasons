import { NUMBER_OF_UPGRADES_TO_CHOOSE_FROM } from './config';
import { MESSAGE_TYPES } from './MessageTypes';
import type { IPlayer } from './Player';
import makeSeededRandom from './rand';
export interface IUpgrade {
  spellId?: string;
  title: string;
  description: string;
  thumbnail: string;
  // Some upgrades can be chosen more than once
  allowDuplicate?: boolean;
  // Infinite cards never run out...
  // Whereas finite cards (!infinite) are refreshed at the beginning of each level and cannot be used more
  // than the number that the player has per level
  // --
  // When infinite cards are chosen more than once, they affect the base stat, such as "+ base damage"
  infinite?: boolean;
  // A card that a player always has in hand
  always?: boolean;
}
// Chooses a random card based on the card's probabilities
export function generateUpgrades(player: IPlayer): IUpgrade[] {
  // Dead players choose special upgrades
  if (!player.unit.alive) {
    return [...upgradeSourceWhenDead];
  }
  let upgrades = [];
  const random = makeSeededRandom(`${window.clientId}-${window.game.level}`);
  // Clone and filter out non-duplicatable upgrades that the player already has
  const clonedUpgradeSource = [...upgradeSource].filter((u) =>
    u.allowDuplicate
      ? true
      : !player.upgrades.map((pu) => pu.title).includes(u.title),
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
    allowDuplicate: false,
    always: false,
  },
];
export const upgradeSource: IUpgrade[] = [
  {
    spellId: 'damage',
    title: '+ Base Damage',
    description: 'Upgrades base damage',
    thumbnail: 'images/spell/damage.png',
    allowDuplicate: true,
    always: true,
    infinite: true,
  },
  {
    spellId: 'heal',
    title: '+ Base Heal',
    description: 'Upgrades base heal',
    thumbnail: 'images/spell/heal.png',
    allowDuplicate: true,
    always: true,
    infinite: true,
  },
  {
    title: 'Chain',
    description: 'Makes a spell chain between touching units',
    thumbnail: 'images/spell/chain.png',
    allowDuplicate: false,
  },
  {
    title: 'Freeze',
    description: 'Makes the target frozen for one turn',
    thumbnail: 'images/spell/freeze.png',
    allowDuplicate: true,
  },
  {
    title: 'Area of Effect',
    description: 'Makes a spell affect a larger area',
    thumbnail: 'images/spell/aoe.png',
    allowDuplicate: true,
  },
  {
    title: 'Shield',
    description: 'Protects the target from the next damage it recieves',
    thumbnail: 'images/spell/shield.png',
    allowDuplicate: true,
  },
  {
    title: 'Swap',
    description:
      'Swaps the casters location with the target and casts the remainder of the spell on the target',
    thumbnail: 'images/spell/swap.png',
    allowDuplicate: false,
  },
  {
    title: 'Push',
    description: 'Pushes the target away from the caster',
    thumbnail: 'images/spell/push.png',
    allowDuplicate: true,
    infinite: true,
  },
];

// Template
//   {
//     title: '',
//     description: '',
//     thumbnail: 'images/spell/.png',
//     probability:1
//   },
