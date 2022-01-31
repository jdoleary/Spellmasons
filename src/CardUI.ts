import type * as CardUI from './Player';
import * as Cards from './cards';
import * as math from './math';
import {
  clearSpellEffectProjection,
  syncSpellEffectProjection,
  updateTooltipContent,
  updateTooltipPosition,
} from './ui/PlanningView';
const elCardHolders = document.getElementById('card-holders');
// Where the non-selected cards are displayed
const elCardHand = document.getElementById('card-hand');
// Where the selected cards are displayed
const elSelectedCards = document.getElementById('selected-cards');
// Displays a full card with info on shift+hover of card
const elCardInspect = document.getElementById('card-inspect');
// A tooltip that shows information for stuff on the gameboard on Shift+hoverk
const elInspectorTooltip = document.getElementById('inspector-tooltip');
if (elCardHolders) {
  // Show full card on hover
  elCardHolders.addEventListener('mousemove', (e) => {
    if (e.target instanceof HTMLElement) {
      const element = e.target?.closest('.card');
      const cardId =
        element instanceof HTMLElement ? element.dataset.cardId || '' : '';
      if (cardId) {
        const card = Cards.allCards.find((card) => card.id === cardId);
        if (card) {
          showFullCard(card);
        } else {
          console.error(`Could not find source card with id "${cardId}"`);
        }
      }
    }
  });
  elCardHolders.addEventListener('mouseleave', (e) => {
    // Clear cardInspect when the mouse leaves elCardHolders so that the large card
    // doesn't stay in the center of the screen
    if (elCardInspect) {
      elCardInspect.innerHTML = '';
      currentlyShownCardId = '';
    }
  });
}
let currentlyShownCardId = '';
function showFullCard(card: Cards.ICard) {
  // Prevent changing the DOM more than necessary
  if (card.id != currentlyShownCardId) {
    currentlyShownCardId = card.id;
    if (elCardInspect) {
      // Clear previous
      elCardInspect.innerHTML = '';
      elCardInspect.appendChild(createCardElement(card));
      const elQuantity = document.createElement('div');
      elQuantity.classList.add('card-quantity');
      if (window.player) {
        elQuantity.innerText = `You have ${[
          ...window.player.cards,
          ...window.player.cardsSelected,
        ].reduce((count, c) => count + (c == card.id ? 1 : 0), 0)} ${card.id
          } in your hand`;
      }
      elCardInspect.appendChild(elQuantity);
    } else {
      console.error('card-inspect div does not exist');
    }
  }
}

export function recalcPositionForCards(player: CardUI.IPlayer | undefined) {
  if (!window.player) {
    return
  }
  if (window.player !== player) {
    // Do not reconcile dom elements for a player who is not the current client's player
    return;
  }
  const cardCountPairs = Object.entries<number>(
    player.cards
      .sort((a, b) => {
        const cardA = Cards.allCards.find((card) => card.id === a);
        const cardB = Cards.allCards.find((card) => card.id === b);
        if (cardA && cardB) {
          // Sort cards by probability
          return cardB.probability - cardA.probability;
        } else {
          return 0;
        }
      })
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
        addClickListenerToCardElement(player, element, cardId);
        let elCardTypeGroup = document.getElementById(`holder-${cardId}`);
        if (!elCardTypeGroup) {
          elCardTypeGroup = makeCardTypeGroup(cardId);
        }
        elCardTypeGroup.appendChild(element);
      } else {
        console.log(`No corresponding source card exists for "${cardId}"`);
      }
    }
  }
  // Remove all current selected cards
  if (elSelectedCards) {
    elSelectedCards.innerHTML = '';
  } else {
    console.error('elSelectedCards is null');
  }
  // Rebuild all the card elements within #selected-cards
  for (let cardId of player.cardsSelected) {
    const className = `card-${cardId}`;

    // Create UI element for card
    const card = Cards.allCards.find((card) => card.id === cardId);
    // Note: Some upgrades don't have corresponding cards (such as resurrect)
    if (card) {
      const element = createCardElement(card);
      element.classList.add(className);
      // When the user clicks on a card
      selectCard(player, element, cardId);
    } else {
      console.log(`No corresponding source card exists for "${cardId}"`);
    }
  }
}
function addClickListenerToCardElement(
  player: CardUI.IPlayer,
  element: HTMLElement,
  cardId: string,
) {
  element.addEventListener('click', (e) => {
    e.stopPropagation();
    if (element.classList.contains('selected')) {
      const index = player.cardsSelected.findIndex((c) => c === cardId);
      if (index !== -1) {
        player.cardsSelected.splice(index, 1);
        deselectCard(element);
      } else {
        console.log(
          'Attempted to remove card',
          cardId,
          'from selected-cards but it does not exist',
        );
      }
    } else {
      player.cardsSelected.push(cardId);
      selectCard(player, element, cardId);
    }
  });
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
function deselectCard(element: HTMLElement) {
  element.remove();
}
export function selectCardByIndex(index: number) {
  if (elCardHand) {
    const cardGroup = elCardHand.children.item(index) as HTMLElement;
    if (cardGroup) {
      (cardGroup.children.item(0) as HTMLElement).click();
    } else {
      console.warn(`Cannot select a card, no card in hand at index ${index}`)
    }
  }
}
// Moves a card element to selected-cards div
function selectCard(player: CardUI.IPlayer, element: HTMLElement, cardId: string) {
  if (elSelectedCards) {
    const clone = element.cloneNode(true) as HTMLElement;
    addClickListenerToCardElement(player, clone, cardId);
    clone.classList.add('selected');
    elSelectedCards.appendChild(clone);
  } else {
    console.error('elSelectedCards is null');
  }
}
export function areAnyCardsSelected() {
  return !!getSelectedCards().length;
}

// TODO: Keep this around for when we have one-use cards
// This function fully deletes the cards that are 'selected' in the player's hand
export function removeCardsFromHand(player: CardUI.IPlayer, cards: string[]) {
  cardLoop: for (let cardToRemove of cards) {
    for (let i = player.cardsSelected.length - 1; i >= 0; i--) {
      if (player.cardsSelected[i] === cardToRemove) {
        player.cardsSelected.splice(i, 1);
        continue cardLoop;
      }
    }
    for (let i = player.cards.length - 1; i >= 0; i--) {
      if (player.cards[i] === cardToRemove) {
        player.cards.splice(i, 1);
        continue cardLoop;
      }
    }
  }
  recalcPositionForCards(window.player);
}

// TODO remove dev helper function for production release
window.giveMeCard = (cardId: string, quantity: number = 1) => {
  const card = Cards.allCards.find((c) => c.id === cardId);
  if (card) {
    for (let i = 0; i < quantity; i++) {
      addCardToHand(card, window.player);
    }
  } else {
    console.log('card', card, 'not found');
  }
};
export function addCardToHand(card: Cards.ICard, player: CardUI.IPlayer | undefined) {
  if (!player) {
    console.warn("Attempted to add cards to a non-existant player's hand")
    return
  }
  // Players may not have more than 1 of a particular card, because now, cards are
  // not removed when cast
  if (!player.cards.includes(card.id)) {
    player.cards.push(card.id);
    if (player === window.player) {
      recalcPositionForCards(window.player);
    }
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

let inspectIntervalId: NodeJS.Timeout | undefined;
export function toggleInspectMode(active: boolean) {
  document.body.classList.toggle('inspect-mode', active);
  elSelectedCards && elSelectedCards.classList.toggle('hide', active);
  elInspectorTooltip && elInspectorTooltip.classList.toggle('active', active);
  syncSpellEffectProjection();
  if (active) {
    // if the "update tooltip interval" is not currently running, start it:
    if (inspectIntervalId == undefined) {
      // updateTooltip runs on an interval so that if a units health changes under the tooltip
      // without the user moving the mouse it will stay up to date.
      inspectIntervalId = setInterval(() => {
        updateTooltipContent();
        updateTooltipPosition();
      }, 60);
    }
  } else {
    // If inspect mode is set to inactive, clear the "update tooltip interval"
    if (inspectIntervalId !== undefined) {
      clearInterval(inspectIntervalId);
      inspectIntervalId = undefined;
    }
  }
}
export function clearSelectedCards() {
  // Remove the board highlight
  clearSpellEffectProjection();
  // Deselect all selected cards
  if (window.player) {
    window.player.cardsSelected = []
  }
  document.querySelectorAll('.card.selected').forEach((el) => {
    if (el instanceof HTMLElement) {
      el.remove();
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
  return math.chooseObjectWithProbability(Cards.allCards);
}
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
}
function createCardElement(content: Cards.ICard) {
  const element = document.createElement('div');
  element.classList.add('card');
  element.dataset.cardId = content.id;
  const elCardInner = document.createElement('div');
  elCardInner.classList.add('card-inner');
  elCardInner.style.borderColor = getCardRarityColor(content);
  element.appendChild(elCardInner);
  const thumbHolder = document.createElement('div');
  const thumbnail = document.createElement('img');
  thumbnail.src = 'images/spell/' + content.thumbnail;
  thumbHolder.appendChild(thumbnail);
  thumbHolder.classList.add('card-thumb');
  elCardInner.appendChild(thumbHolder);
  const title = document.createElement('div');
  title.classList.add('card-title');
  title.innerHTML = content.id;
  elCardInner.appendChild(title);
  const desc = document.createElement('div');
  desc.classList.add('card-description');
  if (content.description) {
    desc.innerHTML = content.description;
  }
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
