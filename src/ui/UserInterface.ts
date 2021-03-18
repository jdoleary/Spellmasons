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
      case 'KeyZ':
        setPlanningView(true);
        break;
    }
  });
  window.addEventListener('keyup', (event) => {
    switch (event.code) {
      case 'KeyZ':
        setPlanningView(false);
        break;
    }
  });

  elEndTurnBtn.addEventListener('click', () => {
    window.game.endMyTurn();
  });
  setupBoardInputHandlers();
}
let planningViewActive = false;
function setPlanningView(active: boolean) {
  if (active == planningViewActive) {
    // Short-circuit if planningViewActive state wont change
    return;
  }
  planningViewActive = active;
  if (planningViewActive) {
    window.game.units.forEach((u) => {
      // "Select" living units, this shows their overlay for planning purposes
      if (u.alive) {
        Unit.select(u);
      }
    });
  } else {
    window.game.units.forEach((u) => Unit.deselect(u));
  }
}
