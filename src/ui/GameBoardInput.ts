import { MESSAGE_TYPES } from '../MessageTypes';
import { BOARD_HEIGHT, BOARD_WIDTH, CELL_SIZE } from '../config';
import * as Spell from '../Spell';
import { addPixiSprite, containerUI } from '../PixiUtils';
import { turn_phase } from '../Game';
import * as Card from '../Card';
import type { IPlayer } from '../Player';
import floatingText from '../FloatingText';
import * as Unit from '../Unit';

// This is the unit that is currently selected
// This likely means that information about it will display
let selectedUnit: Unit.IUnit;
let mouseCellX;
let mouseCellY;
// Highlights are images that appear above cells to denote some information, such as the spell or action about to be cast/taken when clicked
let highlights = [];
function clearHighlights() {
  highlights.forEach((sprite) => {
    if (sprite.parent) {
      sprite.parent.removeChild(sprite);
    }
  });
  highlights = [];
}
function isOutOfBounds(x, y) {
  return x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT;
}
function areAnyCardsSelected() {
  return !!document.querySelectorAll('.card.selected').length;
}

// Draws the image that shows on the cell under the mouse
export function syncMouseHoverIcon() {
  // Clear the highlights in preparation for showing the current ones
  clearHighlights();
  if (isOutOfBounds(mouseCellX, mouseCellY)) {
    // Mouse is out of bounds, do not show a hover icon
    return;
  }
  // only show hover target when it's the correct turn phase
  if (window.game.turn_phase == turn_phase.PlayerTurns) {
    // If mouse hovering over a new cell, update the target images

    const selectedSpell = Spell.buildSpellFromCardTally(
      Card.getSelectedCardTally(),
      window.player,
      {
        x: mouseCellX,
        y: mouseCellY,
      },
    );
    // if spell exists show target image, otherwise show feet image for walking
    const targetImgPath = areAnyCardsSelected()
      ? 'images/spell/target.png'
      : null;
    if (!targetImgPath) {
      // Do not render if there is no target image path
      return;
    }
    // Make a copy of the spell and add the target coords
    if (selectedSpell.swap) {
      const currentPlayer = window.game.players.find(
        (p) => p.clientId === window.clientId,
      );
      selectedSpell.x = currentPlayer.unit.x;
      selectedSpell.y = currentPlayer.unit.y;
    }
    // TODO: Fix showing the targets of the spell ahead of time using the new SpellEffects
    // Find the targets of the spell
    // const targets = window.game.getTargetsOfSpell(selectedSpell);
    // if (selectedSpell.swap) {
    //   targets.push({ x: mouseCellX, y: mouseCellY });
    // }
    // // Show highlights corresponding to targets
    // for (let t of targets) {
    //   const sprite = addPixiSprite(targetImgPath, containerUI);
    //   sprite.x = t.x * CELL_SIZE;
    //   sprite.y = t.y * CELL_SIZE;
    //   highlights.push(sprite);
    // }
  }
}
export default function setupBoardInputHandlers() {
  // on Hover
  document.body.addEventListener('mousemove', (e) => {
    const { x, y } = window.game.getCellFromCurrentMousePos();
    const didChange = mouseCellX !== x || mouseCellY !== y;
    mouseCellX = x;
    mouseCellY = y;
    // If mouse hovering over a new cell, update the target images
    if (didChange) {
      // Show target hover on cells
      syncMouseHoverIcon();
    }
  });
  // Handle right click on game board
  document.body.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const { x, y } = window.game.getCellFromCurrentMousePos();
    if (isOutOfBounds(x, y)) {
      // Disallow click out of bounds
      return;
    }
    if (window.game.turn_phase == turn_phase.PlayerTurns) {
      if (window.game.yourTurn) {
        // Get current client's player
        const selfPlayer: IPlayer | undefined = window.game.players.find(
          (p) => p.clientId === window.clientId,
        );
        // If player hasn't already moved this turn...
        if (selfPlayer && !selfPlayer.unit.thisTurnMoved) {
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
              style: {
                fill: 'red',
              },
            });
          }
        } else {
          floatingText({
            cellX: x,
            cellY: y,
            text: 'You cannot move more than once per turn.',
          });
        }
      }
    }
    return false;
  });
  // Handle clicks on the game board
  document.body.addEventListener('click', (e) => {
    const { x, y } = window.game.getCellFromCurrentMousePos();
    if (isOutOfBounds(x, y)) {
      // Disallow click out of bounds
      return;
    }
    if (window.planningViewActive) {
      window.pie.sendData({
        type: MESSAGE_TYPES.PING,
        x,
        y,
      });
      return;
    }
    // Only allow casting in the proper phase
    if (window.game.turn_phase == turn_phase.PlayerTurns) {
      if (window.game.yourTurn) {
        // Get current client's player
        const selfPlayer: IPlayer | undefined = window.game.players.find(
          (p) => p.clientId === window.clientId,
        );
        // If player hasn't already cast this turn...
        if (selfPlayer && !selfPlayer.thisTurnSpellCast) {
          // If a spell exists (based on the combination of cards selected)...
          if (areAnyCardsSelected()) {
            // cast the spell
            window.pie.sendData({
              type: MESSAGE_TYPES.SPELL,
              x,
              y,
              cards: Card.getSelectedCardTally(),
            });
            Card.clearSelectedCardTally();
          }
        } else {
          floatingText({
            cellX: x,
            cellY: y,
            text: 'You cannot cast more than once per turn.',
          });
        }
      }
    }
    // Remove the highlight once a click occurs
    clearHighlights();
  });
}
