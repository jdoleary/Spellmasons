import * as SpellPool from './SpellPool';
import { lerp } from './math';
const elCardHolder = document.getElementById('card-holder');
const elCardHand = document.getElementById('card-hand');
const cardsInHand: HTMLElement[] = [];
const CARD_WIDTH = 70;
const CARD_HAND_MARGIN = 80;
const MOUSE_HOVER_DISTANCE_THRESHOLD = 400;
function deselectActiveCardsInHand() {
  // Remove previously active card
  document.querySelectorAll('#card-hand .card.active').forEach((el) => {
    el.classList.remove('active');
  });
}
function recalcPositionForCards(mouseX) {
  const cardHandWidth = elCardHand.getBoundingClientRect().width;
  // How far the mouse is across the screen, 0 is far left, 1.0 is far right
  const mouseProportionX = mouseX / window.innerWidth;
  // Recalc positions for all cards
  for (let i = 0; i < cardsInHand.length; i++) {
    const cardEl = cardsInHand[i];
    const proportionXPosition = i / (cardsInHand.length - 1);
    const cardBasePositionX =
      proportionXPosition * cardHandWidth - CARD_WIDTH / 2;

    // -1.0 to 1.0
    const distanceFromMouse =
      mouseX - cardBasePositionX - CARD_HAND_MARGIN - CARD_WIDTH / 2;

    // "+ 0.5" allows half of the negative threshold to be included and half of the positive threshold
    // rather than just the positive side of the threshold
    const lerpT = distanceFromMouse / MOUSE_HOVER_DISTANCE_THRESHOLD;
    const MOUSE_DISTANCE_MOVER = lerp(-1, 1, lerpT + 0.5);

    setTransform(cardEl, {
      x: cardBasePositionX + -10 * MOUSE_DISTANCE_MOVER,
      y: 0,
    });
  }
}
elCardHand.addEventListener('mouseleave', (e) => {
  deselectActiveCardsInHand();
});
elCardHand.addEventListener('mousemove', (e) => {
  deselectActiveCardsInHand();
  const x = e.clientX;
  // const index = Math.floor(cardsInHand.length * mouseProportionX);
  // const card = cardsInHand[index];
  // if (card) {
  //   card.classList.add('active');
  // }
  recalcPositionForCards(x);
});
export function clearCards() {
  elCardHolder.innerHTML = '';
}
// Cards are used for chanelling unique spells each turn.
// Both players are presented with a number of cards and they take turns deciding which to
// add to their chanelling spell orbs
// Todo: unused since rev3 consider removing
// export function generateCards(numberOfCards: number) {
//   for (let i = 0; i < numberOfCards; i++) {
//     const card = generateCard();
//     addSpellModToCardHolder(card, i);
//   }
// }
// @ts-ignore
window.test = () => {
  for (let i = 0; i < 3; i++) {
    const card = generateCard();
    addCardToHand(card);
  }
};
export function clearSelectedCards() {
  SpellPool.clearCurrentSpell();
  for (let i = cardsInHand.length - 1; i >= 0; i--) {
    const cardElement = cardsInHand[i];
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
  element.addEventListener('click', () => {
    console.log('clicked on card in hand', card);
    if (window.game.yourTurn) {
      if (element.classList.contains('selected')) {
        element.classList.remove('selected');
        // Remove card contents from spell
        SpellPool.removeModifierFromSpell(card.description);
      } else {
        element.classList.add('selected');
        // Add card contents to spell
        SpellPool.addModifierToSpell(card.description);
      }
      // window.pie.sendData({
      //   type: MESSAGE_TYPES.CHOOSE_CARD,
      //   id: element.id,
      // });
    }
  });
  cardsInHand.push(element);
  elCardHand.appendChild(element);
  // Initialize position with mouse in the middle
  recalcPositionForCards(window.innerWidth / 2);
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
function createCardElement(content: SpellMod, id?: string) {
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
