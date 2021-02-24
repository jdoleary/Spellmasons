import { MESSAGE_TYPES } from './index';
import { CELL_SIZE } from './Image';
import Game from './Game';
let currentSpell = null;

const elControls = document.getElementById('controls');
const elBoard = document.getElementById('board');
const elOppTurnStatus = document.getElementById('opponentTurnStatus');
const elEndTurnBtn: HTMLButtonElement = document.getElementById(
  'endTurn',
) as HTMLButtonElement;
const elResetGameButton: HTMLButtonElement = document.getElementById(
  'resetGame',
) as HTMLButtonElement;
const elMana = document.getElementById('mana');
const elHealth = document.getElementById('health');

export function setup() {
  // Add board click handling
  elBoard.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cell_x = Math.floor(x / CELL_SIZE);
    const cell_y = Math.floor(y / CELL_SIZE);
    console.log('Click in cell:', cell_x, cell_y, currentSpell);
    if (currentSpell) {
      const { spell_type, ...spell } = currentSpell;
      if (spell_type === 'summon') {
        const vy = cell_y > 3 ? -1 : 1;
        window.pie.sendData({
          type: MESSAGE_TYPES.SPELL,
          spell: {
            x: cell_x,
            y: cell_y,
            summon: { vx: 0, vy, imagePath: 'crocodile.png' },
          },
        });
      } else {
        window.pie.sendData({
          type: MESSAGE_TYPES.SPELL,
          spell: { ...spell, x: cell_x, y: cell_y },
        });
      }
    }
  });
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
}
function endTurn() {
  window.pie.sendData({ type: MESSAGE_TYPES.END_TURN });
}
function resetGame() {
  const doReset = window.confirm('Are you sure you want to start over?');
  if (doReset) {
    window.pie.sendData({
      type: MESSAGE_TYPES.LOAD_GAME_STATE,
      game: new Game(),
    });
  }
}
export function setHealth(health: number) {
  elHealth.innerText = `${health} Health`;
}
let maxMana;
export function setCurrentMana(mana: number, max?: number) {
  if (max) {
    maxMana = max;
  }
  elMana.innerText = `${mana} / ${maxMana} Mana`;
}
export function turnEnded(isEnded: boolean) {
  elEndTurnBtn.disabled = isEnded;
  elOppTurnStatus.innerText = 'Opponent is thinking...';
}
export function turnEndedOpponent() {
  elOppTurnStatus.innerText = 'Opponent waiting';
}
