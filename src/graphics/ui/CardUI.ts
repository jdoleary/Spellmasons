import type * as Player from '../../entity/Player';
import * as colors from './colors';
import * as Cards from '../../cards';
import * as config from '../../config';
import {
  clearSpellEffectProjection, runPredictions,
} from '../PlanningView';
import { calculateCost, calculateCostForSingleCard, levelsUntilCardIsEnabled } from '../../cards/cardUtils';
import floatingText from '../FloatingText';
import { copyForPredictionUnit } from '../../entity/Unit';
import { NUMBER_OF_TOOLBAR_SLOTS } from '../../config';
import Underworld from '../../Underworld';
import { CardCategory, CardRarity, probabilityMap } from '../../types/commonTypes';
import { MESSAGE_TYPES } from '../../types/MessageTypes';
import { explain, EXPLAIN_END_TURN } from '../Explain';
import { Overworld } from '../../Overworld';
import { resetNotifiedImmune } from '../../cards/immune';
import { keyDown } from './eventListeners';
import { chooseBookmark } from '../../views';
import { chooseOneOfSeeded, getUniqueSeedString, getUniqueSeedStringPerLevel } from '../../jmath/rand';
import seedrandom from 'seedrandom';
import { quantityWithUnit } from '../../cards/util';
import { version } from '../../../package.json';

const elCardHolders = document.getElementById('card-holders') as HTMLElement;
const elInvContent = document.getElementById('inventory-content') as HTMLElement;
let elRunes: HTMLElement | undefined;
resetInventoryContent();
export function resetInventoryContent() {
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
    elRunes = document.createElement('div');
    elRunes.innerHTML = 'Runes';
    elRunes.id = 'runes';
    elInvContent.appendChild(elRunes);
  }

}
export const elInvButton = document.getElementById('inventory-icon') as HTMLElement;
const elBookmarkRunes = document.getElementById('bookmark-runes')
export function tryShowStatPointsSpendable() {
  // Only show glow if player can afford a rune upgrade
  const hasStatPointsToSpend = globalThis.player && globalThis.player.statPointsUnspent >= (globalThis.cheapestAvailableRune || 1);
  if (elInvButton) {
    elInvButton.classList.toggle('goldGlow', hasStatPointsToSpend);
  }
  if (elBookmarkRunes) {
    elBookmarkRunes.classList.toggle('goldGlow', hasStatPointsToSpend);
  }
}
// Where the non-selected cards are displayed
export const elCardHand = document.getElementById('card-hand') as HTMLElement;
export const elFloatingCardHolderLeft = document.getElementById('floating-card-holder-left') as HTMLElement;
export const elFloatingCardHolderRight = document.getElementById('floating-card-holder-right') as HTMLElement;
const cardContainers = [elCardHand, elFloatingCardHolderLeft, elFloatingCardHolderRight];
// Where the selected cards are displayed
const elSelectedCards = document.getElementById('selected-cards') as HTMLElement;
const dragstart = (ev: any) => {
  document.body.classList.toggle('dragging-card', true);
  const target = (ev.target as HTMLElement)
  if (target.closest('.card')) {
    dragCard = (target.closest('.card') as HTMLElement)
  } else {
    ev.preventDefault();
  }

}
const deleteCardFromSlot = (ev: any, overworld: Overworld) => {
  const startDragCardIndex = getStartDragCardIndex();
  if (startDragCardIndex !== -1) {
    if (globalThis.player) {
      globalThis.player.cardsInToolbar[startDragCardIndex] = '';
      if (overworld.underworld) {
        recalcPositionForCards(globalThis.player, overworld.underworld);
        syncInventory(undefined, overworld.underworld);
        overworld.pie.sendData({
          type: MESSAGE_TYPES.PLAYER_CARDS,
          cards: globalThis.player.cardsInToolbar,
        });
      } else {
        console.error('Cannot drop card on toolbar, underworld is undefined.');
      }
      ev.preventDefault();
    }
  }

}
function getStartDragCardIndex(): number {
  if (!dragCard) {
    return -1;
  }
  let startDragCardIndex = dragCard.parentNode && (dragCard.closest('#card-hand') || dragCard.closest('.floating-card-holder')) ? Array.from(dragCard.parentNode.children).indexOf(dragCard) : -1;
  const containerIndexOffset = cardContainers.indexOf(dragCard.parentNode as HTMLElement);
  // Change startDragCardIndex based on which card container it originated from
  if (containerIndexOffset !== -1) {
    startDragCardIndex += NUMBER_OF_TOOLBAR_SLOTS * containerIndexOffset;
  }
  return startDragCardIndex;
}
const drop = (ev: any, overworld: Overworld, startIndex: number) => {
  document.body.classList.toggle('dragging-card', false);
  const dropElement = ((ev.target as HTMLElement).closest('.slot') as HTMLElement);
  if (!dropElement) {
    console.warn('Tried to drop spell but dropElement was null. This will happen if user drops spell between slots');
    return;
  }
  const dropIndex = startIndex + (dropElement.parentNode ? Array.from(dropElement.parentNode.children).indexOf(dropElement) : -1);
  const cardId = dragCard && dragCard.dataset.cardId
  if (globalThis.player && dropIndex !== -1 && dragCard && cardId !== undefined) {
    const startDragCardIndex = getStartDragCardIndex();
    if (startDragCardIndex !== -1) {
      // Then the drag card is already in the toolbar and this is a swap between
      // two cards on the toolbar
      const swapCard = globalThis.player.cardsInToolbar[dropIndex] || "";
      globalThis.player.cardsInToolbar[dropIndex] = cardId;
      globalThis.player.cardsInToolbar[startDragCardIndex] = swapCard;
    } else {
      // else a card is being dragged in from inventory
      globalThis.player.cardsInToolbar[dropIndex] = cardId;
    }
    // Send new card order to server 
    overworld.pie.sendData({
      type: MESSAGE_TYPES.PLAYER_CARDS,
      cards: globalThis.player.cardsInToolbar,
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

    elInvContent.addEventListener('dragstart', dragstart);
    elInvContent.addEventListener('dragend', () => {
      document.body.classList.toggle('dragging-card', false);

    });
    addCardInspectHandlers(elInvContent, overworld);
    for (let i = 0; i < cardContainers.length; i++) {
      const container = cardContainers[i];
      if (container) {
        container.addEventListener('dragstart', dragstart);
        container.addEventListener('dragover', ev => {
          ev.preventDefault();
        });
        container.addEventListener('dragend', ev => {
          document.body.classList.toggle('dragging-card', false);
          // Ensure the drag end is outside of all containers:
          const stillInsideCardContainer = cardContainers.some(c => {
            const rect = c.getBoundingClientRect();
            // Inside bounding rect
            const inside = ev.x > rect.x && ev.x < (rect.x + rect.width)
              // card-hand has a height of 10 and if it's height were larger it would cover the end turn and inventory
              // buttons so instead just set the height to 157 here if the height is detected as 10.
              // Not proud of this fix but I don't have the time to do it properly.  Worth a refactor if i can revisit it.
              // This 'stillInsideCardContainer' check is non critical anyway, it just prevents the rare
              // circumstance where a spell disappears when clicking on it rapidly
              && ev.y > rect.y && ev.y < (rect.y + (rect.height == 10 ? 157 : rect.height));
            return inside;
          });
          if (stillInsideCardContainer) {
            // Do not delete a card from slot if it was let go inside of a card container
            return;
          }
          deleteCardFromSlot(ev, overworld);
          // After a card is removed from toolbar, clear it from showing
          // in the .card-inspect element
          clearCurrentlyShownCard();
        });
        container.addEventListener('drop', ev => drop(ev, overworld, (NUMBER_OF_TOOLBAR_SLOTS) * i));
        addCardInspectHandlers(container, overworld);
      } else {
        console.error('Card container', i, 'does not exist');
      }
    }

    // This elCardHoldersBorder event listener block serves only to make the
    // thin spaces between cards on the toolbar a place where you can safely drop
    // a card without it being deleted (for example if you're trying to move
    // slots but you misclick and release in the border between)
    const elCardHoldersBorder = document.getElementById('card-holders-border');
    if (elCardHoldersBorder) {
      elCardHoldersBorder.addEventListener('dragover', ev => {
        ev.preventDefault();
      });
      elCardHoldersBorder.addEventListener('drop', ev => {
        if (overworld.underworld) {
          // Invoking recalcPositionForCards prevents the dragend event
          recalcPositionForCards(globalThis.player, overworld.underworld);
        }
        ev.preventDefault();
      });
    } else {
      console.error('Unexpected: no card holders border')
    }
  }
}
function addCardInspectHandlers(cardContainerElement: HTMLElement, overworld: Overworld) {
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
            showFullCard(card, overworld.underworld);
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
function showFullCard(card: Cards.ICard, underworld?: Underworld) {
  // Prevent changing the DOM more than necessary
  if (card.id != currentlyShownCardId) {
    currentlyShownCardId = card.id;
    if (elCardInspects.length) {
      elCardInspects.forEach(el => {
        // Clear previous
        el.innerHTML = '';
        el.appendChild(createCardElement(card, underworld, true));
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
  for (let container of cardContainers) {
    if (container) {
      container.innerHTML = '';
    } else {
      console.error('card container is null');
    }
  }

  // Reconcile the elements with the player's hand
  // *3: for extra toolbar slots
  for (let slotIndex = 0; slotIndex < NUMBER_OF_TOOLBAR_SLOTS * 3; slotIndex++) {
    const cardId = player.cardsInToolbar[slotIndex];
    const container = cardContainers[Math.floor(slotIndex / NUMBER_OF_TOOLBAR_SLOTS)];
    if (container) {

      if (cardId) {

        // Create UI element for card
        const card = Cards.allCards[cardId];
        // Note: Some upgrades don't have corresponding cards (such as resurrect)
        if (card) {
          const element = createCardElement(card, underworld);
          element.draggable = true;
          element.classList.add('slot');
          // When the user clicks on a card
          addListenersToCardElement(player, element, cardId, underworld);
          addToolbarListener(element, slotIndex, underworld);
          container.appendChild(element);

        } else {
          console.log(`No corresponding source card exists for "${cardId}"`);
        }
      } else {
        // Slot is empty
        const element = document.createElement('div');
        element.classList.add('empty-slot', 'slot');
        addToolbarListener(element, slotIndex, underworld);
        container.appendChild(element);
      }
    } else {
      console.error('No card container for slotIndex', slotIndex);
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
      const element = createCardElement(card, underworld);
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
    renderRunesMenu(underworld);
    // Get list of cards that have been replaced by more advanced cards to hide them in inventory
    // The reason they are not removed entirely is because the number of cards in the inventory determines
    // how many new cards the player gets to pick in the next upgrade relative to progress in the underworld,
    // so removing them would give the player extra, undesired upgrades.
    const cards = Cards.getCardsFromIds(globalThis.player.inventory);
    let replacedCards = cards.flatMap(card => card.replaces || []);
    if (adminMode && isSuperMe) {
      // Don't replace any cards given by superMe because superMe
      // is made to allow an admin to test out all cards
      replacedCards = [];
    }
    const allCardsIdsInOrder = globalThis.allCards ? Object.keys(globalThis.allCards) : undefined;
    const invCards = globalThis.player.inventory
      // .filter: Hide replaced cards in inventory
      .filter(cardId => !replacedCards.includes(cardId))
      .map(c => Cards.allCards[c])
      .sort((a, b) => {
        if (!a || !b) {
          return 0;
        } else {
          if (allCardsIdsInOrder) {
            // Sort cards by the order that they are added to allCards
            // This is so that like cards show up near each other, like all arrow spells
            // are colocated
            return allCardsIdsInOrder.indexOf(a.id) - allCardsIdsInOrder.indexOf(b.id);
          } else {
            // This is backup, allCardIdsInOrder should definitely exist

            // Sort cards by probability
            const probabilityDifference = b.probability - a.probability;
            // If probability is identical, sort by mana cost
            if (probabilityDifference == 0) {
              return a.manaCost - b.manaCost;
            } else {
              return probabilityDifference;
            }
          }
        }
      });
    for (let card of invCards) {
      if (card) {
        const inventoryCardId = card.id;
        const elCard = createCardElement(card, underworld);
        elCard.draggable = true;
        if (slotModifyingIndex !== undefined) {
          elCard.addEventListener('click', (e) => {
            if (globalThis.player) {
              globalThis.player.cardsInToolbar[slotModifyingIndex] = inventoryCardId;
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
        if (globalThis.player.cardsInToolbar.includes(inventoryCardId)) {
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
    const categories = Array.from(new Set(invCards.map(c => c ? CardCategory[c.category] : '')));
    categories.map(category => elInvContent.querySelector(`.category-label[data-category="${category}"]`))
      .forEach(el => el?.classList.add('visible'))
    // Disable bookmarks for categories that are empty:
    document.querySelectorAll('.bookmark').forEach(el => (el as HTMLElement).classList.toggle('disabled', true));
    categories.forEach(category => document.getElementById(`bookmark-${category.toLowerCase()}`)?.classList.toggle('disabled', false));
    // All bookmark is always enabled
    document.getElementById('bookmark-all')?.classList.toggle('disabled', false);
    // Runes bookmark is always enabled
    document.getElementById('bookmark-runes')?.classList.toggle('disabled', false);
    // Add an inventory element to clear the currently selected toolbar item
    if (slotModifyingIndex !== undefined) {
      const elClearSlotModifiyingIndex = createNonCardInventoryElement('toolbar-slot.png', 'Empty');
      if (elClearSlotModifiyingIndex) {
        elInvContent.appendChild(elClearSlotModifiyingIndex);
        elClearSlotModifiyingIndex.addEventListener('click', () => {
          if (globalThis.player && slotModifyingIndex !== undefined) {
            globalThis.player.cardsInToolbar[slotModifyingIndex] = '';
            recalcPositionForCards(globalThis.player, underworld);
            toggleInventory(undefined, false, underworld);
          }
        })
      }
    }
  }
}
export function renderRunesMenu(underworld: Underworld) {
  if (!elRunes) {
    console.error('No elRunes for showing rune upgrades');
    return;
  }
  if (!globalThis.player) {
    console.error("Cannot render runesMenu, no globalThis.player");
    return;
  }
  let listOfRemainingRunesToChoose = Object.entries(Cards.allModifiers).flatMap(([key, modifier]) => {
    if (modifier.costPerUpgrade && !modifier.constant) {
      return [{ key, ...modifier }];
    } else {
      return [];
    }
  })

  const constantRunes: string[] = Object.entries(Cards.allModifiers).flatMap(([key, modifier]) => {
    if (modifier.costPerUpgrade && modifier.constant) {
      return [key];
    } else {
      return [];
    }
  });
  // Start with lockedRunes as chosenRunes so they don't get offered in another place as a duplicate
  const chosenRunes: string[] = []
  // Remove old unlocked level indexes
  globalThis.player.lockedRunes = globalThis.player.lockedRunes.filter(lr => lr.levelIndexUnlocked === undefined || underworld.levelIndex == lr.levelIndexUnlocked);
  for (let i = 0; i < config.RUNES_PER_LEVEL; i++) {
    let chosen: string | undefined;
    // Give a number of attempts to find a non duplicate rune
    for (let attempt = 0; attempt < 100; attempt++) {
      const seed = seedrandom(getUniqueSeedStringPerLevel(underworld, globalThis.player) + `-${i}-${attempt}`);
      // If a rune has been locked in this index, choose it; otherwise choose a seeded random rune
      const previouslyLockedRune = globalThis.player.lockedRunes.find(lr => lr.index === i);
      chosen = previouslyLockedRune ? previouslyLockedRune.key : chooseOneOfSeeded(listOfRemainingRunesToChoose, seed)?.key;
      if (chosen && !chosenRunes.find(cr => cr === chosen)) {
        // Found a unique rune
        chosenRunes.push(chosen);
        break;
      }
    }
  }
  globalThis.cheapestAvailableRune = chosenRunes.reduce<number>((cheapest, current) => {
    const modifier = Cards.allModifiers[current]
    if (modifier?.costPerUpgrade && modifier.costPerUpgrade < cheapest) {
      return modifier.costPerUpgrade
    } else {
      return cheapest;
    }
  }, Infinity);
  const statPoints = underworld.perksLeftToChoose(globalThis.player);
  const elStatUpgradeRow = (modifierKey: string, index: number, constant?: boolean) => {
    if (!globalThis.player) {
      return '';
    }
    const modifier = Cards.allModifiers[modifierKey];
    const modifierInstance = globalThis.player.unit.modifiers[modifierKey];
    return `<div class="stat-row flex" data-stat="${modifierKey}">
              <div class="stat-row-left">
                <div class="plus-btn-container" style="color:black"><div class="stat-value" style="color:black">${modifier?.costPerUpgrade !== undefined && `${modifier.costPerUpgrade < 0 ? '+' : ''}${Math.abs(modifier.costPerUpgrade)}sp` || '&nbsp;'}</div></div>
                <div>
                  <div class="rune-name" style="color:black"> </div>
                  <div class="description" style="color:black">
                  ${modifier?.description && i18n(modifier.description)}
                  </div>
                </div>
              </div>
              ${constant ? '' : `
                <div class="stat-lock ${globalThis.player.lockedRunes.find(r => r.key === modifierKey && r.levelIndexUnlocked === undefined) ? 'locked' : ''}" data-key="${modifierKey}" data-index="${index}"></div>
              `}
            </div>`;
  }
  elRunes.innerHTML = `
<div class="pick-stats">
  <div class="card-inner flex" style="color:black">
  <div class="stat-row-holder">
  <div class="stats-constant">
    <h2>${i18n('Skill Points')}: ${statPoints}sp</h2>
    ${constantRunes.map((key, i) => elStatUpgradeRow(key, i, true)).join('')}
  </div>
  <div class="rune-rows">
    ${chosenRunes.flatMap((key, i) => key ? [elStatUpgradeRow(key, i)] : []).join('')}
  </div>
</div>
  </div>
  </div>`;

  elRunes.querySelectorAll('.stat-row').forEach((el, index) => {
    const stat = (el as HTMLElement).dataset.stat;
    if (!stat) {
      return
    }

    const modifier = Cards.allModifiers[stat]
    const playerModifier = globalThis.player?.unit.modifiers[stat];

    const elRuneName = (el as HTMLElement).querySelector('.rune-name');
    const updateRuneName = (hovered: boolean = false) => {
      if (elRuneName) {
        if (['Health', 'Mana', 'Stamina', 'Cast Range'].includes(stat)) {
          // Special handling for basic player stats since they aren't stored as modifiers
          elRuneName.innerHTML = i18n(stat);
          return;
        }
        if (modifier) {
          // Quantity already owned by the player
          const playerRuneQuantity = playerModifier?.quantity || 0;
          // Quantity after buying rune upgrade
          const newQuantity = playerRuneQuantity + (hovered ? (modifier.quantityPerUpgrade || 1) : 0);
          // Change quantity color when hovered for better UX
          const color = hovered ? "green" : "black";

          if (modifier.maxUpgradeCount) {
            const maxRuneQuantity = Cards.getMaxRuneQuantity(modifier);
            // If already maxed, show maxed in black to indicate no change
            if (playerRuneQuantity >= maxRuneQuantity) {
              elRuneName.innerHTML = `${i18n(stat) || ''} ${i18n('Maxed')}`;
              return;
            }
            // If going to max, show maxed in green
            if (newQuantity >= maxRuneQuantity) {
              elRuneName.innerHTML = `${i18n(stat) || ''}  <span>${quantityWithUnit(playerRuneQuantity, modifier.unitOfMeasure)}</span> <span style="color:green"> → ${i18n('Max')} </span>`;
              return;
            }
          }

          // If not going to max, just show new quantity (or nothing if newQuantity is 0)
          elRuneName.innerHTML = `${i18n(stat) || ''}  ${newQuantity ? `${playerRuneQuantity === 0 ? '' : `<span>${quantityWithUnit(playerRuneQuantity, modifier.unitOfMeasure)}</span>`}<span style="color:${color}"> ${hovered ? ` + ${quantityWithUnit(modifier.quantityPerUpgrade || 1, modifier.unitOfMeasure)}` : ''}</span>` : ''}`
        }
      }
    }
    updateRuneName();

    const elPlusBtnContainer = (el as HTMLElement).querySelector('.plus-btn-container');
    if (elPlusBtnContainer) {
      const elPlusBtn = document.createElement('div');
      elPlusBtn.classList.add('plus-btn', 'small');
      elPlusBtn.style.color = 'white';

      elPlusBtnContainer.appendChild(elPlusBtn);
      const modifier = Cards.allModifiers[stat]
      let isDisabled = false;
      if (modifier) {
        // If cost > points, disable
        if (modifier.costPerUpgrade && modifier.costPerUpgrade > statPoints) {
          isDisabled = true;
        }
        // If player has reached max upgrade count, disable
        if (modifier.maxUpgradeCount) {
          const playerModifier = globalThis.player?.unit.modifiers[stat];
          if (playerModifier) {
            // Factor in quantity per upgrade
            const currentUpgradeCount = playerModifier.quantity / (modifier.quantityPerUpgrade || 1)
            if (currentUpgradeCount >= modifier.maxUpgradeCount) {
              isDisabled = true;
            }
          }
        }
      }
      if (isDisabled) {
        elPlusBtn.classList.add('disabled');
      }

      elPlusBtn.addEventListener('click', () => {
        if (isDisabled) {
          playSFXKey('deny');
        } else {
          underworld.pie.sendData({
            type: MESSAGE_TYPES.CHOOSE_RUNE,
            stat
          })
        }
      });
      elPlusBtn.addEventListener('mouseenter', (e) => {
        playSFXKey('click');
        updateRuneName(true);
      });
      elPlusBtn.addEventListener('mouseleave', (e) => {
        playSFXKey('click');
        updateRuneName(false);
      });
      const elLock = el.querySelector('.stat-lock');
      if (elLock) {
        elLock.addEventListener('click', () => {
          underworld.pie.sendData({
            type: MESSAGE_TYPES.LOCK_RUNE,
            key: (elLock as HTMLElement).dataset.key,
            index: (elLock as HTMLElement).dataset.index,
          });
        })
      }

      // Exception: Show cast range when hovered
      if (stat == 'Cast Range') {
        elPlusBtn.addEventListener('mouseenter', () => {
          keyDown.showWalkRope = true;
        });
        elPlusBtn.addEventListener('mouseleave', () => {
          keyDown.showWalkRope = false;
        });
      }
    }
  });
}


export function toggleInventory(toolbarIndex: number | undefined, forceState: boolean | undefined, underworld: Underworld) {
  if (globalThis.headless) { return; }
  const inventoryWasOpen = document.body?.classList.contains(openInvClass);
  document.body?.classList.toggle(openInvClass, forceState);
  if (globalThis.player && document.body?.classList.contains(openInvClass)) {
    // Create inventory
    playSFXKey('inventory_open');
    syncInventory(toolbarIndex, underworld);
    if (globalThis.player && underworld.perksLeftToChoose(globalThis.player)) {
      chooseBookmark('bookmark-runes', true, underworld);
    }
    // Update spellcosts in the inventory
    updateCardBadges(underworld);
    underworld.pie.sendData({
      type: MESSAGE_TYPES.VIEWING_INVENTORY,
      isOpen: true,
    });
  } else {
    // If inventory just closed, play sfx
    if (inventoryWasOpen) {
      playSFXKey('inventory_close');
    }
    // When inventory closes, remove active toolbar element class
    document.querySelectorAll('.active-toolbar-element').forEach(e => e.classList.remove(ACTIVE_TOOLBAR_ELEMENT_CLASSNAME))
    underworld.pie.sendData({
      type: MESSAGE_TYPES.VIEWING_INVENTORY,
      isOpen: false,
    });
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
    if (levelsUntilCardIsEnabled(cardId, underworld) > 0) {
      floatingText({ coords: underworld.getMousePos(), text: i18n('Disabled'), style: { fill: 'red' } });
      playSFXKey('deny');
      return;
    }
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
export function deselectLastCard(underworld: Underworld) {
  if (globalThis.headless) { return; }
  if (elSelectedCards) {
    const cardGroup = elSelectedCards.children.item(elSelectedCards.children.length - 1) as HTMLElement;
    if (cardGroup) {
      (cardGroup.children.item(0) as HTMLElement).click();
      manageSelectedCardsParentVisibility();
      runPredictions(underworld);
    } else {
      console.warn(`Cannot deselect last card in selected cards`)
    }
  }

}
export function selectCardByIndex(index: number, cardHolder: HTMLElement) {
  if (globalThis.headless) { return; }
  if (cardHolder) {
    const cardGroup = cardHolder.children.item(index) as HTMLElement;
    if (cardGroup && cardGroup.children.item(0)) {
      (cardGroup.children.item(0) as HTMLElement).click();
    } else {
      console.warn(`Cannot select a card, no card in hand at index ${index}`)
    }
  }
}
// Moves a card element to selected-cards div
async function selectCard(player: Player.IPlayer, element: HTMLElement, cardId: string, underworld: Underworld) {
  resetNotifiedImmune();
  const card = Cards.allCards[cardId];
  if (!card) {
    console.error('Card with', cardId, 'not found');
    return;
  }
  if (!globalThis.player) {
    console.error('Attempted to selectCard with no globalThis.player');
    return;
  }
  if (elSelectedCards) {
    const clone = element.cloneNode(true) as HTMLElement;
    // Selected cards are not draggable for rearranging
    clone.draggable = false;
    // No title for selected cards, icon only
    clone.querySelector('.card-title')?.remove();
    addListenersToCardElement(player, clone, cardId, underworld);
    clone.classList.add('selected');
    if (card.requiresFollowingCard) {
      const selectedCards = getSelectedCards();
      // Show that you need a non frontload card for the spell to work
      // only if there isn't any frontload card selected
      if (selectedCards.filter(c => !c.frontload).length == 0) {
        clone.classList.add('requires-following-card')
      }
    }
    elSelectedCards.appendChild(clone);
    manageSelectedCardsParentVisibility();
    updateCardBadges(underworld);
    if (underworld) {
      // runPredictions to update the mana and health of predictionPlayer if the spell were to be cast
      // so that we can check in the next block if there is insufficient health or mana to cast it.
      await runPredictions(underworld);
    }

    const predictionPlayerUnit = underworld.unitsPrediction.find(u => u.id == globalThis.player?.unit.id);
    if (predictionPlayerUnit) {
      if (predictionPlayerUnit.mana < 0) {
        floatingText({
          coords: underworld.getMousePos(),
          text: 'Insufficient Mana',
          style: { fill: colors.errorRed, fontSize: '50px', ...config.PIXI_TEXT_DROP_SHADOW }
        })
        explain(EXPLAIN_END_TURN);
        deselectLastCard(underworld);

      }

      if (predictionPlayerUnit.health < 0) {
        floatingText({
          coords: underworld.getMousePos(),
          text: 'Insufficient Health',
          style: { fill: colors.errorRed, fontSize: '50px', ...config.PIXI_TEXT_DROP_SHADOW }
        })
        deselectLastCard(underworld);

      }
    } else {
      console.warn('Unexpected: predictionPlayerUnit is undefined');
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
  clearSpellEffectProjection(underworld);
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
// @ts-ignore for menu
globalThis.cardRarityAsString = cardRarityAsString;
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
// @ts-ignore for menu
globalThis.getCardRarityColor = getCardRarityColor;
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
export function getSpellThumbnailPath(path?: string): string {
  if (!path) {
    return '';
  }
  // spellmasons-mods/ should not have anything appended to the front since
  // they are included in the mod folder
  if (path.indexOf('spellmasons-mods/') !== -1) {
    return path;
  }
  // The presence of '/' means that it's a different path than default (such as in a mod) and it isn't
  // nested in images/spell/
  return path.indexOf('/') !== -1 ? path : 'images/spell/' + path;

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
  thumbnail.src = getSpellThumbnailPath(thumbnailPath);
  thumbHolder.appendChild(thumbnail);
  thumbHolder.classList.add('card-thumb');
  elCardInner.appendChild(thumbHolder);
  const title = document.createElement('div');
  title.classList.add('card-title');
  title.innerHTML = i18n(titleText);
  elCardInner.appendChild(title);
  return element;
}
// @ts-ignore For menu only
globalThis.createCardElement = createCardElement;
function createCardElement(content: Cards.ICard, underworld?: Underworld, fullSize?: boolean, hideAsUnknown?: boolean) {
  const element = document.createElement('div');
  if (!content) {
    return element;
  }
  element.classList.add('card');
  const levelsDisabled = levelsUntilCardIsEnabled(content.id, underworld);
  if (!fullSize && globalThis.player && underworld && levelsDisabled > 0) {
    element.classList.add('disabled');
    const elDisabledLabel = document.createElement('div');
    elDisabledLabel.classList.add('disabled-label');
    elDisabledLabel.innerHTML = `${levelsDisabled}`;
    element.appendChild(elDisabledLabel);
  }
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
  const cost = calculateCostForSingleCard(content, 0, globalThis.player);
  updateManaBadge(elCardManaBadge, cost.manaCost, content);
  elCardBadgeHolder.appendChild(elCardManaBadge);
  const elCardHealthBadge = document.createElement('div');
  elCardHealthBadge.classList.add('card-health-badge', 'card-badge');
  updateHealthBadge(elCardHealthBadge, cost.healthCost, content);
  elCardBadgeHolder.appendChild(elCardHealthBadge);
  const thumbHolder = document.createElement('div');
  const thumbnail = document.createElement('img');
  thumbnail.src = getSpellThumbnailPath(hideAsUnknown ? 'unknown.png' : content.thumbnail);
  thumbHolder.appendChild(thumbnail);
  thumbHolder.classList.add('card-thumb');
  elCardInner.appendChild(thumbHolder);
  const title = document.createElement('div');
  title.classList.add('card-title');
  title.innerHTML = i18n(hideAsUnknown ? 'Unknown' : content.id.split('_').join(' '));
  elCardInner.appendChild(title);
  if (content.modName) {
    const modHolder = document.createElement('div');
    modHolder.classList.add('card-mod-name');
    const modNameText = document.createElement('div');
    modNameText.style.color = 'black';
    const mod = globalThis.mods.find(m => m.modName == content.modName)
    if (mod) {
      const modIcon = document.createElement('img');
      modIcon.src = mod.screenshot;
      modIcon.width = 16;
      modHolder.appendChild(modIcon);
    }
    modNameText.innerHTML = content.modName;
    modHolder.appendChild(modNameText);
    elCardInner.appendChild(modHolder);
  }
  const rarityText = document.createElement('div');
  rarityText.classList.add('card-rarity')
  rarityText.style.color = getCardRarityColor(content);
  rarityText.innerHTML = globalThis.i18n(cardRarityAsString(content).toLocaleLowerCase());
  elCardInner.appendChild(rarityText);
  const desc = document.createElement('div');
  desc.classList.add('card-description');
  if (content.description) {
    const labelHolder = document.createElement('div');
    if (content.replaces || content.requires) {
      const replacesEl = getReplacesCardText(content.replaces || [], content.requires || []);
      labelHolder.appendChild(replacesEl)
    }
    const label = document.createElement('span');
    label.innerText = hideAsUnknown ? '' : i18n(content.description).trimStart();
    labelHolder.appendChild(label);
    desc.appendChild(labelHolder);
  }
  elCardInner.appendChild(desc);
  return element;
}
// @ts-ignore: For the menu
globalThis.getReplacesCardText = getReplacesCardText;
export function getReplacesCardText(replaces: string[], requires?: string[]) {
  const replacesEl = document.createElement('div');
  if (replaces && replaces.length) {
    const label = document.createElement('span');
    label.innerText = i18n('Upgrades');
    replacesEl.appendChild(label);
    for (let r of replaces) {
      const replaceCard = Cards.allCards[r];
      if (replaceCard) {
        const thumbnail = document.createElement('img');
        thumbnail.src = getSpellThumbnailPath(replaceCard.thumbnail);
        thumbnail.style.width = '16px';
        thumbnail.style.padding = '0 4px';
        replacesEl.appendChild(thumbnail);
        const label = document.createElement('span');
        label.innerText = r;
        replacesEl.appendChild(label);
      }
    }
  }
  if (requires && requires.length) {
    if (replaces && replaces.length) {
      replacesEl.appendChild(document.createElement('br'));
    }
    const labelRequires = document.createElement('span');
    labelRequires.innerText = i18n('Requires');
    replacesEl.appendChild(labelRequires);
    for (let r of (requires || []).filter(x => !replaces.includes(x))) {
      const replaceCard = Cards.allCards[r];
      if (replaceCard) {
        const thumbnail = document.createElement('img');
        thumbnail.src = getSpellThumbnailPath(replaceCard.thumbnail);
        thumbnail.style.width = '16px';
        thumbnail.style.padding = '0 4px';
        replacesEl.appendChild(thumbnail);
        const label = document.createElement('span');
        label.innerText = globalThis.i18n(r);
        replacesEl.appendChild(label);
      }
    }
  }
  return replacesEl;
}
// @ts-ignore for menu
globalThis.updateManaBadge = updateManaBadge;
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
// @ts-ignore for menu
globalThis.updateHealthBadge = updateHealthBadge
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
    // Update selected cards
    const selectedCards = getSelectedCards();
    for (let i = 0; i < selectedCards.length; i++) {
      const card = selectedCards[i];
      if (card) {
        const sliceOfCardsOfSameIdUntilCurrent = selectedCards.slice(0, i).filter(c => c.id == card.id);
        const cost = calculateCostForSingleCard(card, (globalThis.player.cardUsageCounts[card.id] || 0) + sliceOfCardsOfSameIdUntilCurrent.length * card.expenseScaling, globalThis.player);
        const elBadges = document.querySelectorAll(`#selected-cards .card[data-card-id="${card.id}"] .card-mana-badge`);
        const elBadge = Array.from(elBadges)[sliceOfCardsOfSameIdUntilCurrent.length];
        if (elBadge) {
          updateManaBadge(elBadge, cost.manaCost, card);
        }
        const elBadgesH = document.querySelectorAll(`#selected-cards .card[data-card-id="${card.id}"] .card-health-badge`);
        const elBadgeH = Array.from(elBadgesH)[sliceOfCardsOfSameIdUntilCurrent.length];
        if (elBadgeH) {
          updateHealthBadge(elBadgeH, cost.healthCost, card);
        }
      }
    }
    // Update cards in hand and inventory
    const cards = Cards.getCardsFromIds(globalThis.player.inventory);
    const badgesById: { [cardId: string]: { mana: HTMLElement[], health: HTMLElement[] } } = {}
    function populateBadgesById(attr: 'mana' | 'health') {
      Array.from(document.querySelectorAll(`.card-holder .card .card-${attr}-badge, #inventory-content .card .card-${attr}-badge`)).forEach((badge) => {
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
      const cost = calculateCostForSingleCard(card, (globalThis.player.cardUsageCounts[card.id] || 0) + selectedCardElementsOfSameId.length * card.expenseScaling, globalThis.player);
      const badgeRecord = badgesById[card.id];
      if (badgeRecord) {
        for (let elBadge of badgeRecord.mana) {
          updateManaBadge(elBadge, cost.manaCost, card);
        }
        for (let elBadgeHealth of badgeRecord.health) {
          updateHealthBadge(elBadgeHealth, cost.healthCost, card);
        }
      }
    }

    // Update hotkey badges
    const cardHolders = Array.from(document.querySelectorAll('.card-holder'));
    for (let cardHolder of cardHolders) {
      if (cardHolder) {
        for (let x = 0; x < cardHolder.children.length && x < 10; x++) {
          // Card hotkeys start being indexed by 1 not 0
          // and the 9th card is accessible by hotkey 0 on the keyboard
          const key = x == 9 ? 0 : x + 1;
          const card = cardHolder.children.item(x) as HTMLElement;
          if (card) {
            const elHotkeyBadge = card.querySelector('.hotkey-badge') as HTMLElement;
            if (elHotkeyBadge) {
              let map = key.toString();
              try {
                map = mappings[cardHolder.id as keyof typeof mappings](key) || key.toString();
              } catch (_) {
                map = key.toString();
              }
              let hotkeyString = '';
              if (map.startsWith('shiftKey')) {
                hotkeyString += SHIFT_SYMBOL;
              }
              if (map.startsWith('ctrlKey')) {
                hotkeyString += CTRL_SYMBOL;
              }
              hotkeyString += map.charAt(map.length - 1);


              elHotkeyBadge.innerHTML = hotkeyString;
            }
          }
        }
      }
    }

  }
}
const SHIFT_SYMBOL = '⇧';
const CTRL_SYMBOL = '^';
const mappings = {
  'card-hand': (x: number): string | undefined => (globalThis.controlMap[`spell${x}` as keyof typeof globalThis.controlMap] || [])[0],
  'floating-card-holder-left': (x: number): string | undefined => (globalThis.controlMap[`spellLeft${x}` as keyof typeof globalThis.controlMap] || [])[0],
  'floating-card-holder-right': (x: number): string | undefined => (globalThis.controlMap[`spellRight${x}` as keyof typeof globalThis.controlMap] || [])[0],

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

// Used for game over stats
export function cardListToImages(cardIds: string[]): string {
  let html = '';
  for (let cardId of cardIds) {
    const card = Cards.allCards[cardId];
    if (card) {
      html += `<img src="${getSpellThumbnailPath(card.thumbnail)}" alt="${card.id}"/>`;
    }
  }
  return html;
}