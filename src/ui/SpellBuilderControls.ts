import { MESSAGE_TYPES } from '../MessageTypes';
import { CELL_SIZE } from '../config';
import * as SpellPool from '../SpellPool';
import { addPixiSprite, app } from '../PixiUtils';

const elBoard = document.getElementById('board');
let mouseCellX;
let mouseCellY;
function getCell({ clientX, clientY }) {
  const rect = elBoard.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  let cell_x = Math.floor(x / CELL_SIZE);
  let cell_y = Math.floor(y / CELL_SIZE);
  return { cell_x, cell_y };
}
let highlights = [];
function clearHighlights() {
  highlights.forEach((sprite) => {
    app.stage.removeChild(sprite);
  });
  highlights = [];
}
export default function setupSpellBuilderUI() {
  // Initialize spell pool
  SpellPool.create();

  // on Hover
  elBoard.addEventListener('mousemove', (e) => {
    const { cell_x, cell_y } = getCell(e);
    const didChange = mouseCellX !== cell_x || mouseCellY !== cell_y;
    mouseCellX = cell_x;
    mouseCellY = cell_y;
    // If mouse hovering over a new cell, update the target images
    if (didChange) {
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
        const sprite = addPixiSprite('images/spell/target.png');
        highlights.push(sprite);
        const transform = {
          x: t.x * CELL_SIZE,
          y: t.y * CELL_SIZE,
          opacity: 100,
          scale: 1,
        };
        window.animationManager.setTransform(sprite, transform);
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
