import { MESSAGE_TYPES } from '../MessageTypes';
import * as CardUI from '../CardUI';
import floatingText from '../FloatingText';
import {
  clearTooltipSelection,
  drawCircleUnderTarget,
  isOutOfBounds,
  syncSpellEffectProjection,
  updateTooltipSelection,
} from './PlanningView';
import { toggleMenu, View } from '../views';
import { findPath, pointsEveryXDistanceAlongPath } from '../Pathfinding';
import { polygonToPolygonLineSegments } from '../Polygon';
import * as colors from './colors';
import type { Vec2 } from '../Vec';
import { distance, getCoordsAtDistanceTowardsTarget } from '../math';
import * as config from '../config';
import { cameraAutoFollow } from '../PixiUtils';

export const keyDown = {
  w: false,
  a: false,
  s: false,
  d: false
}

export function keydownListener(event: KeyboardEvent) {
  if (window.view == View.Menu && event.code === 'Escape') {
    window.closeMenu();
    return;
  }
  if (window.view == View.Upgrade && event.code === 'Escape') {
    toggleMenu();
    return;
  }
  // Only handle hotkeys when viewing the Game
  if (window.view !== View.Game) {
    return;
  }

  // Possibly handle hotkey for Jprompt:
  // note: :last-child targets the top most prompt if there are more than one
  const promptYesBtn = document.querySelector(`.prompt:last-child .yes[data-key="${event.code}"]`) as HTMLElement;
  if (promptYesBtn) {
    promptYesBtn.click();
    // Return immediately, prompt hotkey overrides other hotkeys
    return;
  }
  // note: :last-child targets the top most prompt if there are more than one
  const promptNoBtn = document.querySelector(`.prompt:last-child .no[data-key="${event.code}"]`) as HTMLElement;
  if (promptNoBtn) {
    promptNoBtn.click();
    // Return immediately, prompt hotkey overrides other hotkeys
    return;
  }

  switch (event.code) {
    case 'Escape':
      const thereWasTooltipActive = clearTooltipSelection();
      const thereWereCardsSelected = CardUI.areAnyCardsSelected();
      CardUI.clearSelectedCards();
      if (!thereWasTooltipActive && !thereWereCardsSelected) {
        toggleMenu();
      }
      break;
    case 'AltLeft':
      window.altDown = true;
      break;
    case 'Space':
      window.underworld.endMyTurn();
      break;
    case 'KeyF':
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
    // Camera movement
    case 'KeyW':
      keyDown.w = true;
      cameraAutoFollow(false);
      break;
    case 'KeyA':
      keyDown.a = true;
      cameraAutoFollow(false);
      break;
    case 'KeyS':
      keyDown.s = true;
      cameraAutoFollow(false);
      break;
    case 'KeyD':
      keyDown.d = true;
      cameraAutoFollow(false);
      break;
  }
  // Invoke mouse move handler to update spell projections
  // Lots of UI is updated when the mouse moves, but keys
  // also change what the UI will
  mouseMove();
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
    case 'KeyF':
      CardUI.toggleInspectMode(false);
      // Clear walk path on inspect mode off
      window.walkPathGraphics.clear();
      break;
    // Camera movement
    case 'KeyW':
      keyDown.w = false;
      break;
    case 'KeyA':
      keyDown.a = false;
      break;
    case 'KeyS':
      keyDown.s = false;
      break;
    case 'KeyD':
      keyDown.d = false;
      break;
  }
  mouseMove();
}

export function endTurnBtnListener(e: MouseEvent) {
  window.underworld.endMyTurn();
  e.preventDefault();
  e.stopPropagation();
  return false;
}

export function mouseMove() {
  // Only handle clicks when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  if (!window.underworld) {
    return
  }
  // Show target hover
  syncSpellEffectProjection();

  const mouseTarget = window.underworld.getMousePos();

  // Show faint circle on clickable entities on hover:
  drawCircleUnderTarget(mouseTarget, 0.4, window.dryRunGraphics);

  // Show walk path if in inspect-mode:
  window.walkPathGraphics.clear();
  if (!isOutOfBounds(mouseTarget)) {
    if (window.player) {
      // If in inspect-mode
      if (document.body.classList.contains('inspect-mode')) {
        //
        // Show the player's current walk path
        //
        // The distance that the player can cover with their current stamina
        // is drawn in the stamina color.
        // There are dots dilineating how far the unit can move each turn.
        //
        let currentPlayerPath = findPath(window.player.unit, mouseTarget, window.underworld.pathingPolygons);
        // yAxisOffset moves the pathing points down so they track along the unit's feet instead of their centerline
        // (because their centerline is the actual unit x,y but their tracking along feet makes sense to the user for pathing)
        const yAxisOffset = config.COLLISION_MESH_RADIUS * config.NON_HEAVY_UNIT_SCALE
        currentPlayerPath = currentPlayerPath.map(v => ({ x: v.x, y: v.y + yAxisOffset }));
        if (currentPlayerPath.length) {
          const turnStopPoints = pointsEveryXDistanceAlongPath(window.player.unit, currentPlayerPath, window.player.unit.staminaMax, window.player.unit.staminaMax - window.player.unit.stamina);
          window.walkPathGraphics.lineStyle(4, 0xffffff, 1.0);
          window.walkPathGraphics.moveTo(window.player.unit.x, window.player.unit.y + yAxisOffset);
          let lastPoint: Vec2 = window.player.unit;
          let distanceCovered = 0;
          const distanceLeftToMove = window.player.unit.stamina;
          for (let i = 0; i < currentPlayerPath.length; i++) {
            const point = currentPlayerPath[i];
            if (point) {
              const thisLineDistance = distance(lastPoint, point);
              if (distanceCovered > distanceLeftToMove) {
                window.walkPathGraphics.lineStyle(4, 0xffffff, 1.0);
                window.walkPathGraphics.lineTo(point.x, point.y);
              } else {
                window.walkPathGraphics.lineStyle(4, colors.stamina, 1.0);
                if (distanceCovered + thisLineDistance > distanceLeftToMove) {
                  // Draw up to the firstStop with the stamina color
                  const pointAtWhichUnitOutOfStamina = getCoordsAtDistanceTowardsTarget(lastPoint, point, distanceLeftToMove - distanceCovered);
                  window.walkPathGraphics.lineTo(pointAtWhichUnitOutOfStamina.x, pointAtWhichUnitOutOfStamina.y);
                  window.walkPathGraphics.lineStyle(4, 0xffffff, 1.0);
                  window.walkPathGraphics.lineTo(point.x, point.y);
                } else {
                  window.walkPathGraphics.lineTo(point.x, point.y);
                }
              }
              distanceCovered += distance(lastPoint, point);
              lastPoint = point;
            }
          }

          // Draw the points along the path at which the unit will stop on each turn
          for (let i = 0; i < turnStopPoints.length; i++) {
            if (i == 0 && distanceLeftToMove > 0) {
              window.walkPathGraphics.lineStyle(4, colors.stamina, 1.0);
            } else {
              window.walkPathGraphics.lineStyle(4, 0xffffff, 1.0);
            }
            const point = turnStopPoints[i];
            if (point) {
              window.walkPathGraphics.drawCircle(point.x, point.y, 3);
            }
          }
          if (turnStopPoints.length == 0 && distanceLeftToMove > 0) {
            window.walkPathGraphics.lineStyle(4, colors.stamina, 1.0);
          } else {
            window.walkPathGraphics.lineStyle(4, 0xffffff, 1.0);
          }
          // Draw a stop circle at the end
          const lastPointInPath = currentPlayerPath[currentPlayerPath.length - 1]
          if (lastPointInPath) {
            window.walkPathGraphics.drawCircle(lastPointInPath.x, lastPointInPath.y, 3);
          }
        }
      } else if (CardUI.areAnyCardsSelected()) {
        // Show the cast line
        // Players can only cast within their attack range
        const castLine = { p1: window.player.unit, p2: mouseTarget };

        window.walkPathGraphics.lineStyle(3, colors.targetBlue, 0.7);
        window.walkPathGraphics.moveTo(castLine.p1.x, castLine.p1.y);
        if (distance(castLine.p1, castLine.p2) > window.player.unit.attackRange) {
          const endOfRange = getCoordsAtDistanceTowardsTarget(castLine.p1, castLine.p2, window.player.unit.attackRange);
          window.walkPathGraphics.lineTo(endOfRange.x, endOfRange.y);
          // Draw a red line the rest of the way shoing that you cannot cast
          window.walkPathGraphics.lineStyle(3, 0x333333, 0.7);
          window.walkPathGraphics.lineTo(castLine.p2.x, castLine.p2.y);
          window.walkPathGraphics.drawCircle(castLine.p2.x, castLine.p2.y, 3);
          // Draw a circle where the cast stops
          window.walkPathGraphics.moveTo(castLine.p2.x, castLine.p2.y);//test
          window.walkPathGraphics.lineStyle(3, colors.targetBlue, 0.7);
          window.walkPathGraphics.drawCircle(endOfRange.x, endOfRange.y, 3);
        } else {
          window.walkPathGraphics.lineTo(castLine.p2.x, castLine.p2.y);
          window.walkPathGraphics.drawCircle(castLine.p2.x, castLine.p2.y, 3);
        }
      }
    }
  }

  // Test pathing
  if (window.showDebug && window.player) {
    window.debugGraphics.clear();
    const mouseTarget = window.underworld.getMousePos();
    (document.getElementById('debug-info') as HTMLElement).innerText = `x:${Math.round(mouseTarget.x)}, y:${Math.round(mouseTarget.y)}`;
    // Draw the pathing walls
    window.debugGraphics.lineStyle(3, 0x00aabb, 0.3);
    const pathingWalls = window.underworld.pathingPolygons.map(polygonToPolygonLineSegments).flat();
    for (let lineSegment of pathingWalls) {
      window.debugGraphics.moveTo(lineSegment.p1.x, lineSegment.p1.y);
      window.debugGraphics.lineTo(lineSegment.p2.x, lineSegment.p2.y);
    }
    // Draw bounds that prevent movement
    for (let bound of window.underworld.bounds) {
      window.debugGraphics.lineStyle(4, 0x0000ff, 1.0);
      window.debugGraphics.moveTo(bound.p1.x, bound.p1.y);
      window.debugGraphics.lineTo(bound.p2.x, bound.p2.y);
    }
    // Draw walls that prevent line of sight 
    for (let wall of window.underworld.walls) {
      window.debugGraphics.lineStyle(2, 0x00ff00, 0.5);
      window.debugGraphics.moveTo(wall.p1.x, wall.p1.y);
      window.debugGraphics.lineTo(wall.p2.x, wall.p2.y);
    }
  }
}
// Handle right click on game board
export function contextmenuHandler(e: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  if ((e.target as HTMLElement).closest('.card')) {
    console.log('ignoring right click on card element')
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
    // If player is able to move
    if (window.player) {
      if (window.player.unit.stamina > 0) {
        window.walkPathGraphics.clear();
        window.pie.sendData({
          type: MESSAGE_TYPES.MOVE_PLAYER,
          ...mouseTarget,
        });
      } else {
        floatingText({
          coords: mouseTarget,
          text: 'You are out of stamina.\nEnd your turn to get more.',
        });
      }
    } else {
      console.error('Cannot move, window.player = undefined');
    }
  } else {
    floatingText({
      coords: mouseTarget,
      text: 'You must wait for your turn\nto move',
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
        const lastCard = cards[cards.length - 1];
        if (lastCard && lastCard.requiresFollowingCard) {
          floatingText({
            coords: target,
            text: `${lastCard.id} only modifies\ncards on its right`,
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
        // If cast target is out of attack range...
        if (distance(selfPlayer.unit, target) > selfPlayer.unit.attackRange) {
          floatingText({
            coords: target,
            text: `Target out of range`,
            style: { fill: 'red' }
          });
          // Cancel Casting
          return
        }

        // Abort casting if there is no unitAtCastLocation
        // unless the first card (like AOE) specifically allows casting
        // on non unit targets
        const unitAtCastLocation = window.underworld.getUnitAt(target);
        const pickupAtCastLocation = window.underworld.getPickupAt(target);
        if ((!unitAtCastLocation && !pickupAtCastLocation) && cards.length && cards[0] && !cards[0].allowNonUnitTarget) {
          floatingText({
            coords: target,
            text: 'No Target!'
          })
          // Cancel Casting
          return;
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
  } else {
    updateTooltipSelection(mousePos);
  }
}
