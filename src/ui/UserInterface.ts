import { MESSAGE_TYPES } from '../MessageTypes';
import setupSpellBuilderUI from './SpellBuilderControls';

// const elControls = document.getElementById('controls');
const elEndTurnBtn: HTMLButtonElement = document.getElementById(
  'endTurn',
) as HTMLButtonElement;
const elResetGameButton: HTMLButtonElement = document.getElementById(
  'resetGame',
) as HTMLButtonElement;
const elHealth = document.getElementById('health');

export function setup() {
  // Add keyboard shortcuts
  // window.addEventListener('keydown', (event) => {
  // switch (event.code) {
  // case 'Space':
  // endTurn();
  // break;
  // default:
  // console.log('No set action for key' + event.code);
  // }
  // });
  //
  elEndTurnBtn.addEventListener('click', endTurn);
  elResetGameButton.addEventListener('click', resetGame);
  setupSpellBuilderUI();
}
function endTurn() {
  window.pie.sendData({ type: MESSAGE_TYPES.SKIP_TURN });
}
function resetGame() {
  const doReset = window.confirm('Are you sure you want to start over?');
  if (doReset) {
    window.pie.sendData({
      type: MESSAGE_TYPES.RESTART_GAME,
    });
  }
}
const elTooltip = document.getElementById('tooltip');
function setTooltip(description: string) {
  elTooltip.innerText = description;
}
window.setTooltip = setTooltip;
export function setHealth(health: number) {
  elHealth.innerText = `${health} Health`;
}
