import makeSeededRandom from './rand';
interface IUpgrade {
  title: string;
  description: string;
  thumbnail: string;
  probability: number;
}
// Chooses a random card based on the card's probabilities
export function generateUpgrades(numberOfUpgrades: number): IUpgrade[] {
  let upgrades = [];
  const random = makeSeededRandom(`${window.clientId}-${window.game.level}`);
  const clonedUpgradeSource = [...upgradeSource];
  // Choose non duplicate upgrades
  for (let i = 0; i < numberOfUpgrades; i++) {
    const randomIndex = random.integer(0, clonedUpgradeSource.length - 1);
    upgrades = upgrades.concat(clonedUpgradeSource.splice(randomIndex, 1));
  }
  return upgrades;
}
export function createUpgradeElement(content: IUpgrade) {
  const element = document.createElement('div');
  element.classList.add('card');
  const elCardInner = document.createElement('div');
  elCardInner.classList.add('card-inner');
  element.appendChild(elCardInner);
  const thumbHolder = document.createElement('div');
  const thumbnail = document.createElement('img');
  thumbnail.src = content.thumbnail;
  thumbHolder.appendChild(thumbnail);
  thumbHolder.classList.add('card-thumb');
  elCardInner.appendChild(thumbHolder);
  const title = document.createElement('h2');
  title.classList.add('card-title');
  title.innerText = content.title;
  elCardInner.appendChild(title);
  const desc = document.createElement('div');
  desc.classList.add('card-description');
  desc.innerText = content.description;
  elCardInner.appendChild(desc);
  element.addEventListener('click', (e) => {
    console.log('Choose upgrade', content.title);
    window.game.moveToNextLevel();
  });
  return element;
}
export const upgradeSource: IUpgrade[] = [
  {
    title: '+ Base Damage',
    description: 'Upgrades base damage',
    thumbnail: 'images/spell/damage.png',
    probability: 1,
  },
  {
    title: 'Chain',
    description: 'Makes a spell chain between touching units',
    thumbnail: 'images/spell/chain.png',
    probability: 1,
  },
  {
    title: 'Freeze',
    description: 'Makes the target frozen for one turn',
    thumbnail: 'images/spell/freeze.png',
    probability: 1,
  },
  {
    title: 'Area of Effect',
    description: 'Makes a spell affect a larger area',
    thumbnail: 'images/spell/aoe.png',
    probability: 1,
  },
  {
    title: 'Shield',
    description: 'Protects the target from the next damage it recieves',
    thumbnail: 'images/spell/shield.png',
    probability: 1,
  },
  {
    title: 'Trap',
    description: 'Creates a latent spell that triggers when it is stepped on',
    thumbnail: 'images/spell/trap.png',
    probability: 1,
  },
  {
    title: 'Swap',
    description:
      'Swaps the casters location with the target and casts the remainder of the spell on the target',
    thumbnail: 'images/spell/swap.png',
    probability: 1,
  },
  {
    title: 'Push',
    description: 'Pushes the target away from the caster',
    thumbnail: 'images/spell/push.png',
    probability: 1,
  },
];

// Template
//   {
//     title: '',
//     description: '',
//     thumbnail: 'images/spell/.png',
//     probability:1
//   },
