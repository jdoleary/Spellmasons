import { MESSAGE_TYPES } from '../MessageTypes';
import { CELL_SIZE } from '../Image';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../config';
import type { Spell } from '../Spell';
import floatingText from '../FloatingText';
let currentSpell: Spell = null;

const elBoard = document.getElementById('board');
export default function setupSpellBuilderUI() {
  // Add board click handling
  elBoard.addEventListener('click', (e) => {
    const rect = elBoard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let cell_x = Math.floor(x / CELL_SIZE);
    let cell_y = Math.floor(y / CELL_SIZE);
    if (window.inverted) {
      cell_x = Math.abs((cell_x + 1 - BOARD_WIDTH) % BOARD_WIDTH);
      cell_y = Math.abs((cell_y + 1 - BOARD_HEIGHT) % BOARD_HEIGHT);
    }
    console.log('Click in cell:', cell_x, cell_y, currentSpell);
    if (currentSpell) {
      if (currentSpell.summon) {
        const vy = cell_y > 3 ? -1 : 1;
        if (
          window.game.units.filter(
            (u) => u.alive && u.x === cell_x && u.y === cell_y,
          ).length
        ) {
          floatingText({
            cellX: cell_x,
            cellY: cell_y,
            color: 'red',
            text: "Cannot cast here, something's in the way",
          });
        } else {
          window.pie.sendData({
            type: MESSAGE_TYPES.SPELL,
            spell: {
              x: cell_x,
              y: cell_y,
              summon: { ...currentSpell.summon, vx: 0, vy },
            },
          });
        }
      } else {
        window.pie.sendData({
          type: MESSAGE_TYPES.SPELL,
          spell: { ...currentSpell, x: cell_x, y: cell_y },
        });
      }
    }
  });
}
