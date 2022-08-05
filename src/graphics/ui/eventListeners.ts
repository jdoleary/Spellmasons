import { MESSAGE_TYPES } from '../../types/MessageTypes';
import * as CardUI from './CardUI';
import * as Unit from '../../entity/Unit';
import floatingText from '../FloatingText';
import {
  clearSpellEffectProjection,
  clearTooltipSelection,
  drawCircleUnderTarget,
  isOutOfBounds,
  runPredictions,
  updateTooltipSelection,
} from '../PlanningView';
import { toggleMenu, View } from '../../views';
import * as config from '../../config';
import { app, cameraAutoFollow, getCamera, moveCamera } from '../PixiUtils';
import { getEndOfRangeTarget, isOutOfRange } from '../../PlayerUtils';
import { vec2ToOneDimentionIndex, vec2ToOneDimentionIndexPreventWrap } from '../../jmath/ArrayUtil';
import * as Vec from '../../jmath/Vec';
import { Vec2 } from '../../jmath/Vec';
import { distance, getCoordsAtDistanceTowardsTarget } from '../../jmath/math';
import * as colors from '../../graphics/ui/colors';
import { pointsEveryXDistanceAlongPath } from '../../jmath/Pathfinding';
import Underworld from '../../Underworld';
import { toLineSegments } from '../../jmath/Polygon2';
import { closestLineSegmentIntersection } from '../../jmath/lineSegment';
import { allUnits } from '../../entity/units';
import { Faction } from '../../types/commonTypes';
import * as Freeze from '../../cards/freeze';

export const keyDown = {
  f: false,
  w: false,
  a: false,
  s: false,
  d: false
}
// a UnitPath that is used to display the player's "walk rope"
// which shows the path that they will travel if they were
// to move towards the mouse cursor
let walkRopePath: Unit.UnitPath | undefined = undefined;

globalThis.addEventListener('keydown', nonUnderworldKeydownListener);
function nonUnderworldKeydownListener(event: KeyboardEvent) {
  // Only handle hotkeys when NOT viewing the Game
  if (globalThis.view == View.Game) {
    return;
  }
  switch (event.code) {
    case 'Escape':
      toggleMenu();
      event.stopImmediatePropagation();
      break;
  }
}
export function keypressListener(underworld: Underworld, event: KeyboardEvent) {
  // Only handle hotkeys when viewing the Game
  if (globalThis.view !== View.Game) {
    return;
  }
  if (!underworld) {
    return
  }

  switch (event.code) {
    case 'KeyI':
      CardUI.toggleInventory(undefined, undefined, underworld);
      break;
    case 'Space':
      underworld.endMyTurn();
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
export function keydownListener(underworld: Underworld, event: KeyboardEvent) {
  // Only handle hotkeys when viewing the Game
  if (globalThis.view !== View.Game) {
    return;
  }
  if (!underworld) {
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
      CardUI.clearSelectedCards(underworld);
      if (!thereWasTooltipActive && !thereWereCardsSelected) {
        // Otherwise finally toggle menu
        toggleMenu();
      }
      break;
    case 'Tab':
      CardUI.toggleInventory(undefined, undefined, underworld);
      event.preventDefault();
      break;
    case 'Backspace':
      CardUI.deselectLastCard();
      break;
    case 'KeyF':
      keyDown.f = true;
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
      const mouseTarget = underworld.getMousePos();
      underworld.pie.sendData({
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

export function keyupListener(underworld: Underworld, event: KeyboardEvent) {
  // Only handle hotkeys when viewing the Game
  if (globalThis.view !== View.Game) {
    return;
  }
  switch (event.code) {
    case 'KeyF':
      keyDown.f = false;
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

export function endTurnBtnListener(underworld: Underworld, e: MouseEvent) {
  underworld.endMyTurn();
  e.preventDefault();
  e.stopPropagation();
  return false;
}

export function mouseMove(underworld: Underworld, e?: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (globalThis.view !== View.Game) {
    return;
  }
  if (!underworld) {
    return
  }

  if (globalThis.MMBDown && e) {
    const { movementX, movementY } = e;
    const { zoom } = getCamera();
    cameraAutoFollow(false);
    moveCamera(-movementX / zoom, -movementY / zoom);
  }
  const mouseTarget = underworld.getMousePos();

  // RMB
  if (globalThis.player) {
    if (keyDown.f) {
      drawWalkRope(mouseTarget, underworld);
    } else {
      globalThis.walkPathGraphics?.clear();
    }
    if (globalThis.RMBDown) {
      if (underworld.isMyTurn()) {
        // If player is able to move
        if (Unit.canMove(globalThis.player.unit)) {
          // Move towards mouseTarget, but stop pathing where the direct path intersects a wall
          // This ensures that the player will always move in the direction of the mouse
          // and won't path in an unexpected direction to attempt to get to the final destination.
          const intersection = closestLineSegmentIntersection({ p1: globalThis.player.unit, p2: mouseTarget }, underworld.walls) || mouseTarget;
          Unit._moveTowards(globalThis.player.unit, intersection, underworld);
        } else {
          if (!globalThis.notifiedOutOfStamina) {
            floatingText({
              coords: mouseTarget,
              text: 'Out of stamina',
            });
            globalThis.notifiedOutOfStamina = true;
          }
        }
      } else {
        floatingText({
          coords: mouseTarget,
          text: 'You must wait for your turn\nto move',
        });
      }
    }
  }

  runPredictions(underworld);

  // TODO: optimize this function by not rerunning parts if mouse & player.unit position
  // havent changed since last call.

  // Show faint circle on clickable entities on hover:
  drawCircleUnderTarget(mouseTarget, underworld, 1.0, globalThis.planningViewGraphics);


  // Test pathing
  if (globalThis.showDebug && globalThis.player) {
    globalThis.debugGraphics?.clear();

    // Draw player path
    const path = globalThis.player.unit.path;
    if (path && path.points[0]) {
      globalThis.debugGraphics?.lineStyle(4, 0x00ff00, 1.0);
      globalThis.debugGraphics?.moveTo(globalThis.player.unit.x, globalThis.player.unit.y);
      for (let point of path.points) {
        globalThis.debugGraphics?.lineTo(point.x, point.y);
      }
    }
    const mouseTarget = underworld.getMousePos();
    const cellX = Math.round(mouseTarget.x / config.OBSTACLE_SIZE);
    const cellY = Math.round(mouseTarget.y / config.OBSTACLE_SIZE);
    const originalTile = globalThis.map ? globalThis.map.tiles[vec2ToOneDimentionIndexPreventWrap({ x: cellX, y: cellY }, globalThis.map.width)] : undefined;
    const originalTileImage = originalTile ? originalTile.image : '';
    (document.getElementById('debug-info') as HTMLElement).innerText = `x:${Math.round(mouseTarget.x)}, y:${Math.round(mouseTarget.y)}
    cellX: ${cellX}, cellY: ${cellY}
    tile: ${originalTileImage}`;
    // Debug draw cell that mouse is hovered over
    // globalThis.debugGraphics?.lineStyle(3, 0xff0000, 1);
    // globalThis.debugGraphics?.moveTo(cellX * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2);
    // globalThis.debugGraphics?.lineTo(cellX * config.OBSTACLE_SIZE + config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2);
    // globalThis.debugGraphics?.lineTo(cellX * config.OBSTACLE_SIZE + config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE + config.OBSTACLE_SIZE / 2);
    // globalThis.debugGraphics?.lineTo(cellX * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE + config.OBSTACLE_SIZE / 2);
    // globalThis.debugGraphics?.lineTo(cellX * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2);
    // Draw the pathing walls
    for (let lineSegment of underworld.pathingLineSegments) {
      globalThis.debugGraphics?.lineStyle(2, 0xffaabb, 1.0);
      globalThis.debugGraphics?.moveTo(lineSegment.p1.x, lineSegment.p1.y);
      globalThis.debugGraphics?.lineTo(lineSegment.p2.x, lineSegment.p2.y);
    }
    // Draw liquid polygons
    for (let lineSegment of underworld.liquidPolygons.map(toLineSegments).flat()) {
      globalThis.debugGraphics?.lineStyle(4, 0x34b7eb, 1.0);
      globalThis.debugGraphics?.moveTo(lineSegment.p1.x, lineSegment.p1.y);
      globalThis.debugGraphics?.lineTo(lineSegment.p2.x, lineSegment.p2.y);
    }
    // Draw bounds that prevent movement
    for (let bound of underworld.liquidBounds) {
      globalThis.debugGraphics?.lineStyle(2, 0x0000ff, 1.0);
      globalThis.debugGraphics?.moveTo(bound.p1.x, bound.p1.y);
      globalThis.debugGraphics?.lineTo(bound.p2.x, bound.p2.y);
    }
    // Draw walls that prevent line of sight 
    for (let wall of underworld.walls) {
      globalThis.debugGraphics?.lineStyle(2, 0x00ff00, 1.0);
      globalThis.debugGraphics?.moveTo(wall.p1.x, wall.p1.y);
      globalThis.debugGraphics?.lineTo(wall.p2.x, wall.p2.y);
    }
    // Draw underworld limits
    // globalThis.debugGraphics?.lineStyle(2, 0xff0000, 1.0);
    // globalThis.debugGraphics?.moveTo(underworld.limits.xMin, underworld.limits.yMin);
    // globalThis.debugGraphics?.lineTo(underworld.limits.xMax, underworld.limits.yMin);
    // globalThis.debugGraphics?.lineTo(underworld.limits.xMax, underworld.limits.yMax);
    // globalThis.debugGraphics?.lineTo(underworld.limits.xMin, underworld.limits.yMax);
    // globalThis.debugGraphics?.lineTo(underworld.limits.xMin, underworld.limits.yMin);

  }
}
function drawWalkRope(target: Vec2, underworld: Underworld) {
  if (!globalThis.player) {
    return
  }
  //
  // Show the player's current walk path (walk rope)
  //
  // The distance that the player can cover with their current stamina
  // is drawn in the stamina color.
  // There are dots dilineating how far the unit can move each turn.
  //
  // Show walk path
  globalThis.walkPathGraphics?.clear();
  walkRopePath = underworld.calculatePath(walkRopePath, Vec.round(globalThis.player.unit), Vec.round(target));
  const { points: currentPlayerPath } = walkRopePath;
  if (currentPlayerPath.length) {
    const turnStopPoints = pointsEveryXDistanceAlongPath(globalThis.player.unit, currentPlayerPath, globalThis.player.unit.staminaMax, globalThis.player.unit.staminaMax - globalThis.player.unit.stamina);
    globalThis.walkPathGraphics?.lineStyle(4, 0xffffff, 1.0);
    globalThis.walkPathGraphics?.moveTo(globalThis.player.unit.x, globalThis.player.unit.y);
    let lastPoint: Vec2 = globalThis.player.unit;
    let distanceCovered = 0;
    const distanceLeftToMove = globalThis.player.unit.stamina;
    for (let i = 0; i < currentPlayerPath.length; i++) {
      const point = currentPlayerPath[i];
      if (point) {
        const thisLineDistance = distance(lastPoint, point);
        if (distanceCovered > distanceLeftToMove) {
          globalThis.walkPathGraphics?.lineStyle(4, 0xffffff, 1.0);
          globalThis.walkPathGraphics?.lineTo(point.x, point.y);
        } else {
          globalThis.walkPathGraphics?.lineStyle(4, colors.stamina, 1.0);
          if (distanceCovered + thisLineDistance > distanceLeftToMove) {
            // Draw up to the firstStop with the stamina color
            const pointAtWhichUnitOutOfStamina = getCoordsAtDistanceTowardsTarget(lastPoint, point, distanceLeftToMove - distanceCovered);
            globalThis.walkPathGraphics?.lineTo(pointAtWhichUnitOutOfStamina.x, pointAtWhichUnitOutOfStamina.y);
            globalThis.walkPathGraphics?.lineStyle(4, 0xffffff, 1.0);
            globalThis.walkPathGraphics?.lineTo(point.x, point.y);
          } else {
            globalThis.walkPathGraphics?.lineTo(point.x, point.y);
          }
        }
        distanceCovered += distance(lastPoint, point);
        lastPoint = point;
      }
    }

    // Draw the points along the path at which the unit will stop on each turn
    for (let i = 0; i < turnStopPoints.length; i++) {
      if (i == 0 && distanceLeftToMove > 0) {
        globalThis.walkPathGraphics?.lineStyle(4, colors.stamina, 1.0);
      } else {
        globalThis.walkPathGraphics?.lineStyle(4, 0xffffff, 1.0);
      }
      const point = turnStopPoints[i];
      if (point) {
        globalThis.walkPathGraphics?.drawCircle(point.x, point.y, 3);
      }
    }
    if (turnStopPoints.length == 0 && distanceLeftToMove > 0) {
      globalThis.walkPathGraphics?.lineStyle(4, colors.stamina, 1.0);
    } else {
      globalThis.walkPathGraphics?.lineStyle(4, 0xffffff, 1.0);
    }
    // Draw a stop circle at the end
    const lastPointInPath = currentPlayerPath[currentPlayerPath.length - 1]
    if (lastPointInPath) {
      globalThis.walkPathGraphics?.drawCircle(lastPointInPath.x, lastPointInPath.y, 3);
    }
  }

}
export function contextmenuHandler(underworld: Underworld, e: MouseEvent) {
  // Prevent opening context menu on right click
  e.preventDefault();
  e.stopPropagation();
}
export function mouseDownHandler(underworld: Underworld, e: MouseEvent) {
  if (e.button == 1) {
    // setMMBDown so camera will be dragged around
    globalThis.setMMBDown?.(true);
    e.preventDefault();
  } else if (e.button == 2) {
    e.preventDefault();
    globalThis.setRMBDown?.(true, underworld);
  }
}
export function mouseUpHandler(underworld: Underworld, e: MouseEvent) {
  // Turn MMBDown off for any click to protect against it getting stuck
  // as flagged "down"
  globalThis.setMMBDown?.(false);
  if (globalThis.player) {
    globalThis.player.unit.path = undefined;
  }
  if (e.button == 2) {
    globalThis.walkPathGraphics?.clear();
    globalThis.setRMBDown?.(false, underworld);
    e.preventDefault();
  }
}
export function onWindowBlur(underworld: Underworld) {
  // Turn off keyboard and mouse flags when the document loses focus
  // To protect against the case where a user has middle mouse down
  // while they alt tab, which - without the following line -
  // would mean that it's stuck "up" when they return to the game
  // if they were to release it when this document wasn't focused
  globalThis.setMMBDown?.(false);
}
// Handle clicks on the game board
export function clickHandler(underworld: Underworld, e: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (globalThis.view !== View.Game) {
    return;
  }
  if (!underworld) {
    return;
  }
  const mousePos = underworld.getMousePos();


  if (isOutOfBounds(mousePos, underworld)) {
    // Disallow click out of bounds
    return;
  }

  // If a spell exists (based on the combination of cards selected)...
  if (CardUI.areAnyCardsSelected()) {
    // Only allow casting in the proper phase and on player's turn only
    if (underworld.isMyTurn()) {
      // Get current client's player
      const selfPlayer = globalThis.player;
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
          // Find if there are any valid targets at the endRangeTarget:
          // Note: Since predictionUnits and predictionPickups may be moved around due to the prediction cast,
          // getting the initial target should use NON-prediction units and pickups.  It needs to look for truly
          // existing units and pickups when the click occurs because those are the units and pickups that
          // the spell will act on.
          const initialTarget = !!underworld.getUnitAt(endRangeTarget, false) || !!underworld.getPickupAt(endRangeTarget, false);
          // If there is a target for the cast
          // OR if the first card doesn't require a unit target (like summon_decoy), allow casting at end range
          if (initialTarget || (cards[0] && cards[0].allowNonUnitTarget)) {
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
        const unitAtCastLocation = underworld.getUnitAt(target);
        const pickupAtCastLocation = underworld.getPickupAt(target);
        if ((!unitAtCastLocation && !pickupAtCastLocation) && cards.length && cards[0] && !cards[0].allowNonUnitTarget) {
          floatingText({
            coords: target,
            text: 'No Target!'
          })
          // Cancel Casting
          return;
        }
        if (selfPlayer.unit.modifiers[Freeze.id]) {
          floatingText({ coords: selfPlayer.unit, text: 'Cannot Cast. Frozen.' })
          // Cancel Casting
          return
        }
        clearSpellEffectProjection(underworld);
        // Clear resMarkers so they don't hang around once the spell is cast
        globalThis.resMarkers = [];

        underworld.pie.sendData({
          type: MESSAGE_TYPES.SPELL,
          x: target.x,
          y: target.y,
          cards: cardIds,
        });
        CardUI.clearSelectedCards(underworld);
      } else {
        console.error("Attempting to cast while globalThis.player is undefined");
      }
    } else {
      floatingText({
        coords: mousePos,
        text: 'You must wait for your turn to cast',
      });
    }
  } else {
    updateTooltipSelection(mousePos, underworld);
  }
  tryShowDevContextMenu(underworld, e, mousePos);
}
function tryShowDevContextMenu(underworld: Underworld, e: MouseEvent, mousePos: Vec2) {
  // Developer tool, shift left click to choose to spawn a unit
  if (devMode && e.shiftKey) {
    let menu = document.createElement("div") as HTMLElement;
    menu.id = "ctxmenu"
    menu.style.top = `${e.pageY - 10}px`;
    menu.style.left = `${e.pageX - 40}px`;
    menu.style.zIndex = '2';
    menu.onmouseleave = () => menu.outerHTML = '';
    menu.innerHTML = `
    <p id='selected-unit-label'>Selected Unit</p>
    <ul id='menu-selected-unit'>
    </ul>
    <p>Spawn</p>
    <ul id='menu-spawn'>
    </ul>
    <p>Self</p>
    <ul id='menu-self'>
    </ul>
    `;
    if (globalThis.selectedUnit) {

      const elSelectedUnitList = menu.querySelector('#menu-selected-unit') as HTMLElement;
      const el = document.createElement('li');
      el.innerHTML = 'Die'
      el.addEventListener('click', () => {
        if (globalThis.selectedUnit) {
          Unit.die(globalThis.selectedUnit, underworld, false);
        }
        // Close the menu
        menu.remove();
      })
      elSelectedUnitList.appendChild(el);
    } else {
      menu.querySelector('#menu-selected-unit')?.remove();
      menu.querySelector('#selected-unit-label')?.remove();
    }

    const elSpawnList = menu.querySelector('#menu-spawn') as HTMLElement;

    Object.values(allUnits).forEach(u => {
      const element = document.createElement('li');
      element.innerHTML = u.id;
      element.addEventListener('click', () => {
        if (devSpawnUnit) {
          devSpawnUnit(u.id, Faction.ENEMY, mousePos);
        }
        // Close the menu
        menu.remove();
      });
      elSpawnList.appendChild(element);
    });

    const elSelfList = menu.querySelector('#menu-self') as HTMLElement;
    let el = document.createElement('li');
    el.innerHTML = 'Super Me'
    el.addEventListener('click', () => {
      if (superMe) {
        superMe(underworld);
      }
      // Close the menu
      menu.remove();
    })
    elSelfList.appendChild(el);
    el = document.createElement('li');
    el.innerHTML = 'Teleport Here'
    el.addEventListener('click', () => {
      if (player) {
        player.unit.x = mousePos.x;
        player.unit.y = mousePos.y;
      }
      // Close the menu
      menu.remove();
    })
    elSelfList.appendChild(el);

    document.body.appendChild(menu);

  }

}
