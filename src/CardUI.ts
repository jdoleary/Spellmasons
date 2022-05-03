import type * as Player from './Player';
import * as Cards from './cards';
import * as math from './math';
import {
  syncSpellEffectProjection,
  updateManaCostUI,
} from './ui/PlanningView';
import { calculateCostForSingleCard } from './cards/cardUtils';
import floatingText from './FloatingText';
import { mouseMove } from './ui/eventListeners';
import { playSFX, sfxPageTurn } from './Audio';

const elCardHolders = document.getElementById('card-holders') as HTMLElement;
elCardHolders.addEventListener('contextmenu', e => {
  e.preventDefault();
})
// Where the non-selected cards are displayed
const elCardHand = document.getElementById('card-hand') as HTMLElement;
// Where the selected cards are displayed
const elSelectedCards = document.getElementById('selected-cards') as HTMLElement;
// Gap amount must be available programatically (not in css) so it can be
// taken into account in drag-n-drop
const gapBetweenCards = 4;
elCardHand.style['gap'] = `${gapBetweenCards}px`;
elSelectedCards.style['gap'] = `${gapBetweenCards}px`;
elCardHand.addEventListener('dragstart', ev => {
  dragCard = ((ev.target as HTMLElement).closest('.card') as HTMLElement)?.dataset.cardId;

})
elCardHand.addEventListener('dragover', ev => {
  ev.preventDefault();
})
const cardHandPaddingLeft = 10;
elCardHand.style['paddingLeft'] = `${cardHandPaddingLeft}px`;
elCardHand.addEventListener('drop', ev => {
  // const dropCard = ((ev.target as HTMLElement).closest('.card') as HTMLElement)?.dataset.cardId;
  const elCard = document.querySelector('#card-hand .card') as HTMLElement;
  if (dragCard) {
    if (window.player) {
      // Since cards are centered, we can determine which card the dropped card is replacing
      // by only using the size of the cards, the screenWidth, and the drop location on the x axis:
      const cardSize = gapBetweenCards + elCard.clientWidth;
      const cardIndex = Math.floor((ev.clientX - cardHandPaddingLeft + cardSize / 2) / cardSize);
      // Clamp the value to 0 or the maximum length of cards because we will use the index to set the new index of the dragged card
      const clampedIndex = Math.max(0, Math.min(cardIndex, window.player.cards.length));
      const dragCardIndex = window.player.cards.findIndex(c => c == dragCard);
      let dropCardIndex = clampedIndex;
      // If dragCard is to the left of the drop location, must subtract one from the dropCardIndex
      // to get the proper final index since moving the dragCard will shift all cards to the left
      if (dragCardIndex < clampedIndex) {
        dropCardIndex -= 1;
      }
      if (dragCardIndex > dropCardIndex) {
        for (let i = dragCardIndex - 1; i >= dropCardIndex; i--) {
          // Shift all cards over to the right
          const currentCard = window.player.cards[i];
          if (currentCard) {
            window.player.cards[i + 1] = currentCard;
          }
        }
        window.player.cards[dropCardIndex] = dragCard;
        recalcPositionForCards(window.player);
      } else if (dragCardIndex < dropCardIndex) {
        for (let i = dragCardIndex; i < dropCardIndex; i++) {
          // Shift all cards over to the left
          const nextCard = window.player.cards[i + 1]
          if (nextCard) {
            window.player.cards[i] = nextCard
          }
        }
        window.player.cards[dropCardIndex] = dragCard;
        recalcPositionForCards(window.player);
      } else {
        // Do nothing, dropped on same card as drag
      }
    }
  }
  ev.preventDefault();
})
// Displays a full card with info on inspect-mode + hover of card
const elCardInspect = document.getElementById('card-inspect');
if (elCardHolders) {
  // Show full card on hover
  elCardHolders.addEventListener('mousemove', (e) => {
    if (e.target instanceof HTMLElement) {
      const element = e.target?.closest('.card');
      const cardId =
        element instanceof HTMLElement ? element.dataset.cardId || '' : '';
      if (cardId) {
        const card = Cards.allCards[cardId];
        if (card) {
          showFullCard(card);
        } else {
          console.error(`Could not find source card with id "${cardId}"`);
        }
      }
    }
  });
  elCardHolders.addEventListener('mouseleave', (e) => {
    clearCurrentlyShownCard();
  });
}
export function clearCurrentlyShownCard() {
  // Clear cardInspect when the mouse leaves elCardHolders so that the large card
  // doesn't stay in the center of the screen
  if (elCardInspect) {
    elCardInspect.innerHTML = '';
  }
  currentlyShownCardId = '';
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
    } else {
      console.error('card-inspect div does not exist');
    }
  }
}
let cardsSelected: string[] = [];

export function recalcPositionForCards(player: Player.IPlayer | undefined) {
  if (!window.player) {
    return
  }
  if (window.player !== player) {
    // Do not reconcile dom elements for a player who is not the current client's player
    return;
  }
  const cardCountPairs = Object.entries<number>(
    player.cards
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
      const card = Cards.allCards[cardId];
      // Note: Some upgrades don't have corresponding cards (such as resurrect)
      if (card) {
        const element = createCardElement(card);
        element.classList.add(className);
        // When the user clicks on a card
        addListenersToCardElement(player, element, cardId);
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
  for (let cardId of cardsSelected) {
    const className = `card-${cardId}`;

    // Create UI element for card
    const card = Cards.allCards[cardId];
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
  updateCardBadges();
}
let dragCard: string | undefined;
function addListenersToCardElement(
  player: Player.IPlayer,
  element: HTMLElement,
  cardId: string,
) {
  element.addEventListener('mouseenter', () => {
    // Play random pageTurn sound
    const sfxInst = sfxPageTurn[Math.floor(Math.random() * sfxPageTurn.length)]
    sfxInst && playSFX(sfxInst);
  });

  element.addEventListener('click', (e) => {
    e.stopPropagation();
    if (element.classList.contains('selected')) {
      const index = cardsSelected.findIndex((c) => c === cardId);
      if (index !== -1) {
        cardsSelected.splice(index, 1);
        element.remove();
        // Since a new card has been deselected, we must sync the spell
        // effect projection so it will be up to date in the event
        // that the user is hovering over a unit while deselecting this card
        // but hadn't moved the mouse since selecting it
        mouseMove();
        // When a card is deselected, clear the currently shown card
        // so that it doesn't continue to hover over the gameboard
        // for a card that is now deselected
        clearCurrentlyShownCard();
      } else {
        console.log(
          'Attempted to remove card',
          cardId,
          'from selected-cards but it does not exist',
        );
      }
    } else {
      cardsSelected.push(cardId);
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
export function deselectLastCard() {
  if (elSelectedCards) {
    const cardGroup = elSelectedCards.children.item(elSelectedCards.children.length - 1) as HTMLElement;
    if (cardGroup) {
      (cardGroup.children.item(0) as HTMLElement).click();
    } else {
      console.warn(`Cannot deselect last card in selected cards`)
    }
  }

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
function selectCard(player: Player.IPlayer, element: HTMLElement, cardId: string) {
  if (elSelectedCards) {
    const clone = element.cloneNode(true) as HTMLElement;
    // Selected cards are not draggable for rearranging
    clone.draggable = false;
    addListenersToCardElement(player, clone, cardId);
    clone.classList.add('selected');
    const card = Cards.allCards[cardId]
    if (card?.requiresFollowingCard) {
      clone.classList.add('requires-following-card')
    }
    elSelectedCards.appendChild(clone);
    const cost = updateManaCostUI();
    if (window.player) {
      if (cost.manaCost > window.player.unit.mana) {
        floatingText({
          coords: window.player.unit,
          text: 'Insufficient Mana',
          style: { fill: '#5656d5', fontSize: '50px', dropShadow: true, dropShadowDistance: 1 }
        })
        deselectLastCard();

      }
      if (cost.healthCost > window.player.unit.health) {
        floatingText({
          coords: {
            x: window.underworld.width / 2,
            y: window.underworld.height,
          },
          text: 'Insufficient Health',
          style: { fill: '#d55656', fontSize: '50px', dropShadow: true, dropShadowDistance: 1 }
        })
        deselectLastCard();

      }
    }
    // Since a new card has been selected, we must sync the spell
    // effect projection so it will be up to date in the event
    // that the user is hovering over a unit while selecting this card
    // but hadn't moved the mouse since selecting it
    mouseMove();
  } else {
    console.error('elSelectedCards is null');
  }
}
export function areAnyCardsSelected() {
  return !!getSelectedCardIds().length;
}

// This function fully deletes the cards from the player's hand
export function removeCardsFromHand(player: Player.IPlayer, cards: string[]) {
  player.cards = player.cards.filter(c => !cards.includes(c));
  // Remove any selected cards with a name in the cards array of this function
  for (let card of cards) {
    document.querySelectorAll(`#selected-cards .card[data-card-id="${card}"]`).forEach(el => {
      // clicking a selected card, deselects it
      (el as HTMLElement).click();
    });
  }
  recalcPositionForCards(window.player);
}

// TODO remove dev helper function for production release
window.giveMeCard = (cardId: string, quantity: number = 1) => {
  const card = Cards.allCards[cardId];
  if (card) {
    for (let i = 0; i < quantity; i++) {
      addCardToHand(card, window.player);
    }
  } else {
    console.log('card', card, 'not found');
  }
};
export function addCardToHand(card: Cards.ICard | undefined, player: Player.IPlayer | undefined) {
  if (!card) {
    console.error('Attempting to add undefined card to hand');
    return
  }
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

export function getSelectedCardIds(): string[] {
  if (elSelectedCards && elSelectedCards.classList.contains('hide')) {
    return [];
  }
  return Array.from(document.querySelectorAll('.card.selected')).map((el) =>
    el instanceof HTMLElement ? el.dataset.cardId || '' : '',
  );
}
export function getSelectedCards(): Cards.ICard[] {
  const cardIds = getSelectedCardIds();
  return Cards.getCardsFromIds(cardIds);
}

// Currently used only for reading spell details on hover
export function toggleInspectMode(active: boolean) {
  document.body.classList.toggle('inspect-mode', active);
  elSelectedCards && elSelectedCards.classList.toggle('hide', active);
  if (!active) {
    clearCurrentlyShownCard();
  }
}
export function clearSelectedCards() {
  // Deselect all selected cards
  cardsSelected = []
  document.querySelectorAll('.card.selected').forEach((el) => {
    if (el instanceof HTMLElement) {
      el.remove();
    } else {
      console.error(
        'Cannot clearSelectedCards due to selectednode not being the correct type',
      );
    }
  });
  // Now that there are no more selected cards, update the spell effect projection
  syncSpellEffectProjection();
}

export function getCardRarityColor(content: { probability: number }): string {
  if (content.probability == 1) {
    // Super rare
    return '#241623';
  } else if (content.probability < 5) {
    // Rare
    return '#432534';
  } else if (content.probability < 10) {
    // Uncommon
    return '#004e64';
  } else if (content.probability < 20) {
    // Special
    return '#19381F';
  } else if (content.probability < 50) {
    // Semi-common
    return '#3b322c'
  }
  // Highly-common
  return '#191513';
}
function createCardElement(content: Cards.ICard) {
  const element = document.createElement('div');
  element.draggable = true;
  element.classList.add('card');
  element.dataset.cardId = content.id;
  const elCardInner = document.createElement('div');
  elCardInner.classList.add('card-inner');
  elCardInner.style.borderColor = getCardRarityColor(content);
  elCardInner.style.backgroundColor = getCardRarityColor(content);
  element.appendChild(elCardInner);
  const elCardHotkeyBadgeHolder = document.createElement('div');
  elCardHotkeyBadgeHolder.classList.add('hotkey-badge-holder');
  element.appendChild(elCardHotkeyBadgeHolder);
  const elCardHotkeyBadge = document.createElement('kbd');
  elCardHotkeyBadge.classList.add('hotkey-badge');
  elCardHotkeyBadgeHolder.appendChild(elCardHotkeyBadge);
  // Card costs
  const elCardBadgeHolder = document.createElement('div');
  elCardBadgeHolder.classList.add('card-badge-holder');
  element.appendChild(elCardBadgeHolder);
  const elCardManaBadge = document.createElement('div');
  elCardManaBadge.classList.add('card-mana-badge', 'card-badge');
  updateManaBadge(elCardManaBadge, content.manaCost, content);
  elCardBadgeHolder.appendChild(elCardManaBadge);
  const elCardHealthBadge = document.createElement('div');
  elCardHealthBadge.classList.add('card-health-badge', 'card-badge');
  updateHealthBadge(elCardHealthBadge, content.healthCost, content);
  elCardBadgeHolder.appendChild(elCardHealthBadge);
  const thumbHolder = document.createElement('div');
  const thumbnail = document.createElement('img');
  thumbnail.src = 'images/spell/' + content.thumbnail;
  thumbHolder.appendChild(thumbnail);
  thumbHolder.classList.add('card-thumb');
  elCardInner.appendChild(thumbHolder);
  const title = document.createElement('div');
  title.classList.add('card-title');
  title.innerHTML = content.id.split('_').join(' ');
  elCardInner.appendChild(title);
  const desc = document.createElement('div');
  desc.classList.add('card-description');
  if (content.description) {
    desc.innerHTML = content.description;
  }
  elCardInner.appendChild(desc);
  return element;
}
function updateManaBadge(elBadge: Element | null, manaCost: number, card: Cards.ICard) {
  if (elBadge) {
    // Hide badge if no cost
    elBadge.classList.toggle('hidden', manaCost === 0);
    elBadge.innerHTML = manaCost.toString();
    if (manaCost > card.manaCost) {
      elBadge.classList.add('modified-by-usage')
    } else {
      elBadge.classList.remove('modified-by-usage')
    }
  } else {
    console.warn("Err UI: Found card, but could not find associated mana badge element to update mana cost");
  }
}
function updateHealthBadge(elBadge: Element | null, healthCost: number, card: Cards.ICard) {
  if (elBadge) {
    // Hide badge if no cost
    elBadge.classList.toggle('hidden', healthCost === 0);
    elBadge.innerHTML = healthCost.toString();
    if (healthCost > card.healthCost) {
      elBadge.classList.add('modified-by-usage')
    } else {
      elBadge.classList.remove('modified-by-usage')
    }
  } else {
    console.warn("Err UI: Found card, but could not find associated mana badge element to update mana cost");
  }
}
// Updates the UI mana badge for cards in hand.  To be invoked whenever a player's
// cardUsageCounts object is modified in order to sync the UI
export function updateCardBadges() {
  if (window.player) {
    // Update selected cards
    const selectedCards = getSelectedCards();
    for (let i = 0; i < selectedCards.length; i++) {
      const card = selectedCards[i];
      if (card) {
        const sliceOfCardsOfSameIdUntilCurrent = selectedCards.slice(0, i).filter(c => c.id == card.id);
        const cost = calculateCostForSingleCard(card, (window.player.cardUsageCounts[card.id] || 0) + sliceOfCardsOfSameIdUntilCurrent.length);
        const elBadges = document.querySelectorAll(`#selected-cards .card[data-card-id="${card.id}"] .card-mana-badge`);
        const elBadge = Array.from(elBadges.values())[sliceOfCardsOfSameIdUntilCurrent.length];
        if (elBadge) {
          updateManaBadge(elBadge, cost.manaCost, card);
        }
        const elBadgesH = document.querySelectorAll(`#selected-cards .card[data-card-id="${card.id}"] .card-health-badge`);
        const elBadgeH = Array.from(elBadgesH.values())[sliceOfCardsOfSameIdUntilCurrent.length];
        if (elBadgeH) {
          updateHealthBadge(elBadgeH, cost.healthCost, card);
        }
      }
    }
    // Update cards in hand
    const cards = Cards.getCardsFromIds(window.player.cards);
    for (let card of cards) {
      const selectedCardElementsOfSameId = document.querySelectorAll(`#selected-cards .card[data-card-id="${card.id}"]`);
      const cost = calculateCostForSingleCard(card, (window.player.cardUsageCounts[card.id] || 0) + selectedCardElementsOfSameId.length);
      const elBadge = document.querySelector(`#card-hand .card[data-card-id="${card.id}"] .card-mana-badge`);
      updateManaBadge(elBadge, cost.manaCost, card);
      const elBadgeHealth = document.querySelector(`#card-hand .card[data-card-id="${card.id}"] .card-health-badge`);
      updateHealthBadge(elBadgeHealth, cost.healthCost, card);
    }

    // Update hotkey badges
    if (elCardHand) {
      for (let x = 0; x < elCardHand.children.length && x < 10; x++) {
        // Card hotkeys start being indexed by 1 not 0
        // and the 9th card is accessible by hotkey 0 on the keyboard
        const key = x == 9 ? 0 : x + 1;
        const card = elCardHand.children.item(x) as HTMLElement;
        if (card) {
          const elHotkeyBadge = card.querySelector('.hotkey-badge');
          if (elHotkeyBadge) {
            elHotkeyBadge.innerHTML = `${key}`;
          }
        }
      }
    }

  }
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
