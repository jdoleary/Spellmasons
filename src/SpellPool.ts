import { MESSAGE_TYPES } from './MessageTypes';
const elPool = document.getElementById('spell-pool');
let spells = [[], [], []];
let selectedSpellIndex;
export function selectSpell(index?: number) {
  selectedSpellIndex = index;
  // Deselect selected spell visually
  document.querySelector('.spell.selected')?.classList.remove('selected');

  const spell = spells[selectedSpellIndex];
  if (spell) {
    // Update the selected spell DOM element
    document
      .getElementById('spell-' + selectedSpellIndex)
      .classList.add('selected');
  }
  // update tooltip with current state of clicked spell
  window.setTooltip(JSON.stringify(spell || '', null, 2));
}
export function create(): string[][] {
  const elPoolSpells = document.querySelectorAll('#spell-pool .spell');
  for (let i = 0; i < elPoolSpells.length; i++) {
    const el: HTMLDivElement = document.querySelector(
      '#spell-pool #spell-' + i,
    );

    // Click on spell
    // Add card to spell
    el.addEventListener('click', (e) => {
      // Apply selected card to spell
      if (window.game.yourTurn && selectedCard) {
        spells[i].push(selectedCard.content);
        el.querySelector('.spell-content').innerHTML = spells[
          i
        ].length.toString();

        elPool.classList.remove('adding');
        // Disable the card:
        selectedCard.element.classList.remove('selected');
        // Send the selection to the other player
        window.pie.sendData({
          type: MESSAGE_TYPES.CHOOSE_CARD,
          id: selectedCard.element.id,
        });
        selectedCard = null;
      }
      // Keep the last selected spell in state for casting later
      selectSpell(i);
    });
  }
  return spells;
}
let selectedCard: {
  content: string;
  element: HTMLDivElement;
};
export function cardChosen(elementId: string) {
  document.getElementById(elementId)?.classList.add('disabled');
}
export function setSelectedCard(content: string, element: HTMLDivElement) {
  selectedCard = {
    content,
    element,
  };
  if (selectedCard) {
    // Add 'adding' class to the spell pool so spells change so as to suggest
    // that they can accept the new spell
    elPool.classList.add('adding');
    // Deselect spells once a card is selected so all spells appear the same
    selectSpell(undefined);
  } else {
    elPool.classList.remove('adding');
  }
}
