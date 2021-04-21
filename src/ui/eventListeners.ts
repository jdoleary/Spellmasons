import { MESSAGE_TYPES } from '../MessageTypes';
import { turn_phase } from '../Game';
import * as CardUI from '../CardUI';
import * as Player from '../Player';
import * as Unit from '../Unit';
import floatingText from '../FloatingText';
import type { Coords } from '../commonTypes';
import {
  isOutOfBounds,
  setPlanningView,
  syncSpellEffectProjection,
} from './PlanningView';

export function keydownListener(event: KeyboardEvent) {
  switch (event.code) {
    case 'Space':
      window.game.endMyTurn();
      break;
    case 'KeyZ':
      setPlanningView(true);
      break;
    case 'Escape':
      CardUI.clearSelectedCards();
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      CardUI.toggleInspectMode(true);
      break;
  }
}

export function keyupListener(event: KeyboardEvent) {
  switch (event.code) {
    case 'KeyZ':
      setPlanningView(false);
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      CardUI.toggleInspectMode(false);
      break;
  }
}

export function endTurnBtnListener() {
  window.game.endMyTurn();
}

let mouseCell: Coords = { x: -1, y: -1 };
export function getCurrentMouseCellOnGrid(): Coords {
  return mouseCell;
}
export function mousemoveHandler(e: MouseEvent) {
  const cell = window.game.getCellFromCurrentMousePos();
  const didChange = mouseCell.x !== cell.x || mouseCell.y !== cell.y;
  // If mouse hovering over a new cell, update the target images
  if (didChange) {
    // Update mouseCell
    mouseCell = cell;
    // Show target hover on cells
    syncSpellEffectProjection();
  }
}
// Handle right click on game board
export function contextmenuHandler(e: MouseEvent) {
  e.preventDefault();
  const mouseTarget = window.game.getCellFromCurrentMousePos();
  if (isOutOfBounds(mouseTarget)) {
    // Disallow click out of bounds
    return;
  }
  if (window.game.turn_phase == turn_phase.PlayerTurns) {
    // Get current client's player
    const selfPlayer: Player.IPlayer | undefined = window.game.players.find(
      (p) => p.clientId === window.clientId,
    );
    // If player hasn't already moved this turn...
    if (selfPlayer && !selfPlayer.unit.thisTurnMoved) {
      const targetCell = Unit.findCellOneStepCloserTo(
        selfPlayer.unit,
        mouseTarget,
      );
      if (targetCell && !window.game.isCellObstructed(targetCell)) {
        window.pie.sendData({
          type: MESSAGE_TYPES.MOVE_PLAYER,
          // This formula clamps the diff to -1, 0 or 1
          ...targetCell,
        });
      } else {
        floatingText({
          cell: mouseTarget,
          text: 'You cannot move here',
          style: {
            fill: 'red',
          },
        });
      }
    } else {
      floatingText({
        cell: mouseTarget,
        text: 'You cannot move more than once per turn.',
      });
    }
  }
  return false;
}
// Handle clicks on the game board
export function clickHandler(e: MouseEvent) {
  const mouseTarget = window.game.getCellFromCurrentMousePos();
  if (isOutOfBounds(mouseTarget)) {
    // Disallow click out of bounds
    return;
  }
  if (window.planningViewActive) {
    window.pie.sendData({
      type: MESSAGE_TYPES.PING,
      x: mouseTarget.x,
      y: mouseTarget.y,
    });
    return;
  }
  // If a spell exists (based on the combination of cards selected)...
  if (CardUI.areAnyCardsSelected()) {
    // Only allow casting in the proper phase
    if (window.game.turn_phase == turn_phase.PlayerTurns) {
      // Get current client's player
      const selfPlayer: Player.IPlayer | undefined = window.game.players.find(
        (p) => p.clientId === window.clientId,
      );
      // If the player casting is the current client player
      if (selfPlayer) {
        // If the spell is not in range
        if (!Player.isTargetInRange(selfPlayer, mouseTarget)) {
          // Show floating message to alert player
          floatingText({
            cell: mouseTarget,
            text: 'out of range',
          });
        } else {
          // cast the spell
          window.pie.sendData({
            type: MESSAGE_TYPES.SPELL,
            x: mouseTarget.x,
            y: mouseTarget.y,
            cards: CardUI.getSelectedCards(),
          });
          CardUI.clearSelectedCards();
        }
      }
    }
  }
}
