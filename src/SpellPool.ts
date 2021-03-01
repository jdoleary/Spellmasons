import { game_state } from './Game';
import { MESSAGE_TYPES } from './MessageTypes';
export interface ISpellPool {
  spells: string[][];
}
const elPool = document.getElementById('spell-pool');
export function create(): ISpellPool {
  const elPoolSpells = document.querySelectorAll('#spell-pool .spell');
  let self = {
    spells: [[], [], []],
  };
  for (let i = 0; i < elPoolSpells.length; i++) {
    const el: HTMLDivElement = document.querySelector(
      '#spell-pool #spell-' + i,
    );
    // Add card to spell
    el.addEventListener('click', (e) => {
      if (window.game.yourTurn) {
        self.spells[i].push(selectedCard.content);
        el.querySelector('.spell-content').innerHTML = self.spells[
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
      }
    });
  }
  return self;
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
    elPool.classList.add('adding');
  } else {
    elPool.classList.remove('adding');
  }
}
