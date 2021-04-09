import * as PIXI from 'pixi.js';
import { MESSAGE_TYPES } from '../MessageTypes';
import { BOARD_HEIGHT, BOARD_WIDTH, CELL_SIZE } from '../config';
import { turn_phase } from '../Game';
import * as Card from '../CardUI';
import * as Player from '../Player';
import floatingText from '../FloatingText';
import * as Unit from '../Unit';
import { addPixiSprite, containerUI } from '../PixiUtils';
import type { Coords } from '../commonTypes';

let mouseCellX;
let mouseCellY;
// SpellEffectProjection are images that appear above cells to denote some information, such as the spell or action about to be cast/taken when clicked
let spellEffectProjections = [];
export function clearSpellEffectProjection() {
  spellEffectProjections.forEach((sprite) => {
    if (sprite.parent) {
      sprite.parent.removeChild(sprite);
    }
  });
  spellEffectProjections = [];
  dryRunGraphics.clear();
}
function isOutOfBounds(x, y) {
  return x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT;
}
function areAnyCardsSelected() {
  return !!document.querySelectorAll('.card.selected').length;
}
const dryRunGraphics = new PIXI.Graphics();
containerUI.addChild(dryRunGraphics);

export function drawSwapLine(one: Coords, two: Coords) {
  if (one && two) {
    const x1 = one.x * CELL_SIZE + CELL_SIZE / 2;
    const y1 = one.y * CELL_SIZE + CELL_SIZE / 2;
    const x2 = two.x * CELL_SIZE + CELL_SIZE / 2;
    const y2 = two.y * CELL_SIZE + CELL_SIZE / 2;
    dryRunGraphics.beginFill(0xffff0b, 0.5);
    dryRunGraphics.lineStyle(3, 0x33ff00);
    dryRunGraphics.drawCircle(x1, y1, 10);
    dryRunGraphics.moveTo(x1, y1);
    dryRunGraphics.lineTo(x2, y2);
    dryRunGraphics.drawCircle(x2, y2, 10);
    dryRunGraphics.endFill();
  }
}

// Draws the image that shows on the cell under the mouse
export function syncMouseHoverIcon() {
  // Clear the spelleffectprojection in preparation for showing the current ones
  clearSpellEffectProjection();
  if (isOutOfBounds(mouseCellX, mouseCellY)) {
    // Mouse is out of bounds, do not show a hover icon
    return;
  }
  // only show hover target when it's the correct turn phase
  if (window.game.turn_phase == turn_phase.PlayerTurns) {
    // If mouse hovering over a new cell, update the target images

    // if spell exists show target image, otherwise show feet image for walking
    const targetImgPath = areAnyCardsSelected()
      ? 'images/spell/target.png'
      : null;
    if (!targetImgPath) {
      // Do not render if there is no target image path
      return;
    }
    const currentPlayer = window.game.players.find(
      (p) => p.clientId === window.clientId,
    );
    const mouseTarget = { x: mouseCellX, y: mouseCellY };
    if (!Player.isTargetInRange(currentPlayer, mouseTarget)) {
      // Do not render if out of cast range
      return;
    }
    // TODO restore after spell refactor
    // Make a copy of the spell and add the target coords
    // if (selectedSpell.swap) {
    //   const currentPlayer = window.game.players.find(
    //     (p) => p.clientId === window.clientId,
    //   );
    //   selectedSpell.x = currentPlayer.unit.x;
    //   selectedSpell.y = currentPlayer.unit.y;
    // }
    // Find the targets of the spell
    const targets = window.game.getTargetsOfCards(
      currentPlayer,
      Card.getSelectedCards(),
      mouseTarget,
    );
    // TODO: Fix showing the targets of the spell ahead of time using the new SpellEffects
    // if (selectedSpell.swap) {
    //   targets.push({ x: mouseCellX, y: mouseCellY });
    // }
    // Show spelleffectprojection corresponding to targets
    for (let t of targets) {
      const sprite = addPixiSprite(targetImgPath, containerUI);
      sprite.alpha = 0.5;
      sprite.x = t.x * CELL_SIZE;
      sprite.y = t.y * CELL_SIZE;
      spellEffectProjections.push(sprite);
    }
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
        const selfPlayer: Player.IPlayer | undefined = window.game.players.find(
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
        const selfPlayer: Player.IPlayer | undefined = window.game.players.find(
          (p) => p.clientId === window.clientId,
        );
        // If the player casting is the current client player
        if (selfPlayer) {
          // If a spell exists (based on the combination of cards selected)...
          if (areAnyCardsSelected()) {
            // If the spell is not in range
            if (!Player.isTargetInRange(selfPlayer, { x, y })) {
              // Show floating message to alert player
              floatingText({ cellX: x, cellY: y, text: 'out of range' });
            } else {
              // cast the spell
              window.pie.sendData({
                type: MESSAGE_TYPES.SPELL,
                x,
                y,
                cards: Card.getSelectedCards(),
              });
              Card.clearSelectedCards();
            }
          }
        }
      } else {
        floatingText({ cellX: x, cellY: y, text: 'It is not your turn yet' });
      }
    }
  });
}
