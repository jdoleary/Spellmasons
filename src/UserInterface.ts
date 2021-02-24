import { MESSAGE_TYPES } from './index';
const elControls = document.getElementById('controls');
const elEndTurnBtn: HTMLButtonElement = document.getElementById(
  'endTurn',
) as HTMLButtonElement;
const elMana = document.getElementById('mana');

export function setup() {
  window.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'Space':
        window.pie.sendData({ type: MESSAGE_TYPES.END_TURN });
        break;
      default:
        console.log('No set action for key' + event.code);
    }
  });
}
export function turnEnded(isEnded: boolean) {
  elEndTurnBtn.disabled = isEnded;
}
