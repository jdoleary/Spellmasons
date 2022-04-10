import { MESSAGE_TYPES } from '../MessageTypes';
import * as CardUI from '../CardUI';
import type * as Player from '../Player';
import floatingText from '../FloatingText';
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
import { closestLineSegmentIntersection } from '../collision/collisionMath';
import { targetBlue } from './colors';

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
    case 'ControlLeft':
    case 'ControlRight':
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
    case 'ControlLeft':
    case 'ControlRight':
      CardUI.toggleInspectMode(false);
      // Clear walk path on inspect mode off
      window.unitUnderlayGraphics.clear();
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


  // Show walk path if in inspect-mode (when holding control key):
  window.unitUnderlayGraphics.clear();
  if (!isOutOfBounds(mouseTarget)) {
    if (window.player) {
      // If in inspect-mode
      if (document.body.classList.contains('inspect-mode')) {
        // Show the player's current walk path
        const currentPlayerPath = findPath(window.player.unit, mouseTarget, window.underworld.pathingPolygons);
        if (currentPlayerPath.length) {
          window.unitUnderlayGraphics.lineStyle(4, 0xffffff, 1.0);
          window.unitUnderlayGraphics.moveTo(window.player.unit.x, window.player.unit.y);
          for (let point of currentPlayerPath) {
            window.unitUnderlayGraphics.lineTo(point.x, point.y);
          }
          const turnStopPoints = pointsEveryXDistanceAlongPath(window.player.unit, currentPlayerPath, window.player.unit.moveDistance, window.player.unit.distanceMovedThisTurn);
          for (let point of turnStopPoints) {
            window.unitUnderlayGraphics.drawCircle(point.x, point.y, 3);
          }
          // Always draw a stop circle at the end
          const lastPointInPath = currentPlayerPath[currentPlayerPath.length - 1]
          window.unitUnderlayGraphics.drawCircle(lastPointInPath.x, lastPointInPath.y, 3);
        }
      } else if (CardUI.areAnyCardsSelected()) {
        // Show the cast line
        // Players can only cast on what they can see:
        const castLine = { p1: window.player.unit, p2: mouseTarget };
        const intersection = closestLineSegmentIntersection(castLine, window.underworld.walls);
        window.unitUnderlayGraphics.lineStyle(3, targetBlue, 0.7);
        window.unitUnderlayGraphics.moveTo(castLine.p1.x, castLine.p1.y);
        if (intersection) {
          window.unitUnderlayGraphics.lineTo(intersection.x, intersection.y);
          // Draw a red line the rest of the way shoing that you cannot cast
          window.unitUnderlayGraphics.lineStyle(3, 0xff0000, 0.7);
          window.unitUnderlayGraphics.lineTo(castLine.p2.x, castLine.p2.y);
          window.unitUnderlayGraphics.drawCircle(castLine.p2.x, castLine.p2.y, 3);
          // Draw a circle where the cast stops
          window.unitUnderlayGraphics.moveTo(castLine.p2.x, castLine.p2.y);//test
          window.unitUnderlayGraphics.lineStyle(3, targetBlue, 0.7);
          window.unitUnderlayGraphics.drawCircle(intersection.x, intersection.y, 3);
        } else {
          window.unitUnderlayGraphics.lineTo(castLine.p2.x, castLine.p2.y);
          window.unitUnderlayGraphics.drawCircle(castLine.p2.x, castLine.p2.y, 3);

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
  e.stopPropagation();
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
        // See if the cast has obstructed line of sight
        if (!window.underworld.hasLineOfSight(selfPlayer.unit, target)) {
          floatingText({
            coords: target,
            text: `You must have line of sight in order to cast.`,
            style: { fill: 'red' }
          });
          // Cancel Casting
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
