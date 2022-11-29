import type * as Player from '../../entity/Player';
import * as colors from './colors';
import * as Cards from '../../cards';
import * as config from '../../config';
import {
  runPredictions,
  updateManaCostUI,
} from '../PlanningView';
import { calculateCostForSingleCard } from '../../cards/cardUtils';
import floatingText, { centeredFloatingText } from '../FloatingText';
import { composeOnDamageEvents, copyForPredictionUnit } from '../../entity/Unit';
import { NUMBER_OF_TOOLBAR_SLOTS } from '../../config';
import Underworld from '../../Underworld';
import { CardCategory, CardRarity, probabilityMap } from '../../types/commonTypes';
import { MESSAGE_TYPES } from '../../types/MessageTypes';
import { explain, EXPLAIN_END_TURN } from '../Explain';
import { Overworld } from '../../Overworld';

const elCardHolders = document.getElementById('card-holders') as HTMLElement;
const elInvContent = document.getElementById('inventory-content') as HTMLElement;
resetInventoryContent();
function resetInventoryContent() {
  if (globalThis.headless) {
    return;
  }
  if (elInvContent) {
    elInvContent.innerHTML = '';
    Object.entries(CardCategory).forEach(([index, category]) => {
      if (!isNaN(parseInt(category.toString()))) {
        // Don't make elements for the enum's number version of the enum values
        return;
      }
      const elLabel = document.createElement('div');
      elLabel.classList.add('category-label');
      elLabel.innerText = i18n(category.toString());
      elLabel.dataset.category = category.toString();
      elInvContent.appendChild(elLabel);
      const el = document.createElement('div');
      el.classList.add('category');
      el.dataset.category = category.toString();
      elInvContent.appendChild(el);
    })
  }

}
const elInvButton = document.getElementById('inventory-icon') as HTMLElement;
// Where the non-selected cards are displayed
const elCardHand = document.getElementById('card-hand') as HTMLElement;
// Where the selected cards are displayed
const elSelectedCards = document.getElementById('selected-cards') as HTMLElement;
// Gap amount must be available programatically (not in css) so it can be
// taken into account in drag-n-drop
const gapBetweenCards = 4;
const dragstart = (ev: any) => {
  const target = (ev.target as HTMLElement)
  if (target.closest('.card')) {
    dragCard = (target.closest('.card') as HTMLElement)
  } else {
    ev.preventDefault();
  }

}
// Displays a full card with info on inspect-mode + hover of card
const elCardInspects = document.querySelectorAll('.card-inspect');
export function setupCardUIEventListeners(overworld: Overworld) {

  if (!globalThis.headless) {
    elInvButton?.addEventListener('click', (e) => {
      // Prevent a click on the inventory button from triggering other click listeners
      // (like casting an active spell)
      e.stopPropagation();
      if (overworld.underworld) {
        toggleInventory(undefined, undefined, overworld.underworld);
      } else {
        console.error('Cannot toggleInventory, underworld is undefined');

      }
    });
    elCardHand.style['gap'] = `${gapBetweenCards}px`;
    elSelectedCards.style['gap'] = `${gapBetweenCards}px`;

    elInvContent.addEventListener('dragstart', dragstart);
    elCardHand.addEventListener('dragstart', dragstart);
    elCardHand.addEventListener('dragover', ev => {
      ev.preventDefault();
    })
    elCardHand.addEventListener('drop', ev => {
      const dropElement = ((ev.target as HTMLElement).closest('.slot') as HTMLElement);
      if (!dropElement) {
        console.warn('Tried to drop spell but dropElement was null. This will happen if user drops spell between slots');
        return;
      }
      const dropIndex = dropElement.parentNode ? Array.from(dropElement.parentNode.children).indexOf(dropElement) : -1;
      const cardId = dragCard && dragCard.dataset.cardId
      if (globalThis.player && dropIndex !== -1 && dragCard && cardId !== undefined) {
        const startDragCardIndex = dragCard.parentNode && dragCard.closest('#card-hand') ? Array.from(dragCard.parentNode.children).indexOf(dragCard) : -1;
        if (startDragCardIndex !== -1) {
          // Then the drag card is already in the toolbar and this is a swap between
          // two cards on the toolbar
          const swapCard = globalThis.player.cards[dropIndex] || "";
          globalThis.player.cards[dropIndex] = cardId;
          globalThis.player.cards[startDragCardIndex] = swapCard;
        } else {
          // else a card is being dragged in from inventory
          globalThis.player.cards[dropIndex] = cardId;
        }
        // Send new card order to server 
        overworld.pie.sendData({
          type: MESSAGE_TYPES.PLAYER_CARDS,
          cards: globalThis.player.cards,
        });
        if (overworld.underworld) {
          recalcPositionForCards(globalThis.player, overworld.underworld);
          syncInventory(undefined, overworld.underworld);
        } else {
          console.error('Cannot drop card on toolbar, underworld is undefined.');
        }
      } else {
        console.error('Something went wrong dragndropping card', dropIndex, dragCard);
      }
      ev.preventDefault();
    })
    addCardInspectHandlers(elCardHand);
    addCardInspectHandlers(elInvContent);
  }
}
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
  if (globalThis.headless) { return; }
  // Clear cardInspect when the mouse leaves elCardHolders so that the large card
  // doesn't stay in the center of the screen
  if (elCardInspects.length) {
    elCardInspects.forEach(el => { el.innerHTML = ''; });
  }
  currentlyShownCardId = '';
}
let currentlyShownCardId = '';
function showFullCard(card: Cards.ICard) {
  // Prevent changing the DOM more than necessary
  if (card.id != currentlyShownCardId) {
    currentlyShownCardId = card.id;
    if (elCardInspects.length) {
      elCardInspects.forEach(el => {
        // Clear previous
        el.innerHTML = '';
        el.appendChild(createCardElement(card));
      });
    } else {
      console.error('card-inspect div does not exist');
    }
  }
}
let cardsSelected: string[] = [];

export function recalcPositionForCards(player: Player.IPlayer | undefined, underworld: Underworld) {
  if (globalThis.headless) { return; }
  if (!globalThis.player) {
    return
  }
  if (!player) {
    return;
  }
  if (globalThis.player !== player) {
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
        addListenersToCardElement(player, element, cardId, underworld);
        addToolbarListener(element, slotIndex, underworld);
        elCardHand.appendChild(element);

      } else {
        console.log(`No corresponding source card exists for "${cardId}"`);
      }
    } else {
      // Slot is empty
      const element = document.createElement('div');
      element.classList.add('empty-slot', 'slot');
      addToolbarListener(element, slotIndex, underworld);
      elCardHand.appendChild(element);
    }
  }
  // Remove all current selected cards
  if (elSelectedCards) {
    elSelectedCards.innerHTML = '';
    manageSelectedCardsParentVisibility();
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
      selectCard(player, element, cardId, underworld);
    } else {
      console.log(`No corresponding source card exists for "${cardId}"`);
    }
  }
  updateCardBadges(underworld);
}
export const openInvClass = 'open-inventory';
export function syncInventory(slotModifyingIndex: number | undefined, underworld: Underworld) {
  if (globalThis.headless) { return; }
  if (globalThis.player) {
    // clear contents
    resetInventoryContent();

    const invCards = globalThis.player.inventory.map(c => Cards.allCards[c]).sort((a, b) => {
      if (!a || !b) {
        return 0;
      } else {
        // Sort cards by probability
        const probabilityDifference = b.probability - a.probability;
        // If probability is identical, sort by mana cost
        if (probabilityDifference == 0) {
          return a.manaCost - b.manaCost;
        } else {
          return probabilityDifference;
        }
      }
    });
    for (let card of invCards) {
      if (card) {
        const inventoryCardId = card.id;
        const elCard = createCardElement(card);
        elCard.draggable = true;
        if (slotModifyingIndex !== undefined) {
          elCard.addEventListener('click', (e) => {
            if (globalThis.player) {
              globalThis.player.cards[slotModifyingIndex] = inventoryCardId;
              recalcPositionForCards(globalThis.player, underworld)
              // Close inventory
              toggleInventory(undefined, false, underworld);
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
            }
          })
        }
        // When the user clicks on a card
        addListenersToCardElement(globalThis.player, elCard, card.id, underworld);
        // Show that card is already on toolbar
        if (globalThis.player.cards.includes(inventoryCardId)) {
          elCard.classList.add('inToolbar');
        }
        const elCategory = elInvContent.querySelector(`.category[data-category="${CardCategory[card.category]}"]`)
        if (elCategory) {
          elCategory.appendChild(elCard);
        } else {
          console.error('Category element not found for', card.category);
        }
      }
    }
    // Make category labels visible if player has at least one card in that category
    invCards.map(c => c ? CardCategory[c.category] : '')
      .map(category => elInvContent.querySelector(`.category-label[data-category="${category}"]`))
      .forEach(el => el?.classList.add('visible'))
    // Add an inventory element to clear the currently selected toolbar item
    if (slotModifyingIndex !== undefined) {
      const elClearSlotModifiyingIndex = createNonCardInventoryElement('toolbar-slot.png', 'Empty');
      if (elClearSlotModifiyingIndex) {
        elInvContent.appendChild(elClearSlotModifiyingIndex);
        elClearSlotModifiyingIndex.addEventListener('click', () => {
          if (globalThis.player && slotModifyingIndex !== undefined) {
            globalThis.player.cards[slotModifyingIndex] = '';
            recalcPositionForCards(globalThis.player, underworld);
            toggleInventory(undefined, false, underworld);
          }
        })
      }
    }
  } else {
    console.error('Cannot sync inventory, globalThis.player is undefined');
  }
}
export function toggleInventory(toolbarIndex: number | undefined, forceState: boolean | undefined, underworld: Underworld) {
  if (globalThis.headless) { return; }
  const inventoryWasOpen = document.body?.classList.contains(openInvClass);
  document.body?.classList.toggle(openInvClass, forceState);
  if (globalThis.player && document.body?.classList.contains(openInvClass)) {
    // Create inventory
    playSFXKey('inventory_open');
    syncInventory(toolbarIndex, underworld);
  } else {
    // If inventory just closed, play sfx
    if (inventoryWasOpen) {
      playSFXKey('inventory_close');
    }
    // When inventory closes, remove active toolbar element class
    document.querySelectorAll('.active-toolbar-element').forEach(e => e.classList.remove(ACTIVE_TOOLBAR_ELEMENT_CLASSNAME))
  }
}
const ACTIVE_TOOLBAR_ELEMENT_CLASSNAME = 'active-toolbar-element'
function addToolbarListener(
  element: HTMLElement,
  toolbarIndex: number,
  underworld: Underworld
) {
  element.addEventListener('contextmenu', (e) => {
    if (element.classList.contains(ACTIVE_TOOLBAR_ELEMENT_CLASSNAME)) {
      // just close the inventory
      toggleInventory(undefined, false, underworld);
    } else {
      document.querySelectorAll(`.${ACTIVE_TOOLBAR_ELEMENT_CLASSNAME}`).forEach(el => {
        el.classList.remove(ACTIVE_TOOLBAR_ELEMENT_CLASSNAME);
      })
      // Otherwise open the inventory with the right-clicked element selected
      element.classList.add(ACTIVE_TOOLBAR_ELEMENT_CLASSNAME)
      toggleInventory(toolbarIndex, true, underworld);
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
  underworld: Underworld
) {
  if (globalThis.headless) {
    return;
  }
  element.addEventListener('click', (e) => {
    e.stopPropagation();
    if (element.classList.contains('selected')) {
      const index = cardsSelected.findIndex((c) => c === cardId);
      if (index !== -1) {
        cardsSelected.splice(index, 1);
        element.remove();
        manageSelectedCardsParentVisibility();
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
      selectCard(player, element, cardId, underworld);
    }
  });
}
export function deselectLastCard() {
  if (globalThis.headless) { return; }
  if (elSelectedCards) {
    const cardGroup = elSelectedCards.children.item(elSelectedCards.children.length - 1) as HTMLElement;
    if (cardGroup) {
      (cardGroup.children.item(0) as HTMLElement).click();
      manageSelectedCardsParentVisibility();
    } else {
      console.warn(`Cannot deselect last card in selected cards`)
    }
  }

}
export function selectCardByIndex(index: number) {
  if (globalThis.headless) { return; }
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
function selectCard(player: Player.IPlayer, element: HTMLElement, cardId: string, underworld: Underworld) {
  if (elSelectedCards) {
    const clone = element.cloneNode(true) as HTMLElement;
    // Selected cards are not draggable for rearranging
    clone.draggable = false;
    // No title for selected cards, icon only
    clone.querySelector('.card-title')?.remove();
    addListenersToCardElement(player, clone, cardId, underworld);
    clone.classList.add('selected');
    const card = Cards.allCards[cardId]
    if (card?.requiresFollowingCard) {
      clone.classList.add('requires-following-card')
    }
    elSelectedCards.appendChild(clone);
    manageSelectedCardsParentVisibility();
    const cost = updateManaCostUI(underworld);
    if (globalThis.player) {
      if (cost.manaCost > globalThis.player.unit.mana) {
        floatingText({
          coords: underworld.getMousePos(),
          text: 'Insufficient Mana',
          style: { fill: colors.errorRed, fontSize: '50px', ...config.PIXI_TEXT_DROP_SHADOW }
        })
        explain(EXPLAIN_END_TURN);
        deselectLastCard();

      }
      if (cost.healthCost > globalThis.player.unit.health) {
        floatingText({
          coords: underworld.getMousePos(),
          text: 'Insufficient Health',
          style: { fill: colors.errorRed, fontSize: '50px', ...config.PIXI_TEXT_DROP_SHADOW }
        })
        deselectLastCard();

      }
    }
  } else {
    console.error('elSelectedCards is null');
  }
}
export function areAnyCardsSelected() {
  if (globalThis.headless) { return false; }
  return !!getSelectedCardIds().length;
}


export function getSelectedCardIds(): string[] {
  if (globalThis.headless) { return []; }
  if (elSelectedCards && elSelectedCards.classList.contains('hide')) {
    return [];
  }
  return Array.from(document.querySelectorAll('#selected-cards .card.selected')).map((el) =>
    el instanceof HTMLElement ? el.dataset.cardId || '' : '',
  );
}
export function getSelectedCards(): Cards.ICard[] {
  if (globalThis.headless) { return []; }
  const cardIds = getSelectedCardIds();
  return Cards.getCardsFromIds(cardIds);
}

export function clearSelectedCards(underworld: Underworld) {
  if (globalThis.headless) { return; }
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
  manageSelectedCardsParentVisibility();
  // Now that there are no more selected cards, update the spell effect projection
  runPredictions(underworld);
}
function manageSelectedCardsParentVisibility() {
  if (elSelectedCards.parentElement) {
    if (elSelectedCards.innerHTML == '') {
      elSelectedCards.parentElement.style.visibility = 'hidden';
    } else {
      elSelectedCards.parentElement.style.visibility = 'visible';
    }
  } else {
    console.error('Unexpected: elSelectedCards has no parent');
  }

}
export function cardRarityAsString(content: { probability: number }): string {
  return CardRarity[cardProbabilityToRarity(content)] || '';
}
function cardProbabilityToRarity(content: { probability: number }): CardRarity {
  if (content.probability == probabilityMap[CardRarity.FORBIDDEN]) {
    return CardRarity.FORBIDDEN;
  } else if (content.probability <= probabilityMap[CardRarity.RARE]) {
    return CardRarity.RARE;
  } else if (content.probability <= probabilityMap[CardRarity.UNCOMMON]) {
    return CardRarity.UNCOMMON
  } else if (content.probability <= probabilityMap[CardRarity.SPECIAL]) {
    return CardRarity.SPECIAL;
  } else if (content.probability <= probabilityMap[CardRarity.COMMON]) {
    return CardRarity.COMMON;
  }
  return CardRarity.COMMON;
}
export function getCardRarityColor(content: { probability: number }): string {
  const rarity = cardProbabilityToRarity(content);
  /*
  // Copy this to css in VSCode to see the colors
.t1 {
  color: #241623;
}

.t2 {
  color: #432534;
}

.t3 {
  color: #004e64;
}

.t4 {
  color: #19381F;
}

.t5 {
  color: #3b322c;
}
  */
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
  if (globalThis.headless) { return; }
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
  title.innerHTML = i18n(titleText);
  elCardInner.appendChild(title);
  return element;
}
function createCardElement(content: Cards.ICard) {
  const element = document.createElement('div');
  element.classList.add('card');
  element.classList.add(cardRarityAsString(content));
  element.dataset.cardId = content.id;
  const elCardInner = document.createElement('div');
  elCardInner.classList.add('card-inner');
  elCardInner.style.borderColor = getCardRarityColor(content);
  // elCardInner.style.backgroundColor = getCardRarityColor(content);
  element.appendChild(elCardInner);
  const elCardHotkeyBadgeHolder = document.createElement('div');
  elCardHotkeyBadgeHolder.classList.add('hotkey-badge-holder');
  element.appendChild(elCardHotkeyBadgeHolder);
  const elCardHotkeyBadge = document.createElement('div');
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
  title.innerHTML = i18n(content.id.split('_').join(' '));
  elCardInner.appendChild(title);
  const rarityText = document.createElement('div');
  rarityText.classList.add('card-rarity')
  rarityText.style.color = getCardRarityColor(content);
  rarityText.innerHTML = cardRarityAsString(content).toLocaleLowerCase();
  elCardInner.appendChild(rarityText);
  const desc = document.createElement('div');
  desc.classList.add('card-description');
  if (content.description) {
    desc.innerHTML = content.description.trimStart();
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
export function updateCardBadges(underworld: Underworld) {
  if (globalThis.headless) { return; }
  if (globalThis.player) {
    // Using a prediction unit here so that composeOnDamageEvents
    // used to determine the modified health cost of
    // spells that cost health will not affect the real player unit
    const predictionPlayerUnit = copyForPredictionUnit(globalThis.player.unit, underworld);
    // Update selected cards
    const selectedCards = getSelectedCards();
    for (let i = 0; i < selectedCards.length; i++) {
      const card = selectedCards[i];
      if (card) {
        const sliceOfCardsOfSameIdUntilCurrent = selectedCards.slice(0, i).filter(c => c.id == card.id);
        const cost = calculateCostForSingleCard(card, (globalThis.player.cardUsageCounts[card.id] || 0) + sliceOfCardsOfSameIdUntilCurrent.length * card.expenseScaling);
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
          updateHealthBadge(elBadgeH, composeOnDamageEvents(predictionPlayerUnit, cost.healthCost, underworld, true), card);
        }
      }
    }
    // Update cards in hand and inventory
    const cards = Cards.getCardsFromIds(globalThis.player.cards);
    const badgesById: { [cardId: string]: { mana: HTMLElement[], health: HTMLElement[] } } = {}
    function populateBadgesById(attr: 'mana' | 'health') {
      Array.from(document.querySelectorAll(`#card-hand .card .card-${attr}-badge, #inventory-content .card .card-${attr}-badge`)).forEach((badge) => {
        const cardEl = badge.closest('.card') as (HTMLElement | undefined);
        if (cardEl) {
          const cardId = cardEl.dataset.cardId;
          if (cardId !== undefined) {
            let badgeRecord = badgesById[cardId]
            if (!badgeRecord) {
              badgeRecord = {
                mana: [],
                health: []
              }
              badgesById[cardId] = badgeRecord;
            }
            badgeRecord[attr].push(badge as HTMLElement);
          }

        }
      });
    }
    populateBadgesById('mana');
    populateBadgesById('health');
    for (let card of cards) {
      const selectedCardElementsOfSameId = selectedCards.filter(c => c.id == card.id);
      const cost = calculateCostForSingleCard(card, (globalThis.player.cardUsageCounts[card.id] || 0) + selectedCardElementsOfSameId.length * card.expenseScaling);
      const badgeRecord = badgesById[card.id];
      if (badgeRecord) {
        for (let elBadge of badgeRecord.mana) {
          updateManaBadge(elBadge, cost.manaCost, card);
        }
        // onDamageEvents alter the healthCost of cards that cost health to cast
        // such as 'bite', 'vulnerable', or 'shield'
        for (let elBadgeHealth of badgeRecord.health) {
          updateHealthBadge(elBadgeHealth, composeOnDamageEvents(predictionPlayerUnit, cost.healthCost, underworld, true), card);
        }
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
