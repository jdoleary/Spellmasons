import { MESSAGE_TYPES } from '../MessageTypes';
import { CELL_SIZE } from '../Image';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../config';
import * as SpellPool from '../SpellPool';
import { createSpellFromModifiers } from '../Spell';

const elBoard = document.getElementById('board');
SpellPool.create();
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
    console.log('Click in cell:', cell_x, cell_y, SpellPool.selectedSpell);
    if (window.game.yourTurn && SpellPool.selectedSpell) {
      window.pie.sendData({
        type: MESSAGE_TYPES.SPELL,
        spell: createSpellFromModifiers(SpellPool.selectedSpell, {
          x: cell_x,
          y: cell_y,
          index: SpellPool.selectedSpellIndex,
        }),
      });
    }
  });
}
