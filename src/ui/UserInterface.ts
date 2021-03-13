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
      default:
        console.log('No set action for key ' + event.code);
    }
  });

  elEndTurnBtn.addEventListener('click', () => {
    window.game.endMyTurn();
  });
  setupBoardInputHandlers();
}
const elTooltip = document.getElementById('tooltip');
function setTooltip(description: string) {
  elTooltip.innerText = description;
}
window.setTooltip = setTooltip;
