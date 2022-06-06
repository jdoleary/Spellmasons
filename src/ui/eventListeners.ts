import { MESSAGE_TYPES } from '../MessageTypes';
import * as CardUI from '../CardUI';
import type * as Unit from '../Unit';
import * as Vec from '../Vec';
import floatingText from '../FloatingText';
import {
  clearTooltipSelection,
  drawCircleUnderTarget,
  isOutOfBounds,
  runPredictions,
  updateTooltipSelection,
} from './PlanningView';
import { toggleMenu, View } from '../views';
import { pointsEveryXDistanceAlongPath } from '../Pathfinding';
import * as colors from './colors';
import type { Vec2 } from '../Vec';
import { distance, getCoordsAtDistanceTowardsTarget } from '../math';
import * as config from '../config';
import { cameraAutoFollow, getCamera, moveCamera } from '../PixiUtils';
import { toPolygon2LineSegments } from '../Polygon2';

export const keyDown = {
  w: false,
  a: false,
  s: false,
  d: false
}
// a UnitPath that is used to display the player's "walk rope"
// which shows the path that they will travel if they were
// to move towards the mouse cursor
let walkRopePath: Unit.UnitPath | undefined = undefined;

window.addEventListener('keydown', nonUnderworldKeydownListener);
function nonUnderworldKeydownListener(event: KeyboardEvent) {
  // Only handle hotkeys when NOT viewing the Game
  if (window.view == View.Game) {
    return;
  }
  switch (event.code) {
    case 'Escape':
      toggleMenu();
      break;
  }
}
export function keydownListener(event: KeyboardEvent) {
  // Only handle hotkeys when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  if (!window.underworld) {
    return
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
        // Otherwise finally toggle menu
        toggleMenu();
      }
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
    case 'KeyC':
      const mouseTarget = window.underworld.getMousePos();
      window.pie.sendData({
        type: MESSAGE_TYPES.PING,
        x: mouseTarget.x,
        y: mouseTarget.y
      });
      break;
    case 'KeyZ':
      // Make camera follow player unit 
      cameraAutoFollow(true)
      break;

  }
}

export function keyupListener(event: KeyboardEvent) {
  // Only handle hotkeys when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  switch (event.code) {
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
}

export function endTurnBtnListener(e: MouseEvent) {
  window.underworld.endMyTurn();
  e.preventDefault();
  e.stopPropagation();
  return false;
}

export function mouseMove(e?: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  if (!window.underworld) {
    return
  }

  if (window.MMBDown && e) {
    const { movementX, movementY } = e;
    const { zoom } = getCamera();
    cameraAutoFollow(false);
    moveCamera(-movementX / zoom, -movementY / zoom);
  }

  runPredictions();

  const mouseTarget = window.underworld.getMousePos();
  // TODO: optimize this function by not rerunning parts if mouse & player.unit position
  // havent changed since last call.

  // Show faint circle on clickable entities on hover:
  drawCircleUnderTarget(mouseTarget, 0.4, window.predictionGraphics);

  // Show walk path if in inspect-mode:
  window.walkPathGraphics.clear();
    if (window.player) {
      // If in inspect-mode
      if (document.body.classList.contains('inspect-mode')) {
        //
        // Show the player's current walk path (walk rope)
        //
        // The distance that the player can cover with their current stamina
        // is drawn in the stamina color.
        // There are dots dilineating how far the unit can move each turn.
        //
        walkRopePath = window.underworld.calculatePath(walkRopePath, Vec.round(window.player.unit), Vec.round(mouseTarget));
        const { points: currentPlayerPath } = walkRopePath;
        if (currentPlayerPath.length) {
          const turnStopPoints = pointsEveryXDistanceAlongPath(window.player.unit, currentPlayerPath, window.player.unit.staminaMax, window.player.unit.staminaMax - window.player.unit.stamina);
          window.walkPathGraphics.lineStyle(4, 0xffffff, 1.0);
          window.walkPathGraphics.moveTo(window.player.unit.x, window.player.unit.y);
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

  // Test pathing
  if (window.showDebug && window.player) {
    window.debugGraphics.clear();
    const mouseTarget = window.underworld.getMousePos();
    (document.getElementById('debug-info') as HTMLElement).innerText = `x:${Math.round(mouseTarget.x)}, y:${Math.round(mouseTarget.y)}; cellX: ${Math.round(mouseTarget.x / config.OBSTACLE_SIZE)}, cellY: ${Math.round(mouseTarget.y / config.OBSTACLE_SIZE)}`;
    // Draw the pathing walls
    const pathingWalls = window.underworld.pathingPolygons.map(toPolygon2LineSegments).flat();
    for (let lineSegment of pathingWalls) {
      window.debugGraphics.lineStyle(2, 0xffaabb, 1.0);
      window.debugGraphics.moveTo(lineSegment.p1.x, lineSegment.p1.y);
      window.debugGraphics.lineTo(lineSegment.p2.x, lineSegment.p2.y);
    }
    // Draw bounds that prevent movement
    for (let bound of window.underworld.liquidBounds) {
      window.debugGraphics.lineStyle(2, 0x0000ff, 1.0);
      window.debugGraphics.moveTo(bound.p1.x, bound.p1.y);
      window.debugGraphics.lineTo(bound.p2.x, bound.p2.y);
    }
    // Draw walls that prevent line of sight 
    for (let wall of window.underworld.walls) {
      window.debugGraphics.lineStyle(2, 0x00ff00, 1.0);
      window.debugGraphics.moveTo(wall.p1.x, wall.p1.y);
      window.debugGraphics.lineTo(wall.p2.x, wall.p2.y);
    }
    // Draw underworld limits
    window.debugGraphics.lineStyle(2, 0xff0000, 1.0);
    window.debugGraphics.moveTo(window.underworld.limits.xMin, window.underworld.limits.yMin);
    window.debugGraphics.lineTo(window.underworld.limits.xMax, window.underworld.limits.yMin);
    window.debugGraphics.lineTo(window.underworld.limits.xMax, window.underworld.limits.yMax);
    window.debugGraphics.lineTo(window.underworld.limits.xMin, window.underworld.limits.yMax);
    window.debugGraphics.lineTo(window.underworld.limits.xMin, window.underworld.limits.yMin);

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
export function mouseDownHandler(e: MouseEvent) {
  if (e.button == 1) {
    // setMMBDown so camera will be dragged around
    window.setMMBDown(true);
    e.preventDefault();
    return false;
  }
}
export function mouseUpHandler(e: MouseEvent) {
  // Turn MMBDown off for any click to protect against it getting stuck
  // as flagged "down"
  window.setMMBDown(false);
}
export function onWindowBlur() {
  // Turn off keyboard and mouse flags when the document loses focus
  // To protect against the case where a user has middle mouse down
  // while they alt tab, which - without the following line -
  // would mean that it's stuck "up" when they return to the game
  // if they were to release it when this document wasn't focused
  window.setMMBDown(false);
}
// Handle clicks on the game board
export function clickHandler(e: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  if (!window.underworld) {
    return;
  }
  const mousePos = window.underworld.getMousePos();
  if (isOutOfBounds(mousePos)) {
    // Disallow click out of bounds
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

        const unitAtCastLocation = window.underworld.getUnitAt(target);
        // If cast target is out of attack range, disallow cast
        let targetOutOfRange = false;
        if (unitAtCastLocation) {
          // If any part of the targeted unit is within range allow the cast
          // This is why this adds +config.COLLISION_MESH_RADIUS to the range check
          targetOutOfRange = distance(selfPlayer.unit, unitAtCastLocation) > selfPlayer.unit.attackRange + config.COLLISION_MESH_RADIUS;
        } else if (distance(selfPlayer.unit, target) > selfPlayer.unit.attackRange) {
          targetOutOfRange = true;
        }

        if (targetOutOfRange) {
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
