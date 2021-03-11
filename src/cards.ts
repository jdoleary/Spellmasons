import { MESSAGE_TYPES } from './MessageTypes';
import { addModifierToSpell } from './SpellPool';
const elCardHolder = document.getElementById('card-holder');
const elCardHand = document.getElementById('card-hand');
const cardsInHand: HTMLElement[] = [];
elCardHand.addEventListener('mousemove', (e) => {
  // Remove previously active card
  document.querySelectorAll('#card-hand .card.active').forEach((el) => {
    el.classList.remove('active');
  });
  const x = e.clientX;
  const proportionX = x / window.innerWidth;
  const index = Math.floor(cardsInHand.length * proportionX);
  const card = cardsInHand[index];
  if (card) {
    card.classList.add('active');
  }
});
export function clearCards() {
  elCardHolder.innerHTML = '';
}
// Cards are used for chanelling unique spells each turn.
// Both players are presented with a number of cards and they take turns deciding which to
// add to their chanelling spell orbs
export function generateCards(numberOfCards: number) {
  const cards = [];
  for (let i = 0; i < numberOfCards; i++) {
    const card = generateCard();
    const el = makeCardElement(card, i);
    elCardHolder.appendChild(el);
    cards.push(el);
  }
}
// @ts-ignore
window.test = () => {
  for (let i = 0; i < 20; i++) {
    const card = generateCard();
    addCardToHand(card);
  }
};

export function addCardToHand(card) {
  // TODO refactor effect of index for use in card hand, not just in card holder where cards are initially picked
  const el = makeCardElement(card, 0);
  cardsInHand.push(el);
  elCardHand.appendChild(el);
  // Recalc positions for all cards
  for (let i = 0; i < cardsInHand.length; i++) {
    const cardEl = cardsInHand[i];
    const percentXPosition = i / cardsInHand.length;
    setTransform(cardEl, { x: percentXPosition * window.innerWidth, y: 0 });
  }
}
interface SpellMod {
  description: string;
  thumbnail: string;
  probability: number;
}
const modifiers: SpellMod[] = [
  {
    description: 'Damage',
    thumbnail: 'images/spell/damage.png',
    probability: 100,
  },
  {
    description: 'Heal',
    thumbnail: 'images/spell/heal.png',
    probability: 50,
  },
  {
    description: 'Chain',
    thumbnail: 'images/spell/chain.png',
    probability: 10,
  },
  {
    description: 'Freeze',
    thumbnail: 'images/spell/freeze.png',
    probability: 20,
  },
  {
    description: 'AOE',
    thumbnail: 'images/spell/aoe.png',
    probability: 10,
  },
];
function generateCard() {
  // Chooses a random modifier based on their probability
  const maxProbability = modifiers.reduce(
    (maxProbability, current) => current.probability + maxProbability,
    0,
  );
  // Choose random integer within the sum of all the probabilities
  const roll = window.random.integer(0, maxProbability);
  let rollingLowerBound = 0;
  // Iterate each modifier and check if the roll is between the lower bound and the upper bound
  // which means that the current mod would have been rolled
  for (let mod of modifiers) {
    if (
      roll >= rollingLowerBound &&
      roll <= mod.probability + rollingLowerBound
    ) {
      return mod;
    } else {
      rollingLowerBound += mod.probability;
    }
  }
  // Logically it should never reach this point
  return modifiers[0];
}
function getCardRarityColor(content: SpellMod): string {
  if (content.probability == 1) {
    // Super rare
    // Purple
    return '#9400FF';
  } else if (content.probability < 5) {
    // Rare
    // Red
    return '#F00';
  } else if (content.probability < 10) {
    // Uncommon
    return 'orange';
  } else if (content.probability < 20) {
    // Special
    return 'green';
  } else if (content.probability < 50) {
    // Semi-common
    return 'blue';
  }
  // Highly-common
  // White
  return '#FFF';
}
function makeCardElement(content: SpellMod, index: number) {
  const element = document.createElement('div');
  element.classList.add('card');
  element.id = 'card-' + index;
  element.style.backgroundColor = getCardRarityColor(content);
  const elCardInner = document.createElement('div');
  elCardInner.classList.add('card-inner');
  element.appendChild(elCardInner);
  const thumbHolder = document.createElement('div');
  const thumbnail = document.createElement('img');
  thumbnail.src = content.thumbnail;
  thumbHolder.appendChild(thumbnail);
  thumbHolder.classList.add('card-thumb');
  elCardInner.appendChild(thumbHolder);
  const desc = document.createElement('div');
  desc.classList.add('card-description');
  desc.innerText = content.description;
  elCardInner.appendChild(desc);
  element.addEventListener('click', () => {
    if (window.game.yourTurn) {
      if (element.classList.contains('disabled')) {
        // You cannot select disabled cards
        return;
      }
      // Add card contents to spell:
      addModifierToSpell(content.description);
      // Send the selection to the other player
      window.pie.sendData({
        type: MESSAGE_TYPES.CHOOSE_CARD,
        id: element.id,
      });
    }
  });
  return element;
}
function setTransform(element: HTMLElement, transform: any) {
  const newTransform =
    'translate(' +
    transform.x +
    'px, ' +
    transform.y +
    'px) rotate(' +
    (transform.rotation || 0) +
    'deg)';
  element.style.transform = newTransform;
}
