import { MESSAGE_TYPES } from '../MessageTypes';
import type { IPlayer } from '../Player';
import setupSpellBuilderUI from './SpellBuilderControls';
import * as config from '../config';

// const elControls = document.getElementById('controls');
const elEndTurnBtn: HTMLButtonElement = document.getElementById(
  'endTurn',
) as HTMLButtonElement;
const elResetGameButton: HTMLButtonElement = document.getElementById(
  'resetGame',
) as HTMLButtonElement;
const elHealthMine = document.getElementById('health-mine');
const elHealthTheirs = document.getElementById('health-theirs');

export function setup() {
  // Add keyboard shortcuts
  window.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'Space':
        endTurn();
        break;
      default:
        console.log('No set action for key' + event.code);
    }
  });

  elEndTurnBtn.addEventListener('click', endTurn);
  elResetGameButton.addEventListener('click', resetGame);
  setupSpellBuilderUI();
}
export function endTurn() {
  window.game.endMyTurn();
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
export function setHealth(player: IPlayer) {
  let missingHearts = '';
  let healthString = '';
  for (let i = 0; i < config.PLAYER_HEART_HEALTH - player.heart_health; i++) {
    missingHearts += '❤️';
  }
  for (let i = 0; i < player.heart_health; i++) {
    healthString += '❤️';
  }
  if (player.clientId === window.clientId) {
    elHealthMine.innerHTML = `<span class="health-missing">${missingHearts}</span><span>${healthString}</span>`;
  } else {
    elHealthTheirs.innerHTML = `<span class="health-missing">${missingHearts}</span><span>${healthString}</span>`;
  }
}
