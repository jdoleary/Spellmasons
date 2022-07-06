import { MESSAGE_TYPES } from '../MessageTypes';
import * as CardUI from '../CardUI';
import * as Unit from '../Unit';
import * as Vec from '../Vec';
import floatingText from '../FloatingText';
import {
  clearSpellEffectProjection,
  clearTooltipSelection,
  drawCircleUnderTarget,
  isOutOfBounds,
  runPredictions,
  updateTooltipSelection,
} from './PlanningView';
import { toggleMenu, View } from '../views';
import * as config from '../config';
import { cameraAutoFollow, getCamera, moveCamera } from '../PixiUtils';
import { vec2ToOneDimentionIndex } from '../WaveFunctionCollapse';
import { getEndOfRangeTarget, isOutOfRange } from '../PlayerUtils';
import { closestLineSegmentIntersection } from '../collision/lineSegment';
import { distance, getCoordsAtDistanceTowardsTarget } from '../math';

export const keyDown = {
  w: false,
  a: false,
  s: false,
  d: false
}

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
export function keypressListener(event: KeyboardEvent) {
  // Only handle hotkeys when viewing the Game
  if (window.view !== View.Game) {
    return;
  }
  if (!window.underworld) {
    return
  }

  switch (event.code) {
    case 'KeyI':
      CardUI.toggleInventory(undefined, undefined);
      break;
    case 'Space':
      window.underworld.endMyTurn();
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
    case 'Tab':
      CardUI.toggleInventory(undefined, undefined);
      event.preventDefault();
      break;
    case 'Backspace':
      CardUI.deselectLastCard();
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
  const mouseTarget = window.underworld.getMousePos();

  // RMB
  if (window.player) {

    if (window.RMBDown) {
      if (window.underworld.isMyTurn()) {
        // If player is able to move
        if (window.player.unit.stamina > 0) {
          // TODO: Notify multiplayer clients
          // window.pie.sendData({
          //   type: MESSAGE_TYPES.MOVE_PLAYER,
          //   ...moveTarget,
          // });
          // window.underworld.pathingLineSegments
          const intersection = closestLineSegmentIntersection({ p1: window.player.unit, p2: mouseTarget }, window.underworld.pathingLineSegments)
          window.debugGraphics.clear();
          window.debugGraphics.lineStyle(3, 0xff0000, 1.0);
          if (intersection) {
            window.debugGraphics.drawCircle(intersection?.x, intersection?.y, 10)
          }
          // Move up to but not onto intersection or else unit will get stuck ON linesegment
          const adjustedMoveTarget = intersection ? getCoordsAtDistanceTowardsTarget(window.player.unit, intersection, distance(window.player.unit, intersection) - 1) : mouseTarget;
          Unit.moveDirectly(window.player.unit, adjustedMoveTarget)
        } else {
          floatingText({
            coords: mouseTarget,
            text: 'Out of stamina',
          });
          // This is a hack to prevent it from continuing to notify out of stamina over and over.
          // If RMBDown is ever used for more than hold to move, this should be replaced with a better solution.
          window.setRMBDown(false);
        }
      } else {
        floatingText({
          coords: mouseTarget,
          text: 'You must wait for your turn\nto move',
        });
      }
    }
  }

  runPredictions();

  // TODO: optimize this function by not rerunning parts if mouse & player.unit position
  // havent changed since last call.

  // Show faint circle on clickable entities on hover:
  drawCircleUnderTarget(mouseTarget, 1.0, window.planningViewGraphics);


  // Test pathing
  if (window.showDebug && window.player) {
    window.debugGraphics.clear();
    const mouseTarget = window.underworld.getMousePos();
    const cellX = Math.round(mouseTarget.x / config.OBSTACLE_SIZE);
    const cellY = Math.round(mouseTarget.y / config.OBSTACLE_SIZE);
    const originalTile = window.map ? window.map.tiles[vec2ToOneDimentionIndex({ x: cellX, y: cellY }, window.map.width)] : undefined;
    const originalTileImage = originalTile ? originalTile.image : '';
    (document.getElementById('debug-info') as HTMLElement).innerText = `x:${Math.round(mouseTarget.x)}, y:${Math.round(mouseTarget.y)}
    cellX: ${cellX}, cellY: ${cellY}
    tile: ${originalTileImage}`;
    // Debug draw cell that mouse is hovered over
    // window.debugGraphics.lineStyle(3, 0xff0000, 1);
    // window.debugGraphics.moveTo(cellX * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2);
    // window.debugGraphics.lineTo(cellX * config.OBSTACLE_SIZE + config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2);
    // window.debugGraphics.lineTo(cellX * config.OBSTACLE_SIZE + config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE + config.OBSTACLE_SIZE / 2);
    // window.debugGraphics.lineTo(cellX * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE + config.OBSTACLE_SIZE / 2);
    // window.debugGraphics.lineTo(cellX * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2);
    // Draw the pathing walls
    for (let lineSegment of window.underworld.pathingLineSegments) {
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
    // window.debugGraphics.lineStyle(2, 0xff0000, 1.0);
    // window.debugGraphics.moveTo(window.underworld.limits.xMin, window.underworld.limits.yMin);
    // window.debugGraphics.lineTo(window.underworld.limits.xMax, window.underworld.limits.yMin);
    // window.debugGraphics.lineTo(window.underworld.limits.xMax, window.underworld.limits.yMax);
    // window.debugGraphics.lineTo(window.underworld.limits.xMin, window.underworld.limits.yMax);
    // window.debugGraphics.lineTo(window.underworld.limits.xMin, window.underworld.limits.yMin);

  }
}
export function contextmenuHandler(e: MouseEvent) {
  // Prevent opening context menu on right click
  e.preventDefault();
  e.stopPropagation();
}
export function mouseDownHandler(e: MouseEvent) {
  if (e.button == 1) {
    // setMMBDown so camera will be dragged around
    window.setMMBDown(true);
    e.preventDefault();
  } else if (e.button == 2) {
    window.setRMBDown(true);
    e.preventDefault();
  }
}
export function mouseUpHandler(e: MouseEvent) {
  // Turn MMBDown off for any click to protect against it getting stuck
  // as flagged "down"
  window.setMMBDown(false);
  if (window.player) {
    window.player.unit.path = undefined;
  }
  if (e.button == 2) {
    window.setRMBDown(false);
    e.preventDefault();
  }
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
export function clickHandler(_e: MouseEvent) {
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
        let target = mousePos;
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
        if (isOutOfRange(selfPlayer, mousePos)) {
          // If the mouse is out of range, but there is a target at end range,
          // assume the user is trying to cast at the end of their range.
          const endRangeTarget = getEndOfRangeTarget(selfPlayer, target);
          if (window.underworld.hasInitialTarget(endRangeTarget)) {
            target = endRangeTarget;
          } else {
            // If there is no target at end range, just show that they are trying to cast out of range
            floatingText({
              coords: target,
              text: 'Out of Range!'
            })
            // Cancel Casting
            return;
          }
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
        clearSpellEffectProjection();

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
