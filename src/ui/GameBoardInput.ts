import { MESSAGE_TYPES } from '../MessageTypes';
import { BOARD_HEIGHT, BOARD_WIDTH, CELL_SIZE } from '../config';
import * as SpellPool from '../SpellPool';
import { addPixiSprite, app } from '../PixiUtils';
import { turn_phase } from '../Game';
import { clearSelectedCards } from '../cards';
import type { IPlayer } from '../Player';
import floatingText from '../FloatingText';
import * as Unit from '../Unit';

let mouseCellX;
let mouseCellY;
// Highlights are images that appear above cells to denote some information, such as the spell or action about to be cast/taken when clicked
let highlights = [];
function clearHighlights() {
  highlights.forEach((sprite) => {
    app.stage.removeChild(sprite);
  });
  highlights = [];
}
function isOutOfBounds(x, y) {
  return x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT;
}
export default function setupBoardInputHandlers() {
  // on Hover
  document.body.addEventListener('mousemove', (e) => {
    const { x, y } = window.game.getCellFromCurrentMousePos();
    if (isOutOfBounds(x, y)) {
      // clear highlights since mouse is now out of bounds
      clearHighlights();
      return;
    }
    // only show hover target when it's the correct turn phase
    if (window.game.turn_phase == turn_phase.PlayerTurns) {
      const didChange = mouseCellX !== x || mouseCellY !== y;
      mouseCellX = x;
      mouseCellY = y;
      // If mouse hovering over a new cell, update the target images
      if (didChange) {
        const selectedSpell = SpellPool.getSelectedSpell();
        // if spell exists show target image, otherwise show feet image for walking
        const targetImgPath = areAnyCardsSelected()
          ? 'images/spell/target.png'
          : 'images/spell/feet.png';
        // Make a copy of the spell and add the target coords
        const spellCopy = Object.assign(
          {
            x,
            y,
          },
          selectedSpell,
        );
        // Find the targets of the spell
        const targets = window.game.getTargetsOfSpell(spellCopy);
        // Clear the highlights in preparation for showing the current ones
        clearHighlights();
        // Show highlights corresponding to targets
        for (let t of targets) {
          const sprite = addPixiSprite(targetImgPath);
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
    }
  });
  function areAnyCardsSelected() {
    return !!document.querySelectorAll('.card.selected').length;
  }
  // Handle clicks on the game board
  document.body.addEventListener('click', (e) => {
    const { x, y } = window.game.getCellFromCurrentMousePos();
    if (isOutOfBounds(x, y)) {
      // Disallow click out of bounds
      return;
    }
    // Only allow casting in the proper phase
    if (window.game.turn_phase == turn_phase.PlayerTurns) {
      const selectedSpell = SpellPool.getSelectedSpell();
      if (window.game.yourTurn) {
        // If a spell exists (based on the combination of cards selected)...
        if (areAnyCardsSelected()) {
          // cast the spell
          const spell = Object.assign({ x, y }, selectedSpell);
          clearSelectedCards();
          window.pie.sendData({
            type: MESSAGE_TYPES.SPELL,
            spell,
          });
        } else {
          // otherwise, move player character
          const selfPlayer: IPlayer | undefined = window.game.players.find(
            (p) => p.clientId === window.clientId,
          );
          if (selfPlayer) {
            const targetCell = Unit.findCellOneStepCloserTo(
              selfPlayer.unit,
              x,
              y,
            );
            if (window.game.canUnitMoveIntoCell(targetCell.x, targetCell.y)) {
              window.pie.sendData({
                type: MESSAGE_TYPES.MOVE_PLAYER,
                // This formula clamps the diff to -1, 0 or 1
                ...targetCell,
              });
            } else {
              floatingText({
                cellX: targetCell.x,
                cellY: targetCell.y,
                text: 'You cannot move here',
                color: 'red',
              });
            }
          }
        }
      }
    }
    // Remove the highlight once a click occurs
    clearHighlights();
  });
}
