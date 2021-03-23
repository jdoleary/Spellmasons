import type * as Player from './Player';
import * as math from './math';
import { alwaysIds, IUpgrade, upgradeSource } from './Upgrade';
const elCardHand = document.getElementById('card-hand');

const CARD_WIDTH = 70;
const CARD_OFFSET = 4;
export function recalcPositionForCards(player: Player.IPlayer) {
  if (window.player !== player) {
    // Do not reconcile dom elements for a player who is not the current client's player
    return;
  }
  // const cardHandWidth = elCardHand.getBoundingClientRect().width;
  // const DISTANCE_BETWEEN_LIKE_CARDS = 4;
  const cardCountPairs = Object.entries(player.hand);
  // Reconcile the elements with the player's hand
  for (let [cardId, count] of cardCountPairs) {
    const className = `card-${cardId}`;

    const difference =
      count - document.querySelectorAll('.' + className).length;
    const matchingCards = document.querySelectorAll('.' + className);
    for (let i = 0; i < Math.abs(difference); i++) {
      const doRemove = difference < 0;
      if (doRemove) {
        if (matchingCards[i]) {
          matchingCards[i].remove();
        } else {
          console.error(
            "Something went wrong trying to remove a card that doesn't exist",
            i,
            matchingCards,
            className,
          );
          debugger;
        }
      } else {
        // Create UI element for card
        const card = cardSource.find((card) => card.id === cardId);
        // Note: Some upgrades don't have corresponding cards (such as resurrect)
        if (card) {
          const element = createCardElement(card);
          element.classList.add(className);
          // When the user clicks on a card
          element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (element.classList.contains('selected')) {
              element.classList.remove('selected');
              // Remove card contents from spell, (prevent card count from becoming negative, this should not be possible
              // because you cannot remove a card that's not added but Math.max will ensure a count can't be negative
              selectedCardTally[cardId] = Math.max(
                0,
                (selectedCardTally[cardId] || 0) - 1,
              );
            } else {
              element.classList.add('selected');
              // Add card contents to spell
              selectedCardTally[cardId] = (selectedCardTally[cardId] || 0) + 1;
            }
          });
          let elCardTypeGroup = document.getElementById(`holder-${cardId}`);
          if (!elCardTypeGroup) {
            elCardTypeGroup = document.createElement('div');
            elCardTypeGroup.classList.add('card-type-group');
            elCardTypeGroup.id = `holder-${cardId}`;
            elCardHand.appendChild(elCardTypeGroup);
          }
          elCardTypeGroup.appendChild(element);
          // Set the width of the cardtypegroup relative to the number of cards that it holds
          elCardTypeGroup.style.width =
            elCardTypeGroup.childElementCount * CARD_OFFSET + CARD_WIDTH + 'px';
          // Set the position of the card
          setTransform(element, {
            x: elCardTypeGroup.childElementCount * CARD_OFFSET,
            y: 0,
          });
        } else {
          console.log(
            `No corresponding card exists for the "${cardId}" upgrade`,
          );
        }
      }
    }
  }
  // for (let j = 0; j < group.length; j++) {
  //   const card = group[j];
  //   const proportionXPosition = i / (keys.length - 1);
  //   const cardBasePositionX =
  //     proportionXPosition * cardHandWidth - CARD_WIDTH / 2;
  //   setTransform(card.element, {
  //     x: cardBasePositionX + j * DISTANCE_BETWEEN_LIKE_CARDS,
  //     y: 0,
  //   });
  // }
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

  // }
}

// This function fully deletes the cards that are 'selected' in the player's hand
export function removeCardsFromHand(player: Player.IPlayer, cards: CardTally) {
  const cardCountPairs = Object.entries(cards);
  for (let [cardId, count] of cardCountPairs) {
    // Do not remove "always" cards
    if (alwaysIds.includes(cardId)) {
      continue;
    }
    player.hand[cardId] -= count;
  }
  recalcPositionForCards(window.player);
}

export function addCardToHand(card: IUpgrade, player: Player.IPlayer) {
  player.hand[card.id] = (player.hand[card.id] || 0) + 1;
  if (player === window.player) {
    recalcPositionForCards(window.player);
  }
}
export interface CardTally {
  [id: string]: number;
}
let selectedCardTally: CardTally = {};
export function getSelectedCardTally(): CardTally {
  return selectedCardTally;
}

export function clearSelectedCardTally() {
  selectedCardTally = {};
  document.querySelectorAll('.card.selected').forEach((el) => {
    el.classList.remove('selected');
  });
}
export function toString(s?: CardTally) {
  if (!s) {
    return '';
  }
  const strings = [];
  if (s.damage > 0) {
    strings.push(`${s.damage}🔥`);
  }
  if (s.heal > 0) {
    strings.push(`${s.heal}💖`);
  }
  if (s.freeze > 0) {
    strings.push(`${s.freeze}🧊`);
  }
  if (s.chain) {
    strings.push('⚡');
  }
  if (s.area_of_effect > 0) {
    strings.push(`${s.area_of_effect}💣`);
  }
  if (s.shield > 0) {
    strings.push('🛡️');
  }
  return strings.join(' ');
}
// Card "Hook" Modifier Stages
// PreSpell (ex: Swap)
// ModifyTargets (ex: Chain, AOE)
// SingleTargetEffect (ex: Damage, heal)
// Add Modifier (ex: freeze, poison)
// PostSpell
export interface ICard {
  id: string;
  thumbnail: string;
  probability: number;
  isDark?: boolean;
}
const darkCardSource: ICard[] = [
  {
    id: 'obliterate',
    thumbnail: 'images/spell/obliterate.png',
    probability: 1,
    isDark: true,
  },
];
const cardSource: ICard[] = [
  {
    id: 'damage',
    thumbnail: 'images/spell/damage.png',
    probability: 120,
  },
  {
    id: 'heal',
    thumbnail: 'images/spell/heal.png',
    probability: 50,
  },
  {
    id: 'chain',
    thumbnail: 'images/spell/chain.png',
    probability: 10,
  },
  {
    id: 'freeze',
    thumbnail: 'images/spell/freeze.png',
    probability: 20,
  },
  {
    id: 'area_of_effect',
    thumbnail: 'images/spell/aoe.png',
    probability: 10,
  },
  {
    id: 'shield',
    thumbnail: 'images/spell/shield.png',
    probability: 10,
  },
  {
    id: 'trap',
    thumbnail: 'images/spell/trap.png',
    probability: 5,
  },
  {
    id: 'swap',
    thumbnail: 'images/spell/swap.png',
    probability: 3,
  },
  {
    id: 'push',
    thumbnail: 'images/spell/push.png',
    probability: 5,
  },
];

// Chooses a random card based on the card's probabilities
export function generateCard(): ICard {
  return math.chooseObjectWithProbability(cardSource);
}
function getCardRarityColor(content: ICard): string {
  if (content.isDark) {
    return '#000';
  }
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
function createCardElement(content: ICard, id?: string) {
  const element = document.createElement('div');
  element.classList.add('card');
  if (id) {
    element.id = id;
  }
  // element.style.backgroundColor = getCardRarityColor(content);
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
  const infinite = upgradeSource.find((u) => u.id === content.id).infinite;
  desc.innerHTML = (infinite ? '♾️<br/>' : '') + content.id;
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
