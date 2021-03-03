import { MESSAGE_TYPES } from '../MessageTypes';
import { CELL_SIZE } from '../Image';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../config';
import * as SpellPool from '../SpellPool';

const elBoard = document.getElementById('board');
const elBoardHighlights = document.getElementById('board-highlights');
function getCell({ clientX, clientY }) {
  const rect = elBoard.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  let cell_x = Math.floor(x / CELL_SIZE);
  let cell_y = Math.floor(y / CELL_SIZE);
  if (window.inverted) {
    cell_x = Math.abs((cell_x + 1 - BOARD_WIDTH) % BOARD_WIDTH);
    cell_y = Math.abs((cell_y + 1 - BOARD_HEIGHT) % BOARD_HEIGHT);
  }
  return { cell_x, cell_y };
}
const elHighlights = [];
function clearHighlights() {
  for (let y = 0; y < elHighlights.length; y++) {
    for (let h of elHighlights[y]) {
      window.animationManager.setTransform(h.img, {
        ...h,
        opacity: 0,
      });
    }
  }
}
export default function setupSpellBuilderUI() {
  // Initialize spell pool
  SpellPool.create();

  // Initialize board highlights:
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    elHighlights[y] = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const img = document.createElement('img');
      img.src = 'images/spell/target.png';
      img.classList.add('highlight');
      elHighlights[y][x] = {
        img,
        x: 0,
        y: 0,
        opacity: 0,
        scale: 1,
      };
      window.animationManager.setTransform(img, elHighlights[y][x]);
      elBoardHighlights.appendChild(img);
    }
  }

  // on Hover
  // TODO: Hover target overlay is super unoptomized and should probably be refactored if
  // it stays in the game
  elBoard.addEventListener('mousemove', (e) => {
    const { cell_x, cell_y } = getCell(e);
    // Make a copy of the spell and add the target coords
    const spellCopy = Object.assign(
      {
        x: cell_x,
        y: cell_y,
      },
      SpellPool.getSelectedSpell(),
    );
    // Find the targets of the spell
    const targets = window.game.getTargetsOfSpell(spellCopy);
    // Clear the highlights in preparation for showing the current ones
    clearHighlights();
    // Show highlights corresponding to targets
    for (let t of targets) {
      const elHighlight = elHighlights[t.y]?.[t.x];
      if (elHighlight) {
        window.animationManager.setTransform(elHighlight.img, {
          ...elHighlight,
          opacity: 50,
        });
      }
    }
  });
  elBoard.addEventListener('mouseleave', (e) => {
    clearHighlights();
  });

  // Add board click handling
  elBoard.addEventListener('click', (e) => {
    const { cell_x, cell_y } = getCell(e);
    const selectedSpell = SpellPool.getSelectedSpell();
    if (window.game.yourTurn && selectedSpell) {
      const spell = Object.assign(
        {
          x: cell_x,
          y: cell_y,
        },
        selectedSpell,
      );
      window.pie.sendData({
        type: MESSAGE_TYPES.SPELL,
        spell,
      });
    }
  });
}
