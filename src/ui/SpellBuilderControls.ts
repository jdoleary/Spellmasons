import { MESSAGE_TYPES } from '../MessageTypes';
import { BOARD_HEIGHT, BOARD_WIDTH, CELL_SIZE } from '../config';
import * as SpellPool from '../SpellPool';
import { addPixiSprite, app } from '../PixiUtils';
import { turn_phase } from '../Game';
import { clearSelectedCards } from '../cards';
import * as Unit from '../Unit';
import type { IPlayer } from '../Player';

let mouseCellX;
let mouseCellY;
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
export default function setupSpellBuilderUI() {
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
        const targetImgPath = Object.values(selectedSpell).length
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
  // elBoard.addEventListener('mouseleave', (e) => {
  //   clearHighlights();
  // });

  // Add board click handling
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
        // If a spell exists
        if (selectedSpell && Object.values(selectedSpell).length > 0) {
          const spell = Object.assign({ x, y }, selectedSpell);
          clearSelectedCards();
          window.pie.sendData({
            type: MESSAGE_TYPES.SPELL,
            spell,
          });
        } else {
          // try walking
          const selfPlayer: IPlayer | undefined = window.game.players.find(
            (p) => p.clientId === window.clientId,
          );
          if (selfPlayer) {
            // Find the difference between current position and desired position
            const diffX = x - selfPlayer.unit.x;
            const diffY = y - selfPlayer.unit.y;
            // Move the player 1 magnitude on either or both axes towards the desired position
            Unit.moveTo(
              selfPlayer.unit,
              // This formula clamps the diff to -1, 0 or 1
              selfPlayer.unit.x + (diffX === 0 ? 0 : diffX / Math.abs(diffX)),
              selfPlayer.unit.y + (diffY === 0 ? 0 : diffY / Math.abs(diffY)),
            );
            window.animationManager.startAnimate();
          }
        }
      }
    }
  });
}
