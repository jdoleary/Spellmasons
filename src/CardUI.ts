import type * as Player from './Player';
import * as colors from './ui/colors';
import * as Cards from './cards';
import {
  runPredictions,
  updateManaCostUI,
} from './ui/PlanningView';
import { calculateCostForSingleCard } from './cards/cardUtils';
import floatingText, { centeredFloatingText } from './FloatingText';
import { playSFX, sfxPageTurn } from './Audio';
import { composeOnDamageEvents, copyForPredictionUnit } from './Unit';
import { NUMBER_OF_TOOLBAR_SLOTS } from './config';

const elCardHolders = document.getElementById('card-holders') as HTMLElement;
const elInvContent = document.getElementById('inventory-content') as HTMLElement;
const elInvButton = document.getElementById('inventory-icon') as HTMLElement;
// Where the non-selected cards are displayed
const elCardHand = document.getElementById('card-hand') as HTMLElement;
// Where the selected cards are displayed
const elSelectedCards = document.getElementById('selected-cards') as HTMLElement;
// Gap amount must be available programatically (not in css) so it can be
// taken into account in drag-n-drop
const gapBetweenCards = 4;
elCardHand.style['gap'] = `${gapBetweenCards}px`;
elSelectedCards.style['gap'] = `${gapBetweenCards}px`;
const dragstart = (ev: any) => {
  const target = (ev.target as HTMLElement)
  if (target.closest('.card')) {
    dragCard = (target.closest('.card') as HTMLElement)
  } else {
    ev.preventDefault();
  }

}
elInvContent.addEventListener('dragstart', dragstart);
elCardHand.addEventListener('dragstart', dragstart);
elCardHand.addEventListener('dragover', ev => {
  ev.preventDefault();
})
const cardHoldersPaddingLeft = 10;
elCardHolders.style['paddingLeft'] = `${cardHoldersPaddingLeft}px`;
elCardHand.addEventListener('drop', ev => {
  const dropElement = ((ev.target as HTMLElement).closest('.slot') as HTMLElement);
  const dropIndex = dropElement.parentNode ? Array.from(dropElement.parentNode.children).indexOf(dropElement) : -1;
  const cardId = dragCard && dragCard.dataset.cardId
  if (window.player && dropIndex !== -1 && dragCard && cardId !== undefined) {
    const startDragCardIndex = dragCard.parentNode ? Array.from(dragCard.parentNode.children).indexOf(dragCard) : -1;
    if (startDragCardIndex !== -1) {
      // Then the drag card is already in the toolbar and this is a swap between
      // two cards on the toolbar
      const swapCard = window.player.cards[dropIndex] || "";
      window.player.cards[dropIndex] = cardId;
      window.player.cards[startDragCardIndex] = swapCard;
    } else {
      // else a card is being dragged in from inventory
      window.player.cards[dropIndex] = cardId;
    }
    recalcPositionForCards(window.player);
    syncInventory(undefined);
  } else {
    console.error('Something went wrong dragndropping card', dropIndex, dragCard);
  }
  ev.preventDefault();
})
// Displays a full card with info on inspect-mode + hover of card
const elCardInspect = document.getElementById('card-inspect');
addCardInspectHandlers(elCardHand);
addCardInspectHandlers(elInvContent);
function addCardInspectHandlers(cardContainerElement: HTMLElement) {
  if (cardContainerElement) {
    // Show full card on hover
    cardContainerElement.addEventListener('mousemove', (e) => {
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
    cardContainerElement.addEventListener('mouseleave', (e) => {
      clearCurrentlyShownCard();
    });
  } else {
    console.error('Card container element is undefined, cannot add card inspect handlers.')
  }
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
  // Remove all current cards:
  if (elCardHand) {
    elCardHand.innerHTML = '';
  } else {
    console.error('elCardHand is null');
  }

  // Reconcile the elements with the player's hand
  for (let slotIndex = 0; slotIndex < NUMBER_OF_TOOLBAR_SLOTS; slotIndex++) {
    const cardId = player.cards[slotIndex];

    if (cardId) {

      // Create UI element for card
      const card = Cards.allCards[cardId];
      // Note: Some upgrades don't have corresponding cards (such as resurrect)
      if (card) {
        const element = createCardElement(card);
        element.draggable = true;
        element.classList.add('slot');
        // When the user clicks on a card
        addListenersToCardElement(player, element, cardId);
        addToolbarListener(element, slotIndex);
        elCardHand.appendChild(element);

      } else {
        console.log(`No corresponding source card exists for "${cardId}"`);
      }
    } else {
      // Slot is empty
      const element = document.createElement('div');
      element.classList.add('empty-slot', 'slot');
      addToolbarListener(element, slotIndex);
      elCardHand.appendChild(element);
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

    // Create UI element for card
    const card = Cards.allCards[cardId];
    // Note: Some upgrades don't have corresponding cards (such as resurrect)
    if (card) {
      const element = createCardElement(card);
      // When the user clicks on a card
      selectCard(player, element, cardId);
    } else {
      console.log(`No corresponding source card exists for "${cardId}"`);
    }
  }
  updateCardBadges();
}
const openInvClass = 'open-inventory';
export function syncInventory(slotModifyingIndex: number | undefined) {
  if (window.player) {
    // clear contents
    elInvContent.innerHTML = '';

    for (let inventoryCardId of window.player.inventory) {
      const card = Cards.allCards[inventoryCardId];
      if (card) {
        const elCard = createCardElement(card);
        elCard.draggable = true;
        if (slotModifyingIndex !== undefined) {
          elCard.addEventListener('click', (e) => {
            if (window.player) {
              window.player.cards[slotModifyingIndex] = inventoryCardId;
              recalcPositionForCards(window.player)
              // Close inventory
              toggleInventory(undefined, false);
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
            }
          })
        }
        // When the user clicks on a card
        addListenersToCardElement(window.player, elCard, card.id);
        // Show that card is already on toolbar
        if (window.player.cards.includes(inventoryCardId)) {
          elCard.classList.add('inToolbar');
        }
        elInvContent.appendChild(elCard);
      } else {
        console.error('Could not find card for ', inventoryCardId)
      }
    }
    // Add an inventory element to clear the currently selected toolbar item
    if (slotModifyingIndex !== undefined) {
      const elClearSlotModifiyingIndex = createNonCardInventoryElement('toolbar-slot.png', 'Empty');
      elInvContent.appendChild(elClearSlotModifiyingIndex);
      elClearSlotModifiyingIndex.addEventListener('click', () => {
        if (window.player && slotModifyingIndex !== undefined) {
          window.player.cards[slotModifyingIndex] = '';
          recalcPositionForCards(window.player);
          toggleInventory(undefined, false);
        }
      })
    }
  } else {
    console.error('Cannot sync inventory, window.player is undefined');
  }
}
export function toggleInventory(toolbarIndex: number | undefined, forceState: boolean | undefined) {
  document.body.classList.toggle(openInvClass, forceState);
  if (window.player && document.body.classList.contains(openInvClass)) {
    // Create inventory
    syncInventory(toolbarIndex);
  } else {
    // When inventory closes, remove active toolbar element class
    document.querySelectorAll('.active-toolbar-element').forEach(e => e.classList.remove(ACTIVE_TOOLBAR_ELEMENT_CLASSNAME))
  }
}
elInvButton.addEventListener('click', () => {
  toggleInventory(undefined, undefined);

})
const ACTIVE_TOOLBAR_ELEMENT_CLASSNAME = 'active-toolbar-element'
function addToolbarListener(
  element: HTMLElement,
  toolbarIndex: number
) {
  element.addEventListener('contextmenu', (e) => {
    if (element.classList.contains(ACTIVE_TOOLBAR_ELEMENT_CLASSNAME)) {
      // just close the inventory
      toggleInventory(undefined, false);
    } else {
      document.querySelectorAll(`.${ACTIVE_TOOLBAR_ELEMENT_CLASSNAME}`).forEach(el => {
        el.classList.remove(ACTIVE_TOOLBAR_ELEMENT_CLASSNAME);
      })
      // Otherwise open the inventory with the right-clicked element selected
      element.classList.add(ACTIVE_TOOLBAR_ELEMENT_CLASSNAME)
      toggleInventory(toolbarIndex, true);
    }
    e.preventDefault();
    e.stopPropagation();
  });

}
let dragCard: HTMLElement | undefined;
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
    if (cardGroup && cardGroup.children.item(0)) {
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
        centeredFloatingText('Insufficient Health', colors.healthRed);
        deselectLastCard();

      }
    }
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
  if (!player.inventory.includes(card.id)) {
    player.inventory.push(card.id);
    const emptySlotIndex = player.cards.indexOf('');
    if (emptySlotIndex !== -1) {
      player.cards[emptySlotIndex] = card.id;
    }
    recalcPositionForCards(player);
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
  runPredictions();
}
enum CardRarity {
  COMMON,
  SPECIAL,
  UNCOMMON,
  RARE,
  FORBIDDEN
}
function cardProbabilityToRarity(content: { probability: number }): CardRarity {
  if (content.probability == 1) {
    // Super rare
    return CardRarity.FORBIDDEN;
  } else if (content.probability < 5) {
    // Rare
    return CardRarity.RARE;
  } else if (content.probability < 10) {
    // Uncommon
    return CardRarity.UNCOMMON
  } else if (content.probability < 20) {
    // Special
    return CardRarity.SPECIAL;
  } else if (content.probability < 50) {
    // Semi-common
    return CardRarity.COMMON;
  }
  // Highly-common
  return CardRarity.COMMON;
}
export function getCardRarityColor(content: { probability: number }): string {
  const rarity = cardProbabilityToRarity(content);
  switch (rarity) {
    case CardRarity.FORBIDDEN:
      return '#241623';
    case CardRarity.RARE:
      return '#432534';
    case CardRarity.UNCOMMON:
      return '#004e64';
    case CardRarity.SPECIAL:
      return '#19381F';
    case CardRarity.COMMON:
      return '#3b322c'
  }
}
function createNonCardInventoryElement(thumbnailPath: string, titleText: string) {
  const element = document.createElement('div');
  element.classList.add('card');
  const elCardInner = document.createElement('div');
  elCardInner.classList.add('card-inner');
  element.appendChild(elCardInner);
  const thumbHolder = document.createElement('div');
  const thumbnail = document.createElement('img');
  thumbnail.src = 'images/spell/' + thumbnailPath;
  thumbHolder.appendChild(thumbnail);
  thumbHolder.classList.add('card-thumb');
  elCardInner.appendChild(thumbHolder);
  const title = document.createElement('div');
  title.classList.add('card-title');
  title.innerHTML = titleText;
  elCardInner.appendChild(title);
  return element;
}
function createCardElement(content: Cards.ICard) {
  const element = document.createElement('div');
  element.classList.add('card');
  const rarityString = CardRarity[cardProbabilityToRarity(content)]
  if (rarityString) {
    element.classList.add(`rarity-${rarityString.toLowerCase()}`);
  } else {
    console.error('Card does not have rarity string', content);
  }
  element.dataset.cardId = content.id;
  const elCardInner = document.createElement('div');
  elCardInner.classList.add('card-inner');
  elCardInner.style.borderColor = getCardRarityColor(content);
  // elCardInner.style.backgroundColor = getCardRarityColor(content);
  element.appendChild(elCardInner);
  const elCardHotkeyBadgeHolder = document.createElement('div');
  elCardHotkeyBadgeHolder.classList.add('hotkey-badge-holder');
  element.appendChild(elCardHotkeyBadgeHolder);
  const elCardHotkeyBadge = document.createElement('kbd');
  elCardHotkeyBadge.classList.add('hotkey-badge');
  elCardHotkeyBadge.innerHTML = ``;

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
    if (manaCost !== card.manaCost) {
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
    if (healthCost !== card.healthCost) {
      elBadge.classList.add('modified-by-usage')
    } else {
      elBadge.classList.remove('modified-by-usage')
    }
  } else {
    console.warn("Err UI: Found card, but could not find associated health badge element to update mana cost");
  }
}
// Updates the UI mana badge for cards in hand.  To be invoked whenever a player's
// cardUsageCounts object is modified in order to sync the UI
export function updateCardBadges() {
  if (window.player) {
    // Using a prediction unit here so that composeOnDamageEvents
    // used to determine the modified health cost of
    // spells that cost health will not affect the real player unit
    const predictionPlayerUnit = copyForPredictionUnit(window.player.unit);
    // Update selected cards
    const selectedCards = getSelectedCards();
    for (let i = 0; i < selectedCards.length; i++) {
      const card = selectedCards[i];
      if (card) {
        const sliceOfCardsOfSameIdUntilCurrent = selectedCards.slice(0, i).filter(c => c.id == card.id);
        const cost = calculateCostForSingleCard(card, (window.player.cardUsageCounts[card.id] || 0) + sliceOfCardsOfSameIdUntilCurrent.length);
        const elBadges = document.querySelectorAll(`#selected-cards .card[data-card-id="${card.id}"] .card-mana-badge`);
        const elBadge = Array.from(elBadges)[sliceOfCardsOfSameIdUntilCurrent.length];
        if (elBadge) {
          updateManaBadge(elBadge, cost.manaCost, card);
        }
        const elBadgesH = document.querySelectorAll(`#selected-cards .card[data-card-id="${card.id}"] .card-health-badge`);
        const elBadgeH = Array.from(elBadgesH)[sliceOfCardsOfSameIdUntilCurrent.length];
        if (elBadgeH) {
          // onDamageEvents alter the healthCost of cards that cost health to cast
          // such as 'bite', 'vulnerable', or 'shield'
          updateHealthBadge(elBadgeH, composeOnDamageEvents(predictionPlayerUnit, cost.healthCost, true), card);
        }
      }
    }
    // Update cards in hand and inventory
    const cards = Cards.getCardsFromIds(window.player.cards);
    for (let card of cards) {
      const selectedCardElementsOfSameId = document.querySelectorAll(`#selected-cards .card[data-card-id="${card.id}"]`);
      const cost = calculateCostForSingleCard(card, (window.player.cardUsageCounts[card.id] || 0) + selectedCardElementsOfSameId.length);
      const cardManaQueryString = `.card[data-card-id="${card.id}"] .card-mana-badge`;
      const cardHealthQueryString = `.card[data-card-id="${card.id}"] .card-health-badge`;
      const elBadges = Array.from(document.querySelectorAll(`#card-hand ${cardManaQueryString}, #inventory ${cardManaQueryString}`));
      for (let elBadge of elBadges) {
        updateManaBadge(elBadge, cost.manaCost, card);
      }
      const elBadgeHealths = Array.from(document.querySelectorAll(`#card-hand ${cardHealthQueryString}, #inventory ${cardHealthQueryString}`));
      // onDamageEvents alter the healthCost of cards that cost health to cast
      // such as 'bite', 'vulnerable', or 'shield'
      for (let elBadgeHealth of elBadgeHealths) {
        updateHealthBadge(elBadgeHealth, composeOnDamageEvents(predictionPlayerUnit, cost.healthCost, true), card);
      }
    }

    // Update hotkey badges
    if (elCardHand) {
      for (let x = 0; x < elCardHand.children.length && x < 10; x++) {
        // Card hotkeys start being indexed by 1 not 0
        // and the 9th card is accessible by hotkey 0 on the keyboard
        const key = x == 9 ? 0 : x + 1;
        const card = elCardHand.children.item(x) as HTMLElement;
        if (card) {
          const elHotkeyBadge = card.querySelector('.hotkey-badge') as HTMLElement;
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
