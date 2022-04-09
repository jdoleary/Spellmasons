import { MESSAGE_TYPES } from '../MessageTypes';
import * as CardUI from '../CardUI';
import type * as Player from '../Player';
import floatingText, { orderedFloatingText } from '../FloatingText';
import {
  drawOnHoverCircle,
  isOutOfBounds,
  syncSpellEffectProjection,
  updatePlanningView,
  updateTooltipSelection,
} from './PlanningView';
import { View } from '../views';
import { findPath, pointsEveryXDistanceAlongPath } from '../Pathfinding';
import { polygonToPolygonLineSegments } from '../Polygon';
import { Vec2, add } from '../Vec';
import * as math from '../math';

export function keydownListener(event: KeyboardEvent) {
  // Only handle hotkeys when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  switch (event.code) {
    case 'Escape':
      CardUI.clearSelectedCards();
      break;
    case 'AltLeft':
      window.altDown = true;
      break;
    case 'Space':
      window.underworld.endMyTurn();
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

  const mouseTarget = window.underworld.getMousePos();
  // Show faint circle on clickable entities on hover:
  drawOnHoverCircle(mouseTarget);


  // Show walk path:
  window.unitUnderlayGraphics.clear();
  // Only show walk path if there are no cards selected
  // because if there are cards selected, left clicking will cast, not walk
  if (!CardUI.areAnyCardsSelected()) {
    if (window.player) {
      if (!isOutOfBounds(mouseTarget)) {
        const currentPlayerPath = findPath(window.player.unit, mouseTarget, window.underworld.pathingPolygons);
        if (currentPlayerPath.length) {
          window.unitUnderlayGraphics.lineStyle(4, 0xffffff, 1.0);
          window.unitUnderlayGraphics.moveTo(window.player.unit.x, window.player.unit.y);
          for (let point of currentPlayerPath) {
            window.unitUnderlayGraphics.lineTo(point.x, point.y);
          }
          const turnStopPoints = pointsEveryXDistanceAlongPath(window.player.unit, currentPlayerPath, window.player.unit.moveDistance);
          for (let point of turnStopPoints) {
            window.unitUnderlayGraphics.drawCircle(point.x, point.y, 3);
          }
          // Always draw a stop circle at the end
          const lastPointInPath = currentPlayerPath[currentPlayerPath.length - 1]
          window.unitUnderlayGraphics.drawCircle(lastPointInPath.x, lastPointInPath.y, 3);
        }
      }
    }
  }

  // Test pathing
  if (window.showDebug && window.player) {
    const mouseTarget = window.underworld.getMousePos();
    (document.getElementById('debug-info') as HTMLElement).innerText = `x:${Math.round(mouseTarget.x)}, y:${Math.round(mouseTarget.y)}`;
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
  // Right click to move
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
    if (selfPlayer && selfPlayer.unit.distanceMovedThisTurn < selfPlayer.unit.moveDistance) {
      window.unitUnderlayGraphics.clear();
      window.pie.sendData({
        type: MESSAGE_TYPES.MOVE_PLAYER,
        ...mouseTarget,
      });
    } else {
      floatingText({
        coords: mouseTarget,
        text: 'You are out of stamina. You must end your turn before moving farther.',
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
      const selfPlayer = window.player;
      // If the player casting is the current client player
      if (selfPlayer) {
        // cast the spell
        const target = mousePos;
        const cardIds = CardUI.getSelectedCardIds();
        const cards = CardUI.getSelectedCards();


        // Ensure that last card doesn't require a following card
        // If it does, warn the player that their card order won't do what
        // they are expecting it to do
        if (cards[cards.length - 1].requiresFollowingCard) {
          floatingText({
            coords: target,
            text: `${cards[cards.length - 1].id} only modifies cards on its right`,
            style: { fill: 'red' }
          });
          const elHints = document.querySelectorAll('.requires-following-card');
          const elHint = elHints.length ? elHints[elHints.length - 1] : undefined;
          // Remove then add 'blink' class to the "hint" outline so that
          // it will restart the animation to grab the user's attention.
          if (elHint) {
            elHint.classList.remove('blink');
            setTimeout(() => {
              elHint.classList.add('blink');
            }, 10);

          }
          // Then cancel casting:
          return
        }
        window.pie.sendData({
          type: MESSAGE_TYPES.SPELL,
          x: target.x,
          y: target.y,
          cards: cardIds,
        });
        CardUI.clearSelectedCards();
      } else {
        console.error("Attempting to cast while window.player is undefined");
      }
    } else {
      floatingText({
        coords: mousePos,
        text: 'You must wait for your turn to cast',
      });
    }
  }
}
