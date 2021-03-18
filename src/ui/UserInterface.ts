import * as Unit from '../Unit';
import setupBoardInputHandlers from './GameBoardInput';

const elEndTurnBtn: HTMLButtonElement = document.getElementById(
  'endTurn',
) as HTMLButtonElement;

export function setup() {
  // Add keyboard shortcuts
  window.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'Space':
        window.game.endMyTurn();
        break;
    }
  });
  window.addEventListener('keypress', (event) => {
    switch (event.code) {
      case 'KeyZ':
        togglePlanningView();
        break;
    }
  });

  elEndTurnBtn.addEventListener('click', () => {
    window.game.endMyTurn();
  });
  setupBoardInputHandlers();
}
let planningViewActive = false;
function togglePlanningView() {
  planningViewActive = !planningViewActive;
  if (planningViewActive) {
    window.game.units.forEach((u) => Unit.select(u));
  } else {
    window.game.units.forEach((u) => Unit.deselect(u));
  }
}
