import { MESSAGE_TYPES } from '../MessageTypes';
import { CELL_SIZE } from '../config';
import * as SpellPool from '../SpellPool';
import { addPixiSprite, app } from '../PixiUtils';

let mouseCellX;
let mouseCellY;
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
  document.body.addEventListener('mousemove', (e) => {
    const { x, y } = window.game.getCellFromCurrentMousePos();
    const didChange = mouseCellX !== x || mouseCellY !== y;
    mouseCellX = x;
    mouseCellY = y;
    // If mouse hovering over a new cell, update the target images
    if (didChange) {
      // Make a copy of the spell and add the target coords
      const spellCopy = Object.assign(
        {
          x,
          y,
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
        sprite.x = -10;
        sprite.y = -10;
        highlights.push(sprite);
        const transform = {
          x: t.x * CELL_SIZE,
          y: t.y * CELL_SIZE,
          alpha: 1,
          scale: 1,
        };
        window.animationManager.setTransform(sprite, transform);
      }
    }
  });
  // elBoard.addEventListener('mouseleave', (e) => {
  //   clearHighlights();
  // });

  // Add board click handling
  document.body.addEventListener('click', (e) => {
    const { x, y } = window.game.getCellFromCurrentMousePos();
    const selectedSpell = SpellPool.getSelectedSpell();
    if (window.game.yourTurn && selectedSpell) {
      const spell = Object.assign({ x, y }, selectedSpell);
      window.pie.sendData({
        type: MESSAGE_TYPES.SPELL,
        spell,
      });
    }
  });
}
