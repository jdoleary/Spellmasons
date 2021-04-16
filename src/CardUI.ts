import type * as Player from './Player';
import * as Cards from './cards';
import * as math from './math';
import {
  clearSpellEffectProjection,
  syncSpellEffectProjection,
} from './ui/GameBoardInput';
const elCardHand = document.getElementById('card-hand');
const elSelectedCards = document.getElementById('selected-cards');
const elInspectorTooltip = document.getElementById('inspector-tooltip');

export function recalcPositionForCards(player: Player.IPlayer) {
  if (window.player !== player) {
    // Do not reconcile dom elements for a player who is not the current client's player
    return;
  }
  const cardCountPairs = Object.entries<number>(
    player.cards
      .sort(
        (a, b) =>
          Cards.allCards.findIndex((card) => card.id === a) -
          Cards.allCards.findIndex((card) => card.id === b),
      )
      .reduce<{ [cardId: string]: number }>((tally, cardId) => {
        if (!tally[cardId]) {
          tally[cardId] = 0;
        }
        tally[cardId]++;
        return tally;
      }, {}),
  );
  // Remove all current cards:
  if (elCardHand) {
    elCardHand.innerHTML = '';
  } else {
    console.error('elCardHand is null');
  }

  // Reconcile the elements with the player's hand
  for (let [cardId, count] of cardCountPairs) {
    const className = `card-${cardId}`;

    for (let i = 0; i < count; i++) {
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
            moveCardFromSelectedToHand(element, cardId);
          } else {
            if (elSelectedCards) {
              elSelectedCards.appendChild(element);
            } else {
              console.error('elSelectedCards is null');
            }
            element.classList.add('selected');
          }
        });
        let elCardTypeGroup = document.getElementById(`holder-${cardId}`);
        if (!elCardTypeGroup) {
          elCardTypeGroup = makeCardTypeGroup(cardId);
        }
        elCardTypeGroup.appendChild(element);
      } else {
        console.log(`No corresponding card exists for the "${cardId}" upgrade`);
      }
    }
  }
}
function makeCardTypeGroup(cardId: string): HTMLDivElement {
  const elCardTypeGroup = document.createElement('div');
  elCardTypeGroup.classList.add('card-type-group');
  elCardTypeGroup.id = `holder-${cardId}`;
  if (elCardHand) {
    elCardHand.appendChild(elCardTypeGroup);
  } else {
    console.error('elCardHand is null');
  }
  return elCardTypeGroup;
}
function moveCardFromSelectedToHand(element: HTMLElement, cardId: string) {
  let elCardTypeGroup = document.getElementById(`holder-${cardId}`);
  if (!elCardTypeGroup) {
    elCardTypeGroup = makeCardTypeGroup(cardId);
  }
  elCardTypeGroup.appendChild(element);
  element.classList.remove('selected');
}

// This function fully deletes the cards that are 'selected' in the player's hand
export function removeCardsFromHand(player: Player.IPlayer, cards: string[]) {
  cardLoop: for (let cardToRemove of cards) {
    for (let i = player.cards.length - 1; i >= 0; i--) {
      if (player.cards[i] === cardToRemove) {
        player.cards.splice(i, 1);
        continue cardLoop;
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
  if (elSelectedCards && elSelectedCards.classList.contains('hide')) {
    return [];
  }
  return Array.from(document.querySelectorAll('.card.selected')).map((el) =>
    el instanceof HTMLElement ? el.dataset.cardId || '' : '',
  );
}

export function toggleInspectMode(active: boolean) {
  elSelectedCards && elSelectedCards.classList.toggle('hide', active);
  elInspectorTooltip && elInspectorTooltip.classList.toggle('active', active);
  syncSpellEffectProjection();
}
export function clearSelectedCards() {
  // Remove the board highlight
  clearSpellEffectProjection();
  // Deselect all selected cards
  document.querySelectorAll('.card.selected').forEach((el) => {
    if (el instanceof HTMLElement) {
      moveCardFromSelectedToHand(el, el.dataset.cardId || '');
    } else {
      console.error(
        'Cannot clearSelectedCards due to selectednode not being the correct type',
      );
    }
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
  thumbnail.src = 'images/' + content.thumbnail;
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
