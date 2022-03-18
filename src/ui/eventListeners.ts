import { MESSAGE_TYPES } from '../MessageTypes';
import * as CardUI from '../CardUI';
import type * as Player from '../Player';
import floatingText from '../FloatingText';
import {
  isOutOfBounds,
  syncSpellEffectProjection,
  updatePlanningView,
  updateTooltipSelection,
} from './PlanningView';
import { app } from '../PixiUtils';
import { distance } from '../math';
import { View } from '../views';
import { calculateManaCost } from '../cards/cardUtils';
import * as math from '../math';
import { findPath } from '../Pathfinding';
import { polygonToPolygonLineSegments } from '../Polygon';

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
    case 'Backspace':
      CardUI.deselectLastCard();
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

  // Test pathing
  window.debugGraphics.clear()
  if (window.showDebug && window.player) {
    const mouseTarget = window.underworld.getMousePos();
    (document.getElementById('debug-info') as HTMLElement).innerText = `x:${Math.round(mouseTarget.x)}, y:${Math.round(mouseTarget.y)}`;
    const path = findPath(window.player.unit, mouseTarget, window.underworld.pathingPolygons);
    if (path.length) {
      window.debugGraphics.lineStyle(3, 0xffffff, 1.0);
      window.debugGraphics.moveTo(path[0].x, path[0].y);
      // Draw the path
      for (let point of path) {
        window.debugGraphics.drawCircle(point.x, point.y, 4);
        window.debugGraphics.lineTo(point.x, point.y);
      }
    }
    // Draw the pathing walls
    window.debugGraphics.lineStyle(3, 0x00aabb, 0.3);
    const pathingWalls = window.underworld.pathingPolygons.map(polygonToPolygonLineSegments).flat();
    for (let lineSegment of pathingWalls) {
      window.debugGraphics.moveTo(lineSegment.p1.x, lineSegment.p1.y);
      window.debugGraphics.lineTo(lineSegment.p2.x, lineSegment.p2.y);
    }
  }
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
// Handle clicks on the game board
export function clickHandler(e: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  const mousePos = window.underworld.getMousePos();
  if (isOutOfBounds(mousePos)) {
    // Disallow click out of bounds
    return;
  }
  updateTooltipSelection(mousePos);
  // Update planning view
  updatePlanningView();

  if (window.altDown) {
    window.pie.sendData({
      type: MESSAGE_TYPES.PING,
      x: mousePos.x,
      y: mousePos.y,
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
        const target = window.underworld.getUnitAt(mousePos) || mousePos;
        const cardIds = CardUI.getSelectedCardIds();
        const cards = CardUI.getSelectedCards();

        const manaCost = calculateManaCost(cards, math.distance(selfPlayer.unit, target), selfPlayer);
        if (manaCost <= selfPlayer.unit.mana) {
          window.pie.sendData({
            type: MESSAGE_TYPES.SPELL,
            x: target.x,
            y: target.y,
            cards: cardIds,
          });
          CardUI.clearSelectedCards();
        } else {
          floatingText({
            coords: target,
            text: 'Insufficient mana!',
          });
        }
      } else {
        console.error("Attempting to cast while clientId is unassociated with existing players");
      }
    } else {
      floatingText({
        coords: mousePos,
        text: 'You must wait for your turn to cast',
      });
    }
  }
}
