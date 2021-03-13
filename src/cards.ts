import * as Spell from './Spell';
import random from 'random';
// Each client gets their own random cards, so the seed the cardRandom number generator with the client's id
const cardRandom = random.clone(window.clientId);
const elCardHolder = document.getElementById('card-holder');
const elCardHand = document.getElementById('card-hand');
interface CardPair {
  card: Card;
  element: HTMLElement;
}
const cardsInHand: CardPair[] = [];
const CARD_WIDTH = 70;
function recalcPositionForCards(mouseX) {
  const cardHandWidth = elCardHand.getBoundingClientRect().width;
  const cardPairsGroupedByType = cardsInHand
    .sort((a, b) => a.card.probability - b.card.probability)
    .reduce<{
      [description: string]: CardPair[];
    }>((group, cardPair) => {
      if (!group[cardPair.card.description]) {
        group[cardPair.card.description] = [];
      }
      group[cardPair.card.description].push(cardPair);
      return group;
    }, {});
  const DISTANCE_BETWEEN_LIKE_CARDS = 4;
  const keys = Object.keys(cardPairsGroupedByType);
  for (let i = 0; i < keys.length; i++) {
    const group = cardPairsGroupedByType[keys[i]];
    for (let j = 0; j < group.length; j++) {
      const cardPair = group[j];
      const proportionXPosition = i / (keys.length - 1);
      const cardBasePositionX =
        proportionXPosition * cardHandWidth - CARD_WIDTH / 2;
      setTransform(cardPair.element, {
        x: cardBasePositionX + j * DISTANCE_BETWEEN_LIKE_CARDS,
        y: 0,
      });
    }
  }
  // How far the mouse is across the screen, 0 is far left, 1.0 is far right
  // const mouseProportionX = mouseX / window.innerWidth;
  // // Recalc positions for all cards
  // for (let i = 0; i < cardsInHand.length; i++) {
  //   const cardEl = cardsInHand[i].element;
  //   const proportionXPosition = i / (cardsInHand.length - 1);
  //   const cardBasePositionX =
  //     proportionXPosition * cardHandWidth - CARD_WIDTH / 2;

  //   // -1.0 to 1.0
  //   const distanceFromMouse =
  //     mouseX - cardBasePositionX - CARD_HAND_MARGIN - CARD_WIDTH / 2;

  //   // "+ 0.5" allows half of the negative threshold to be included and half of the positive threshold
  //   // rather than just the positive side of the threshold
  //   const lerpT = distanceFromMouse / MOUSE_HOVER_DISTANCE_THRESHOLD;
  //   const MOUSE_DISTANCE_MOVER = lerp(-1, 1, lerpT + 0.5);

  //   setTransform(cardEl, {
  //     x: cardBasePositionX + -10 * MOUSE_DISTANCE_MOVER,
  //     y: 0,
  //   });
  // }
}
elCardHand.addEventListener('mousemove', (e) => {
  const x = e.clientX;
  recalcPositionForCards(x);
});
export function clearCards() {
  elCardHolder.innerHTML = '';
}

// This function fully deletes the cards that are 'selected' in the player's hand
export function clearSelectedCards() {
  Spell.clearCurrentSpell();
  for (let i = cardsInHand.length - 1; i >= 0; i--) {
    const cardElement = cardsInHand[i].element;
    if (cardElement.classList.contains('selected')) {
      // Remove card from DOM
      cardElement.remove();
      // Remove card from array
      cardsInHand.splice(i, 1);
    }
  }
  recalcPositionForCards(0);
}

export function addCardToHand(card) {
  const element = createCardElement(card, undefined);
  element.addEventListener('click', (e) => {
    e.stopPropagation();
    if (element.classList.contains('selected')) {
      element.classList.remove('selected');
      // Remove card contents from spell
      Spell.unmodifySpell(card.description);
    } else {
      element.classList.add('selected');
      // Add card contents to spell
      Spell.modifySpell(card.description);
    }
  });
  cardsInHand.push({ card, element });
  elCardHand.appendChild(element);
  // Initialize position with mouse in the middle
  recalcPositionForCards(window.innerWidth / 2);
}
interface Card {
  description: string;
  thumbnail: string;
  probability: number;
}
const modifiers: Card[] = [
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

// Chooses a random card based on the card's probabilities
export function generateCard(): Card {
  // Chooses a random modifier based on their probability
  const maxProbability = modifiers.reduce(
    (maxProbability, current) => current.probability + maxProbability,
    0,
  );
  // Choose random integer within the sum of all the probabilities
  const roll = cardRandom.integer(0, maxProbability);
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
function getCardRarityColor(content: Card): string {
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
function createCardElement(content: Card, id?: string) {
  const element = document.createElement('div');
  element.classList.add('card');
  if (id) {
    element.id = id;
  }
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
