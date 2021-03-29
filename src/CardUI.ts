import type * as Player from './Player';
import * as Cards from './Cards';
import * as math from './math';
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
  const cardCountPairs = Object.entries<number>(
    player.cards.reduce<{ [cardId: string]: number }>((tally, cardId) => {
      if (!tally[cardId]) {
        tally[cardId] = 0;
      }
      tally[cardId]++;
      return tally;
    }, {}),
  );
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
        const card = Cards.allCards.find((card) => card.id === cardId);
        // Note: Some upgrades don't have corresponding cards (such as resurrect)
        if (card) {
          const element = createCardElement(card);
          element.classList.add(className);
          // When the user clicks on a card
          element.addEventListener('click', (e) => {
            e.stopPropagation();
            if (element.classList.contains('selected')) {
              element.classList.remove('selected');
            } else {
              element.dataset.order = getSelectedCards().length.toString();
              element.classList.add('selected');
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
        } else {
          console.log(
            `No corresponding card exists for the "${cardId}" upgrade`,
          );
        }
      }
    }
  }
}

// This function fully deletes the cards that are 'selected' in the player's hand
export function removeCardsFromHand(player: Player.IPlayer, cards: string[]) {
  for (let cardToRemove of cards) {
    for (let i = player.cards.length; i >= 0; i--) {
      if (player.cards[i] === cardToRemove) {
        player.cards.splice(i, 1);
      }
    }
  }
  recalcPositionForCards(window.player);
}

export function addCardToHand(card: Cards.ICard, player: Player.IPlayer) {
  player.cards.push(card.id);
  if (player === window.player) {
    recalcPositionForCards(window.player);
  }
}

export function getSelectedCards(): string[] {
  return Array.from(document.querySelectorAll('.card.selected'))
    .sort((a, b) =>
      a instanceof HTMLElement && b instanceof HTMLElement
        ? parseInt(a.dataset.order) - parseInt(b.dataset.order)
        : 0,
    )
    .map((el) => (el instanceof HTMLElement ? el.dataset.cardId : ''));
}

export function clearSelectedCards() {
  document.querySelectorAll('.card.selected').forEach((el) => {
    if (el instanceof HTMLElement) {
      el.dataset.order = '0';
    }
    el.classList.remove('selected');
  });
}

// Chooses a random card based on the card's probabilities
export function generateCard(): Cards.ICard {
  // Excludes dark cards
  return math.chooseObjectWithProbability(
    Cards.allCards.filter((c) => !c.isDark),
  );
}
/*
function getCardRarityColor(content: Cards.ICard): string {
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
}*/
function createCardElement(content: Cards.ICard) {
  const element = document.createElement('div');
  element.classList.add('card');
  element.dataset.cardId = content.id;
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
  desc.innerHTML = content.id;
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
