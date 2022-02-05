import { MESSAGE_TYPES } from '../MessageTypes';
import * as CardUI from '../CardUI';
import type * as Player from '../Player';
import floatingText from '../FloatingText';
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
    case 'Digit1':
      CardUI.selectCardByIndex(0);
      break;
    case 'Digit2':
      CardUI.selectCardByIndex(1);
      break;
    case 'Digit3':
      CardUI.selectCardByIndex(2);
      break;
    case 'Digit4':
      CardUI.selectCardByIndex(3);
      break;
    case 'Digit5':
      CardUI.selectCardByIndex(4);
      break;
    case 'Digit6':
      CardUI.selectCardByIndex(5);
      break;
    case 'Digit7':
      CardUI.selectCardByIndex(6);
      break;
    case 'Digit8':
      CardUI.selectCardByIndex(7);
      break;
    case 'Digit9':
      CardUI.selectCardByIndex(8);
      break;
    case 'Digit0':
      CardUI.selectCardByIndex(9);
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

export function mousemoveHandler(e: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  // Show target hover
  syncSpellEffectProjection();
}
// Handle right click on game board
export function contextmenuHandler(e: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  e.preventDefault();
  const mouseTarget = window.underworld.getMousePos();
  if (isOutOfBounds(mouseTarget)) {
    // Disallow click out of bounds
    return;
  }
  if (window.underworld.isMyTurn()) {
    // Get current client's player
    const selfPlayer:
      | Player.IPlayer
      | undefined = window.underworld.players.find(
        (p) => p.clientId === window.clientId,
      );
    // If player hasn't already moved this turn...
    if (selfPlayer && !selfPlayer.unit.thisTurnMoved) {
      window.pie.sendData({
        type: MESSAGE_TYPES.MOVE_PLAYER,
        ...mouseTarget,
      });
    } else {
      floatingText({
        coords: mouseTarget,
        text: 'You cannot move more than once per turn.',
      });
    }
  } else {
    floatingText({
      coords: mouseTarget,
      text: 'You must wait for your turn to move',
    });

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
  const mouseTarget = window.underworld.getMousePos();
  if (isOutOfBounds(mouseTarget)) {
    // Disallow click out of bounds
    return;
  }
  // Update planning view
  updatePlanningView();

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
    // Only allow casting in the proper phase and on player's turn only
    if (window.underworld.isMyTurn()) {
      // Get current client's player
      const selfPlayer:
        | Player.IPlayer
        | undefined = window.underworld.players.find(
          (p) => p.clientId === window.clientId,
        );
      // If the player casting is the current client player
      if (selfPlayer) {
        // cast the spell
        // getUnitAt corrects to the nearest Unit if there is one, otherwise
        // allow casting right on the mouseTarget
        const target = window.underworld.getUnitAt(mouseTarget) || mouseTarget;
        window.pie.sendData({
          type: MESSAGE_TYPES.SPELL,
          x: target.x,
          y: target.y,
          cards: CardUI.getSelectedCards(),
        });
        CardUI.clearSelectedCards();
      } else {
        console.error("Attempting to cast while clientId is unassociated with existing players");
      }
    } else {
      floatingText({
        coords: mouseTarget,
        text: 'You must wait for your turn to cast',
      });
    }
  }
}
