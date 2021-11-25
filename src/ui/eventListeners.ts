import { MESSAGE_TYPES } from '../MessageTypes';
import { turn_phase } from '../Underworld';
import * as CardUI from '../CardUI';
import * as Player from '../Player';
import * as Unit from '../Unit';
import floatingText from '../FloatingText';
import type { Coords } from '../commonTypes';
import {
  isOutOfBounds,
  syncSpellEffectProjection,
  updatePlanningView,
} from './PlanningView';
import { app } from '../PixiUtils';
import { distance } from '../math';
import { View } from '../views';

export function keydownListener(event: KeyboardEvent) {
  // Only handle hotkeys when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  switch (event.code) {
    case 'AltLeft': 
      window.altDown = true;
      break;
    case 'Space':
      window.underworld.endMyTurn();
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
  // Only handle hotkeys when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  switch (event.code) {
    case 'AltLeft': 
      window.altDown = false;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      CardUI.toggleInspectMode(false);
      break;
  }
}

export function endTurnBtnListener() {
  window.underworld.endMyTurn();
}

let mouseCell: Coords = { x: -1, y: -1 };
export function getCurrentMouseCellOnGrid(): Coords {
  return mouseCell;
}
export function mousemoveHandler(e: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  const cell = window.underworld.getCellFromCurrentMousePos();
  const didChange = mouseCell.x !== cell.x || mouseCell.y !== cell.y;
  // If mouse hovering over a new cell, update the target images
  if (didChange) {
    // Update mouseCell
    mouseCell = cell;
    // Show target hover on cells
    syncSpellEffectProjection();
    // Update planning view for new cell
    updatePlanningView();
  }
}
// Handle right click on game board
export function contextmenuHandler(e: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  e.preventDefault();
  const mouseTarget = window.underworld.getCellFromCurrentMousePos();
  if (isOutOfBounds(mouseTarget)) {
    // Disallow click out of bounds
    return;
  }
  if (window.underworld.turn_phase == turn_phase.PlayerTurns) {
    // Get current client's player
    const selfPlayer:
      | Player.IPlayer
      | undefined = window.underworld.players.find(
      (p) => p.clientId === window.clientId,
    );
    // If player hasn't already moved this turn...
    if (selfPlayer && !selfPlayer.unit.thisTurnMoved) {
      const targetCell = Unit.findCellOneStepCloserTo(
        selfPlayer.unit,
        mouseTarget,
      );
      if (targetCell && !window.underworld.isCellObstructed(targetCell)) {
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
export function clickHandlerOverworld(e: MouseEvent) {
  // Only handle overworld clicks when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  const mousePos = app.stage.toLocal(
    app.renderer.plugins.interaction.mouse.global,
  );
  let closestDist = Number.MAX_SAFE_INTEGER;
  let levelIndex;
  for (let i = 0; i < window.overworld.levels.length; i++) {
    const level = window.overworld.levels[i];
    const dist = distance(mousePos, level.location);
    if (dist < closestDist) {
      closestDist = dist;
      levelIndex = i;
    }
  }
  window.pie.sendData({
    type: MESSAGE_TYPES.VOTE_FOR_LEVEL,
    levelIndex,
  });
}
// Handle clicks on the game board
export function clickHandler(e: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  const mouseTarget = window.underworld.getCellFromCurrentMousePos();
  if (isOutOfBounds(mouseTarget)) {
    // Disallow click out of bounds
    return;
  }
  if (window.altDown) {
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
    if (window.underworld.turn_phase == turn_phase.PlayerTurns) {
      // Get current client's player
      const selfPlayer:
        | Player.IPlayer
        | undefined = window.underworld.players.find(
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
