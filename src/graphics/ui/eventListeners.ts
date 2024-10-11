import { MESSAGE_TYPES } from '../../types/MessageTypes';
import throttle from 'lodash.throttle';
import * as CardUI from './CardUI';
import * as Unit from '../../entity/Unit';
import * as Pickup from '../../entity/Pickup';
import * as Player from '../../entity/Player';
import * as Chat from './Chat';
import floatingText, { centeredFloatingText } from '../FloatingText';
import {
  clearSpellEffectProjection,
  clearTooltipSelection,
  clearTints,
  drawCircleUnderTarget,
  drawWalkRope,
  isOutOfBounds,
  runPredictions,
  updateTooltipSelection,
  updateTooltipSelectionWhileSpawning,
} from '../PlanningView';
import { toggleMenu } from '../../views';
import { View } from '../../View';
import * as config from '../../config';
import { cleanBlood, cameraAutoFollow, getCamera, moveCamera, toggleHUD, setCameraToMapCenter } from '../PixiUtils';
import { isOutOfRange } from '../../PlayerUtils';
import { vec2ToOneDimentionIndexPreventWrap } from '../../jmath/ArrayUtil';
import * as Vec from '../../jmath/Vec';
import { Vec2 } from '../../jmath/Vec';
import Underworld, { showUpgradesClassName } from '../../Underworld';
import { toLineSegments } from '../../jmath/Polygon2';
import { closestLineSegmentIntersection } from '../../jmath/lineSegment';
import { allUnits } from '../../entity/units';
import { CardCategory, Faction, UnitSubType, UnitType } from '../../types/commonTypes';
import * as Freeze from '../../cards/freeze';
import { collideWithLineSegments } from '../../jmath/moveWithCollision';
import { getKeyCodeMapping } from './keyMapping';
import { inPortal } from '../../entity/Player';
import { allCards, allModifiers, hasTargetAtPosition } from '../../cards';
import { explain, EXPLAIN_END_TURN, tutorialCompleteTask } from '../Explain';
import { Overworld } from '../../Overworld';
import { summoningSicknessId } from '../../modifierSummoningSickness';
import { errorRed } from './colors';
import { isSinglePlayer } from '../../network/wsPieSetup';
import { elAdminPowerBar, elAdminPowerBarInput, elAdminPowerBarOptions } from '../../HTMLElements';
import { targetCursedId } from '../../cards/target_curse';
import { distance } from '../../jmath/math';

export const keyDown = {
  showWalkRope: false,
  cameraUp: false,
  cameraLeft: false,
  cameraDown: false,
  cameraRight: false
}

let runPredictionsIdleCallbackId: number;
globalThis.addEventListener('keydown', nonUnderworldKeydownListener);
function nonUnderworldKeydownListener(event: KeyboardEvent) {
  // Only handle hotkeys when NOT viewing the Game
  if (globalThis.view == View.Game) {
    return;
  }
  const shouldReturnImmediately = handleJPromptHotkeys(event);
  if (shouldReturnImmediately) {
    return;
  }
  switch (event.code) {
    case 'Escape':
      toggleMenu();
      event.stopImmediatePropagation();
      break;
  }
}
// Returns true if caller should return immediately
function handleJPromptHotkeys(event: KeyboardEvent) {
  // Possibly handle hotkey for Jprompt:
  // note: :last-child targets the top most prompt if there are more than one
  const promptYesBtn = document.querySelector(`.prompt:last-child .yes[data-key="${event.code}"]`) as HTMLElement;
  if (promptYesBtn) {
    promptYesBtn.click();
    // Return immediately, prompt hotkey overrides other hotkeys
    return true;
  }
  // note: :last-child targets the top most prompt if there are more than one
  const promptNoBtn = document.querySelector(`.prompt:last-child .no[data-key="${event.code}"]`) as HTMLElement;
  if (promptNoBtn) {
    // Event was handled
    promptNoBtn.click();
    // Return immediately, prompt hotkey overrides other hotkeys
    return true;
  }
  // Don't cause caller to return
  return false;

}
export function keydownListener(overworld: Overworld, event: KeyboardEvent) {
  // Only handle hotkeys when viewing the Game
  if (globalThis.view !== View.Game) {
    return;
  }
  //console.warn("CODE: ", event.code);
  // Disable default chromium actions to prevent weird behavior
  if (event.code == 'ShiftLeft' || event.code == 'ShiftRight') {
    event.preventDefault();
  }
  if (event.code == 'ControlLeft' || event.code == 'ControlRight') {
    event.preventDefault();
  }
  if (event.code == 'AltLeft' || event.code == 'AltRight') {
    event.preventDefault();
  }
  if (event.code == 'Tab') {
    event.preventDefault();
  }

  const { underworld } = overworld;
  if (!underworld) {
    return
  }

  // Allow skipping the cinematic with escape
  if (event.code == 'Escape') {
    if (globalThis.skipCinematic) {
      console.log('Skipping cinematic');
      globalThis.skipCinematic();
      return;
    }
  }
  const shouldReturnImmediately = handleJPromptHotkeys(event);
  if (shouldReturnImmediately) {
    return;
  }
  if (elAdminPowerBarInput && elAdminPowerBarOptions && document.activeElement == elAdminPowerBarInput) {
    if (event.code == 'ArrowDown' || event.code == 'Tab') {
      event.preventDefault();
      globalThis.adminPowerBarSelection = '';
      globalThis.adminPowerBarIndex++;
    } else if (event.code == 'ArrowUp') {
      event.preventDefault();
      globalThis.adminPowerBarSelection = '';
      globalThis.adminPowerBarIndex--;
    } else if (event.code != 'Enter') {
      // reset admin bar selection if user is giving any other input (typing)
      globalThis.adminPowerBarSelection = '';
      globalThis.adminPowerBarIndex = 0;
    }

    // Set timeout so it gets the last character in the input value
    setTimeout(() => {
      const options = updatePowerBar();

      if (event.code == 'Enter') {
        const option = options[globalThis.adminPowerBarIndex || 0];
        if (option && overworld.underworld) {
          const pos = overworld.underworld.getMousePos();
          triggerAdminOption(option, overworld, pos);
          closePowerBar();
        }
      } else if (event.code == 'Escape') {
        closePowerBar();
      }

      function closePowerBar() {
        // Save last power when we close the bar, so we can easily use it again
        globalThis.adminPowerBarSelection = options[globalThis.adminPowerBarIndex]?.label || '';
        // Remove text, so we can quickly search for a different power if needed
        if (elAdminPowerBarInput) elAdminPowerBarInput.value = '';
        // Close powerbar
        if (elAdminPowerBar) {
          elAdminPowerBar.classList.toggle('visible', false);
        }
      }
    }, 0);
    return;
  }
  if (document.activeElement === Chat.elChatinput || document.activeElement == elAdminPowerBarInput) {
    return;
  }
  handleInputDown(getKeyCodeMapping(event.code, event), overworld);
}
function handleInputDown(keyCodeMapping: string | undefined, overworld: Overworld) {
  if (keyCodeMapping === undefined) {
    return;
  }
  const { underworld } = overworld;
  if (!underworld) {
    return;
  }
  document.body.classList.toggle('showChat', false);
  switch (keyCodeMapping) {
    case 'adminPowerBar':
      if (globalThis.adminMode && elAdminPowerBarInput && elAdminPowerBar) {
        elAdminPowerBar.classList.toggle('visible', true);
        elAdminPowerBarInput.focus();
        if (!globalThis.adminPowerBarIndex) globalThis.adminPowerBarIndex = 0;
        updatePowerBar();
      } else {
        if (overworld.underworld) {
          floatingText({ coords: overworld.underworld.getMousePos(), text: 'Admin mode not active' });
        }
      }
      break;
    case 'Escape':
      // close admin menu
      const elAdminMenuHolder = document.getElementById('admin-menu-holder');
      if (elAdminMenuHolder) {
        elAdminMenuHolder.remove();
        return;
      }
      if (elAdminPowerBar) {
        elAdminPowerBar.classList.toggle('visible', false);
      }

      const thereWasInventoryOpen = document.body?.classList.contains(CardUI.openInvClass);
      // force close inventory
      CardUI.toggleInventory(undefined, false, underworld);
      if (thereWasInventoryOpen) {
        // If inventory was open, don't clear selected cards
        return;
      }
      // Only allow clearing tooltip if the player is already spawned,
      // if they are still spawning, the Escape key should toggle the menu
      // rather than clearing a potential tooltip
      const thereWasTooltipActive = globalThis.player?.isSpawned ? clearTooltipSelection() : false;
      const thereWereCardsSelected = CardUI.areAnyCardsSelected();
      CardUI.clearSelectedCards(underworld);
      // Rerun predictions after selected cards are cleared because the spell changed
      if (underworld) {
        runPredictions(underworld);
      }
      if (!thereWasTooltipActive && !thereWereCardsSelected && !thereWasInventoryOpen) {
        // Otherwise finally toggle menu
        toggleMenu();
      }
      break;
    case 'openChat':
      if (!isSinglePlayer()) {
        document.body.classList.toggle('showChat', true);
        Chat.focusChat(event);
      }
      break;
    case 'openInventory':
      CardUI.toggleInventory(undefined, undefined, underworld);
      break;
    case 'dequeueSpell':
      CardUI.deselectLastCard(underworld);
      break;
    case 'showWalkRope':
      keyDown.showWalkRope = true;
      // When the walkRope turns on clear the spell effect projection
      // so the user can focus on the information that the walk rope is 
      // communicating
      clearSpellEffectProjection(underworld);
      break;
    // Camera movement
    case 'cameraUp':
      keyDown.cameraUp = true;
      cameraAutoFollow(false);
      break;
    case 'cameraLeft':
      keyDown.cameraLeft = true;
      cameraAutoFollow(false);
      break;
    case 'cameraDown':
      keyDown.cameraDown = true;
      cameraAutoFollow(false);
      break;
    case 'cameraRight':
      keyDown.cameraRight = true;
      cameraAutoFollow(false);
      break;
    case 'ping':
      const mouseTarget = underworld.getMousePos();
      overworld.pie.sendData({
        type: MESSAGE_TYPES.PING,
        x: mouseTarget.x,
        y: mouseTarget.y
      });
      break;
    case 'recenterCamera':
      if (globalThis.player?.isSpawned) {

        // Make camera follow player unit 
        cameraAutoFollow(true);
        tutorialCompleteTask('recenterCamera');
      } else {
        setCameraToMapCenter(underworld);
      }
      break;
    case 'endTurn':
      const isInventoryOpen = document.body?.classList.contains(CardUI.openInvClass);
      // Protect user from accidentally ending turn while inventory is open
      if (isInventoryOpen) {
        playSFXKey('deny');
      } else {
        underworld.endMyTurnButtonHandler();
      }
      break;
    case 'spell1':
      CardUI.selectCardByIndex(0, CardUI.elCardHand);
      break;
    case 'spell2':
      CardUI.selectCardByIndex(1, CardUI.elCardHand);
      break;
    case 'spell3':
      CardUI.selectCardByIndex(2, CardUI.elCardHand);
      break;
    case 'spell4':
      CardUI.selectCardByIndex(3, CardUI.elCardHand);
      break;
    case 'spell5':
      CardUI.selectCardByIndex(4, CardUI.elCardHand);
      break;
    case 'spell6':
      CardUI.selectCardByIndex(5, CardUI.elCardHand);
      break;
    case 'spell7':
      CardUI.selectCardByIndex(6, CardUI.elCardHand);
      break;
    case 'spell8':
      CardUI.selectCardByIndex(7, CardUI.elCardHand);
      break;
    case 'spell9':
      CardUI.selectCardByIndex(8, CardUI.elCardHand);
      break;
    case 'spellLeft1':
      CardUI.selectCardByIndex(0, CardUI.elFloatingCardHolderLeft);
      break;
    case 'spellLeft2':
      CardUI.selectCardByIndex(1, CardUI.elFloatingCardHolderLeft);
      break;
    case 'spellLeft3':
      CardUI.selectCardByIndex(2, CardUI.elFloatingCardHolderLeft);
      break;
    case 'spellLeft4':
      CardUI.selectCardByIndex(3, CardUI.elFloatingCardHolderLeft);
      break;
    case 'spellLeft5':
      CardUI.selectCardByIndex(4, CardUI.elFloatingCardHolderLeft);
      break;
    case 'spellLeft6':
      CardUI.selectCardByIndex(5, CardUI.elFloatingCardHolderLeft);
      break;
    case 'spellLeft7':
      CardUI.selectCardByIndex(6, CardUI.elFloatingCardHolderLeft);
      break;
    case 'spellLeft8':
      CardUI.selectCardByIndex(7, CardUI.elFloatingCardHolderLeft);
      break;
    case 'spellLeft9':
      CardUI.selectCardByIndex(8, CardUI.elFloatingCardHolderLeft);
      break;
    case 'spellRight1':
      CardUI.selectCardByIndex(0, CardUI.elFloatingCardHolderRight);
      break;
    case 'spellRight2':
      CardUI.selectCardByIndex(1, CardUI.elFloatingCardHolderRight);
      break;
    case 'spellRight3':
      CardUI.selectCardByIndex(2, CardUI.elFloatingCardHolderRight);
      break;
    case 'spellRight4':
      CardUI.selectCardByIndex(3, CardUI.elFloatingCardHolderRight);
      break;
    case 'spellRight5':
      CardUI.selectCardByIndex(4, CardUI.elFloatingCardHolderRight);
      break;
    case 'spellRight6':
      CardUI.selectCardByIndex(5, CardUI.elFloatingCardHolderRight);
      break;
    case 'spellRight7':
      CardUI.selectCardByIndex(6, CardUI.elFloatingCardHolderRight);
      break;
    case 'spellRight8':
      CardUI.selectCardByIndex(7, CardUI.elFloatingCardHolderRight);
      break;
    case 'spellRight9':
      CardUI.selectCardByIndex(8, CardUI.elFloatingCardHolderRight);
      break;
    case 'touchPadMoveCharacter':
      // This key makes it easier for players who are using a touchpad to move
      // per: https://steamcommunity.com/app/1618380/discussions/0/3810656323972884104/
      if (overworld.underworld) {
        globalThis.setRMBDown?.(true, overworld.underworld);
      } else {
        console.warn('Cannot move character, no underworld');
      }
      break;
    default:
      console.log('Input: code', keyCodeMapping, 'not handled');
  }
}

export function keyupListener(overworld: Overworld, event: KeyboardEvent) {
  // Only handle hotkeys when viewing the Game
  if (globalThis.view !== View.Game) {
    return;
  }
  handleInputUp(getKeyCodeMapping(event.code, event), overworld);
}
function handleInputUp(keyCodeMapping: string | undefined, overworld: Overworld) {
  if (keyCodeMapping === undefined) {
    return;
  }
  switch (keyCodeMapping) {
    case 'showWalkRope':
      keyDown.showWalkRope = false;
      break;
    // Camera movement
    case 'cameraUp':
      keyDown.cameraUp = false;
      break;
    case 'cameraLeft':
      keyDown.cameraLeft = false;
      break;
    case 'cameraDown':
      keyDown.cameraDown = false;
      break;
    case 'cameraRight':
      keyDown.cameraRight = false;
      break;
    case 'touchPadMoveCharacter':
      if (overworld.underworld) {
        // Simulate lifting the right mouse button
        mouseUpHandler(overworld, { button: 2, preventDefault: () => { } });
      } else {
        console.warn('Cannot move character, no underworld');
      }
      break;
  }
}

export function endTurnBtnListener(overworld: Overworld, e: MouseEvent) {
  if (overworld.underworld) {
    overworld.underworld.endMyTurnButtonHandler();
  } else {
    console.error('Unexpected: Cannot end turn, no underworld');
  }
  e.preventDefault();
  e.stopPropagation();
  return false;
}
const sendMovePlayer = throttle((underworld: Underworld) => {
  if (globalThis.player) {
    if (globalThis.player.isSpawned && !inPortal(globalThis.player)) {
      // This should never happen
      if (isNaN(globalThis.player.unit.stamina)) {
        // but if it does, report error and set stamina back to a valid number
        console.error('Stamina is NaN!');
        globalThis.player.unit.stamina = 0;
      }
      underworld.pie.sendData({
        type: MESSAGE_TYPES.MOVE_PLAYER,
        ...Vec.clone(globalThis.player.unit),
      });
    } else {
      console.log('Cancelling MOVE_PLAYER message because player is not spawned.');

    }
  } else {
    console.error('Cannot send MOVE_PLAYER, globalThis.player is undefined')
  }

}, 200, { trailing: true });
const notifyYouMustWaitForYourTurn = throttle((target: Vec2) => {
  // Only notify if they are spawned in
  if (globalThis.player?.isSpawned) {
    floatingText({
      coords: target,
      text: 'You must wait for your turn\nto move',
    });
  }
}, 400, { trailing: true });


export function useMousePosition(underworld: Underworld, e?: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (globalThis.view !== View.Game) {
    return;
  }
  if (!underworld) {
    console.error('Cannot run mouseMove, underworld is undefined');
    return;
  }
  if (e) {
    globalThis.currentHoverElement = e.target as HTMLElement;
  }
  const mouseTarget = underworld.getMousePos();
  // Move the spawn "ghost" around so players can see where they will
  // spawn if they click
  if (globalThis.player && !globalThis.player?.isSpawned) {
    if (globalThis.cinematicCameraTarget !== undefined) {
      // Ensure spawn "ghost" isn't visible while cinematic camera is moving
      globalThis.player.unit.x = NaN;
      globalThis.player.unit.y = NaN;
    } else {
      if (!document.body?.classList.contains(showUpgradesClassName)) {
        const spawnPoint = { ...mouseTarget, radius: config.COLLISION_MESH_RADIUS }
        collideWithLineSegments(spawnPoint, underworld.walls, underworld);
        if (globalThis.player.unit.image) {
          globalThis.player.unit.image.sprite.alpha = 0.5;
          if (underworld.isCoordOnWallTile(spawnPoint) || isOutOfBounds(spawnPoint, underworld)) {
            globalThis.player.unit.x = NaN;
            globalThis.player.unit.y = NaN;
          } else {
            // Only move ghost player if not awaitingSpawn (which means they've already chosen)
            // a spawn point but the message hasn't triggered yet due to another message still processing
            if (!globalThis.awaitingSpawn) {
              globalThis.player.unit.x = spawnPoint.x;
              globalThis.player.unit.y = spawnPoint.y;
            }
          }
        }
      }
    }
  }

  if (globalThis.MMBDown && e) {
    const { movementX, movementY } = e;
    const { zoom } = getCamera();
    cameraAutoFollow(false);
    moveCamera(-movementX / zoom, -movementY / zoom);
    tutorialCompleteTask('camera');
  }

  if (globalThis.player) {
    if (keyDown.showWalkRope || globalThis.showCastRangeForUpgrade) {
      // When showing the cast range due to hovering over the upgrade,
      // it should be centered on the player, not the cursor.
      // When showing cast range for the walk rope it should be centered on where
      // you will be
      const target = keyDown.showWalkRope ? mouseTarget : globalThis.player.unit;
      drawWalkRope(target, underworld);
    } else {
      globalThis.walkPathGraphics?.clear();
    }
    if (globalThis.RMBDown) {
      if (underworld.isMyTurn()) {
        if (globalThis.player.isSpawned) {
          // If player is able to move
          if (Unit.canMove(globalThis.player.unit)) {
            // Move towards mouseTarget, but stop pathing where the direct path intersects a wall
            // This ensures that the player will always move in the direction of the mouse
            // and won't path in an unexpected direction to attempt to get to the final destination.
            const intersection = closestLineSegmentIntersection({ p1: globalThis.player.unit, p2: mouseTarget }, underworld.walls) || mouseTarget;
            Unit._moveTowards(globalThis.player.unit, intersection, underworld);

            // Trigger mouse move so that predictions will run when the position of your own player changes since
            // this could change prediction results
            runPredictions(underworld);

            // Send current player movements to server
            sendMovePlayer(underworld);
            tutorialCompleteTask('moved');
          } else {
            if (!globalThis.notifiedOutOfStamina) {
              if (globalThis.player.unit.stamina <= 0) {

                floatingText({
                  coords: mouseTarget,
                  text: 'Out of stamina',
                });
                // Stop walk animation now that unit is out of stamina and not moving
                Unit.returnToDefaultSprite(globalThis.player.unit);
                explain(EXPLAIN_END_TURN);
                playSFXKey('deny_stamina');
                globalThis.notifiedOutOfStamina = true;
              }
            }
          }
        } else {
          console.log('Cannot move until player is spawned into the level.');
        }
      } else {
        notifyYouMustWaitForYourTurn(mouseTarget);
      }
    }
  }

  // TODO: optimize this function by not rerunning parts if mouse & player.unit position
  // havent changed since last call.

  // Show faint circle on clickable entities on hover:
  drawCircleUnderTarget(mouseTarget, underworld, 1.0, globalThis.planningViewGraphics);
  // Show tooltip on hover when player is spawning because they can't click without
  // spawning themselves in and they still need a way to inspect units
  updateTooltipSelectionWhileSpawning(mouseTarget, underworld);
  // TODO show tooltip info on hover when spawning


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
    const originalTile = underworld.lastLevelCreated?.imageOnlyTiles[vec2ToOneDimentionIndexPreventWrap({ x: cellX, y: cellY }, underworld.lastLevelCreated?.width)];
    const originalTileImage = originalTile ? originalTile.image : '';
    (document.getElementById('debug-info') as HTMLElement).innerText = `x:${Math.round(mouseTarget.x)}, y:${Math.round(mouseTarget.y)}
    cellX: ${cellX}, cellY: ${cellY}
    tile: ${originalTileImage}`;
    // Debug draw cell that mouse is hovered over
    globalThis.debugGraphics?.lineStyle(3, 0xff0000, 1);
    globalThis.debugGraphics?.moveTo(cellX * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2);
    globalThis.debugGraphics?.lineTo(cellX * config.OBSTACLE_SIZE + config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2);
    globalThis.debugGraphics?.lineTo(cellX * config.OBSTACLE_SIZE + config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE + config.OBSTACLE_SIZE / 2);
    globalThis.debugGraphics?.lineTo(cellX * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE + config.OBSTACLE_SIZE / 2);
    globalThis.debugGraphics?.lineTo(cellX * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2, cellY * config.OBSTACLE_SIZE - config.OBSTACLE_SIZE / 2);
    // Draw the pathing walls
    for (let lineSegment of underworld.pathingLineSegments) {
      // color: pink
      globalThis.debugGraphics?.lineStyle(2, 0xffaabb, 1.0);
      globalThis.debugGraphics?.moveTo(lineSegment.p1.x, lineSegment.p1.y);
      globalThis.debugGraphics?.lineTo(lineSegment.p2.x, lineSegment.p2.y);
    }
    // Draw liquid polygons
    for (let lineSegment of underworld.liquidPolygons.map(toLineSegments).flat()) {
      // color: baby blue
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
export function contextmenuHandler(overworld: Overworld, e: MouseEvent) {
  // Prevent opening context menu on right click
  e.preventDefault();
  e.stopPropagation();
}
export function mouseDownHandler(overworld: Overworld, e: MouseEvent) {
  if (e.button == 1) {
    // setMMBDown so camera will be dragged around
    globalThis.setMMBDown?.(true);
    e.preventDefault();
  } else if (e.button == 2) {
    e.preventDefault();
    if (e.target && (e.target as HTMLElement).closest?.('#card-holders')) {
      // Prevent right click from moving player if right clicking on toolbar
      return;
    }
    if (overworld.underworld) {
      globalThis.setRMBDown?.(true, overworld.underworld);
    } else {
      console.log('Did not setRMBDown, underworld does not exist.');
    }
  } else {
    handleInputDown(getKeyCodeMapping(globalThis.mouseButtonToKeyCode(e.button)), overworld);
  }
}
globalThis.mouseButtonToKeyCode = (button: number) => `Mouse ${button}`;
export function mouseUpHandler(overworld: Overworld, e: Pick<MouseEvent, "button" | "preventDefault">) {
  // Turn MMBDown off for any click to protect against it getting stuck
  // as flagged "down"
  globalThis.setMMBDown?.(false);
  if (globalThis.player) {
    globalThis.player.unit.path = undefined;
  }
  if (e.button == 2) {
    globalThis.walkPathGraphics?.clear();
    if (overworld.underworld) {
      globalThis.setRMBDown?.(false, overworld.underworld);
      if (overworld.underworld && globalThis.player) {
        // On release, send a final move player to ensure that the player moves to the full destination on the server
        overworld.underworld.pie.sendData({
          type: MESSAGE_TYPES.SET_PLAYER_POSITION,
          position: Vec.clone(globalThis.player.unit),
          stamina: globalThis.player.unit.stamina,
        });
      }
    } else {
      console.log('Did not setRMBDown, underworld does not exist.');
    }
    e.preventDefault();
  } else {
    handleInputUp(getKeyCodeMapping(globalThis.mouseButtonToKeyCode(e.button)), overworld);
  }
}

// Used for UI to determine if which element is currently
// being hovered by the mouse
export function mouseOverHandler(_overworld: Overworld, e: MouseEvent) {
  globalThis.hoverTarget = e.target as HTMLElement;
}
export function onWindowBlur(_overworld: Overworld) {
  // Turn off keyboard and mouse flags when the document loses focus
  // To protect against the case where a user has middle mouse down
  // while they alt tab, which - without the following line -
  // would mean that it's stuck "up" when they return to the game
  // if they were to release it when this document wasn't focused
  globalThis.setMMBDown?.(false);
  // Revert all keydown flags so they don't get stuck
  (Object.keys(keyDown) as Array<keyof typeof keyDown>).forEach(key => {
    keyDown[key] = false;
  })
}
// Handle clicks on the game board
export function clickHandler(overworld: Overworld, e: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (globalThis.view !== View.Game) {
    return;
  }
  const { underworld } = overworld;
  if (!underworld) {
    return;
  }
  const mousePos = underworld.getMousePos();
  //hide chat if its active
  document.body.classList.toggle('showChat', false);

  const cardIds = CardUI.getSelectedCardIds();
  // If the first card ignores range, it should also be castable out of bounds
  // This allows players to more precisely aim arrow spells
  const firstCardIgnoreOutOfBounds = cardIds[0] && allCards[cardIds[0]]?.ignoreRange;
  if (!firstCardIgnoreOutOfBounds && isOutOfBounds(mousePos, underworld)) {
    // Disallow click out of bounds
    floatingText({
      coords: mousePos,
      text: 'Out of bounds'
    })
    playSFXKey('deny');
    return;
  }
  // Get current client's player
  const selfPlayer = globalThis.player;
  if (selfPlayer && !selfPlayer.isSpawned &&
    !document.body?.classList.contains(showUpgradesClassName)) {
    const spawnPoint = { ...mousePos, radius: config.COLLISION_MESH_RADIUS }
    collideWithLineSegments(spawnPoint, underworld.walls, underworld);
    if (underworld.isCoordOnWallTile(spawnPoint)) {
      floatingText({
        coords: mousePos,
        text: 'Invalid Spawn Location'
      });
      playSFXKey('deny');
    } else {
      if (globalThis.cinematicCameraTarget !== undefined) {
        console.log('Cannot spawn during cinematic intro')
      } else {
        // Some people are experiencing an issue where they accidentally spawn after
        // choosing an upgrade.  This small 300 milli buffer is meant to protect against
        // that happening.
        // Dev: Disabling for now because this feels like a very risk change if it doesn't work right
        // if (typeof timeLastChoseUpgrade !== 'undefined' && (Date.now() - timeLastChoseUpgrade < 300)) {
        //   console.log('Prevent accidental spawn after choosing upgrade');
        //   return;
        // }

        // Now that they've chosen a spawn, set awaitingSpawn to true so that 
        // they get immediate feedback that they've chosen a spawn point
        globalThis.awaitingSpawn = true;
        if (globalThis.player?.unit) {
          globalThis.player.unit.x = spawnPoint.x;
          globalThis.player.unit.y = spawnPoint.y;
        }
        // Spawn player:
        overworld.pie.sendData({
          type: MESSAGE_TYPES.SPAWN_PLAYER,
          x: spawnPoint.x,
          y: spawnPoint.y,
        });
      }
      return;
    }
  }

  // If a spell exists (based on the combination of cards selected)...
  if (CardUI.areAnyCardsSelected()) {
    // Only allow casting in the proper phase and on player's turn only
    if (underworld.isMyTurn()) {
      // If the player casting is the current client player
      if (selfPlayer) {
        // cast the spell
        let target = mousePos;
        // Improved targeting:
        // Ensure that click sent in cast is not slightly different from last 
        // runPrediction target which can result in different outcomes than the
        // user is expecting
        if (globalThis.lastPredictionMousePos && !Vec.equal(target, globalThis.lastPredictionMousePos)) {
          const distFromLastPredictionMouse = distance(target, globalThis.lastPredictionMousePos);
          const isSmallDistFromLastPrediction = distFromLastPredictionMouse < config.COLLISION_MESH_RADIUS;
          if (isSmallDistFromLastPrediction) {
            target = globalThis.lastPredictionMousePos;
            console.log("Quality of Life: Overriding mouse position with last successful runPrediction mouse position.")
          }
        }

        // End Improved targeting
        const cardIds = CardUI.getSelectedCardIds();
        const cards = CardUI.getSelectedCards();


        // Ensure that last card doesn't require a following card
        // If it does, warn the player that their card order won't do what
        // they are expecting it to do
        const nonFrontloadCards = cards.filter(c => !c.frontload)
        const lastCard = nonFrontloadCards[nonFrontloadCards.length - 1];
        if (lastCard && lastCard.requiresFollowingCard) {
          floatingText({
            coords: target,
            text: ['🍞 only modifies spells on its right', lastCard.id],
            style: { fill: 'red', ...config.PIXI_TEXT_DROP_SHADOW }
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
        if (isOutOfRange(selfPlayer, mousePos, underworld, cardIds)) {
          // If there is no target at end range, just show that they are trying to cast out of range
          floatingText({
            coords: target,
            text: 'Out of Range'
          });
          playSFXKey('deny_range');
          // Cancel Casting
          return;
        }
        // Abort casting if there is no unitAtCastLocation
        // unless the first card (like AOE) specifically allows casting
        // on non unit targets
        const hasTarget = hasTargetAtPosition(target, underworld);


        // https://github.com/jdoleary/Spellmasons/pull/521
        // Hard-coded "Target Curse" -> Allows players to cast spells
        // without a target under cursor, if there are target cursed units
        const hasTargetCursedUnit = underworld.units.find(u => u.modifiers[targetCursedId]);
        if ((!hasTarget && !hasTargetCursedUnit) && cards.length && cards[0] && !cards[0].allowNonUnitTarget) {
          floatingText({
            coords: target,
            text: 'No Target!'
          });
          playSFXKey('deny_target');
          // Cancel Casting
          return;
        }

        // Check for quantity here because the freeze modifier persists after 0 quantity to grant freeze immunity
        if (selfPlayer.unit.modifiers[Freeze.freezeCardId] && selfPlayer.unit.modifiers[Freeze.freezeCardId].quantity > 0) {
          floatingText({ coords: selfPlayer.unit, text: 'Cannot Cast. Frozen.' })
          playSFXKey('deny');
          // Cancel Casting
          return
        }
        if (!selfPlayer.unit.alive) {
          floatingText({ coords: selfPlayer.unit, text: 'Cannot Cast. Dead.' })
          playSFXKey('deny');
          // Cancel Casting
          return
        }
        // Clear resMarkers so they don't hang around once the spell is cast
        globalThis.resMarkers = [];

        // If multiplayer, play channelling animation until you are able to cast
        if (globalThis.spellCasting) {
          Player.setSpellmasonsToChannellingAnimation(selfPlayer);
        }
        // syncPredictionEntities to update the mana and health of predictionPlayer if the spell were to be cast
        // so that we can check in the next block if there is insufficient health or mana to cast it.
        underworld.syncPredictionEntities();
        const casterPositionAtTimeOfCast = Vec.clone(selfPlayer.unit);
        const casterUnit = underworld.unitsPrediction.find(u => u.id == globalThis.player?.unit.id);
        if (!casterUnit) {
          console.error('Unexpected: Player caster unit not found when attempting to cache targeted units before sending off SPELL');
          console.log('Requesting game state from host');
          underworld.pie.sendData({
            type: MESSAGE_TYPES.REQUEST_SYNC_GAME_STATE
          });
        } else {
          // Run a castCards PREDICTION to make sure the player has enough mana to cast this
          underworld.castCards({
            casterCardUsage: JSON.parse(JSON.stringify(selfPlayer.cardUsageCounts)), // Make a copy of cardUsageCounts for prediction so it can accurately calculate mana for multiple copies of one spell in one cast
            casterUnit,
            casterPositionAtTimeOfCast: Vec.clone(casterUnit),
            cardIds,
            castLocation: target,
            prediction: true,
            outOfRange: false,
            magicColor: undefined,
            casterPlayer: selfPlayer,

          }).then((effectState) => {
            // Ensure that the mana left after casting the prediction spell is not negative.
            // If it is negative, don't allow the cast because the caster has insufficient mana
            if ((effectState.casterUnit.mana >= 0)) {
              clearSpellEffectProjection(underworld, true);
              overworld.pie.sendData({
                type: MESSAGE_TYPES.SPELL,
                casterPositionAtTimeOfCast,
                x: target.x,
                y: target.y,
                cards: cardIds,
                initialTargetedUnitId: effectState.initialTargetedUnitId,
                initialTargetedPickupId: effectState.initialTargetedPickupId,
              });
              CardUI.clearSelectedCards(underworld);
              // Now that the cast has begun, clear the prediction tint so it doesn't color the targeted units anymore
              clearTints(underworld);
            } else {
              floatingText({
                coords: casterUnit,
                text: 'Insufficient Mana',
                style: { fill: errorRed, fontSize: '50px', ...config.PIXI_TEXT_DROP_SHADOW }
              })
              console.log('Spell could not be cast, insufficient mana');

            }

          })
        }
      } else {
        console.error("Attempting to cast while globalThis.player is undefined");
      }
    } else {
      if (selfPlayer?.isSpawned) {
        floatingText({
          coords: mousePos,
          text: 'You must wait for your turn to cast',
        });
      }
      playSFXKey('deny');
    }
  } else {
    updateTooltipSelection(mousePos, underworld);
  }
  tryShowDevContextMenu(overworld, e, mousePos);
}
function tryShowDevContextMenu(overworld: Overworld, e: MouseEvent, mousePos: Vec2) {
  if (globalThis.headless) {
    return;
  }
  // Developer tool, shift left click to choose to spawn a unit
  if (adminMode && e.shiftKey) {
    const menuHolder = document.createElement('div');
    menuHolder.id = 'admin-menu-holder';
    let menu = document.createElement("div") as HTMLElement;
    menu.id = "ctxmenu"
    menu.innerHTML = `
    <div>
      <p id='global-label'>Global</p>
      <ul id='menu-global'></ul>
    </div>
    <div>
      <p id='selected-unit-label'>Selected Unit</p>
      <ul id='menu-selected-unit'></ul>
      <p id='selected-pickup-label'>Selected Pickup</p>
      <ul id='menu-selected-pickup'></ul>
    </div>
    <div>
      <p>Spawn Unit</p>
      <ul id='menu-spawn'></ul>
    </div>
    <div>
    <p>Spawn Pickup</p>
    <ul id='menu-spawn-pickup'></ul>
    </div>
    <div>
    <p>Spawn Doodad</p>
    <ul id='menu-spawn-doodad'></ul>
    </div>
    <div>
    <p>Self</p>
    <ul id='menu-self'>
    </ul>
    </div>
    `;

    // Append menu to DOM
    document.body.appendChild(menuHolder);
    menuHolder.appendChild(menu);

    createContextMenuOptions(menu, overworld);

    // Remove some options if they don't apply
    if (!globalThis.selectedPickup) {
      menu.querySelector('#menu-selected-pickup')?.remove();
      menu.querySelector('#selected-pickup-label')?.remove();
    }
    if (!globalThis.selectedUnit) {
      menu.querySelector('#menu-selected-unit')?.remove();
      menu.querySelector('#selected-unit-label')?.remove();
    }
  }
}
export const adminCommands: { [label: string]: AdminContextMenuOption } = {};
export function triggerAdminCommand(label: string, clientId: string, payload: any) {
  const { action } = adminCommands[label] || {};
  if (action) {
    action({ clientId, ...payload });
  } else {
    console.error('No admin action with label', label);
  }
}
interface AdminActionProps {
  playerId?: string;
  pos?: Vec2;
  selectedUnitid?: number;
  selectedPickupLocation?: Vec2;
}
type AdminAction = (props: AdminActionProps) => void;
interface AdminContextMenuOption {
  action: AdminAction;
  supportInMultiplayer: boolean;
  label: string;
  domQueryContainer: string;
}
export function registerAdminContextMenuOptions(overworld: Overworld) {

  const options: AdminContextMenuOption[] = [
    {
      label: '🦸‍♂️ Super Me',
      action: ({ playerId }: { playerId?: string }) => {
        if (superMe && overworld.underworld) {
          superMe(overworld.underworld, overworld.underworld.players.find(p => p.playerId == playerId) || globalThis.player);
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-self',
    },
    {
      label: '️Level Up',
      action: () => {
        if (superMe && overworld.underworld) {
          const numberOfEnemiesKilledNeededForNextDrop = overworld.underworld.getNumberOfEnemyKillsNeededForNextLevelUp() - overworld.underworld.enemiesKilled;
          for (let i = 0; i < numberOfEnemiesKilledNeededForNextDrop; i++) {
            const fakeUnit = Unit.create('golem', 0, 0, Faction.ENEMY, 'gruntIdle', UnitType.AI, UnitSubType.MELEE, {}, overworld.underworld);
            overworld.underworld.reportEnemyKilled(fakeUnit);
            Unit.cleanup(fakeUnit);
          }
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '',
    },
    {
      label: '⭐ Give 1000 Skill Points',
      action: ({ playerId }: { playerId?: string }) => {
        const player = overworld.underworld?.players.find(p => p.playerId == playerId)
        if (player) {
          player.statPointsUnspent += 1000;
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-self'

    },
    ...Object.values(allCards).map(x => ({
      label: `Give card: ${x.id}`,
      action: ({ playerId }: { playerId?: string }) => {
        const player = overworld.underworld?.players.find(p => p.playerId == playerId)
        if (player && overworld.underworld) {
          Player.addCardToHand(x, player, overworld.underworld);
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '',

    })),
    {
      label: '☄️ Teleport Here',
      action: (props) => {
        const { playerId, pos } = props;
        if (!overworld.underworld) {
          console.error('Cannot teleport, underworld does not exist');
          return;
        }
        const player = overworld.underworld.players.find(p => p.playerId == playerId);
        if (player && pos) {
          player.unit.x = pos.x;
          player.unit.y = pos.y;
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-self',
    },
    {
      label: '🎥 Toggle game screen UI',
      action: () => {
        toggleHUD();
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-self',
    },
    {
      label: '📹 Toggle Player List Visibility',
      action: () => {
        document.body?.classList.toggle('hide-lobby');
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-self',
    },
    {
      label: '📱 Recording Shorts',
      action: () => {
        document.body?.classList.toggle('recording-shorts');
        globalThis.recordingShorts = !globalThis.recordingShorts;
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-self',
    },
    {
      label: '🃏 Toggle UI',
      action: () => {
        // Hides a portion of the UI but not all of it for recording or screenshots
        document.body?.classList.toggle('hide-card-holders');
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-self',
    },
    ...Pickup.pickups.map<AdminContextMenuOption>(p => ({
      label: p.name,
      action: ({ pos }) => {
        if (!overworld.underworld) {
          console.error('Cannot spawn pickup, underworld does not exist');
          return;
        }
        if (pos) {
          Pickup.create({ pos, pickupSource: p, logSource: 'admin' }, overworld.underworld, false);
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-spawn-pickup'
    })),
    ...Object.values(allUnits).map<AdminContextMenuOption>(u => ({
      label: u.id,
      action: ({ pos }) => {
        if (pos) {
          if (!overworld.underworld) {
            console.error('Cannot spawn unit, underworld does not exist');
            return;
          }
          const justSpawnedUnit = overworld.underworld.spawnEnemy(u.id, pos, false);
          if (justSpawnedUnit) {
            // Orient newly spawned units towards the player
            if (globalThis.player) {
              Unit.orient(justSpawnedUnit, globalThis.player.unit);
            }
          }
          // Rerun predictions now that a new unit has been created by admin
          runPredictions(overworld.underworld);
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-spawn'
    })),
    {
      label: '🦹‍♂️🦹‍♂️🦹‍♂️ Spawn many enemies',
      action: ({ pos }) => {
        if (pos && overworld.underworld) {
          const spawns = overworld.underworld.findValidSpawns({ spawnSource: pos, ringLimit: 5, prediction: false, radius: 20 });
          for (let spawn of spawns) {
            overworld.underworld.spawnEnemy('golem', spawn, false);
          }
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-spawn'
    },
    {
      label: '🦹‍♂️🧛‍♂️🧝‍♂️ Spawn All Enemies',
      action: ({ pos }) => {
        if (pos && overworld.underworld) {
          const spawns = overworld.underworld.findValidSpawns({ spawnSource: pos, ringLimit: 5, prediction: false, radius: 20 });
          Object.keys(allUnits).forEach((unitId, index) => {
            const spawn = spawns[index];
            if (spawn) {
              if (overworld && overworld.underworld) {
                overworld.underworld.spawnEnemy(unitId, spawn, false);
              }
            } else {
              console.log('Could not find valid spawn for Admin command Spawn All Enemies')
            }

          });
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-spawn'
    },
    {
      label: 'Kill all Enemies',
      action: () => {
        if (!overworld.underworld) {
          console.error('Cannot "Kill all Enemies", underworld does not exist');
          return;
        }
        // Remove without blood, remember clean up will just
        // flag them for deletion, they will be removed from the array
        // at the start of the next turn.
        for (let unit of overworld.underworld.units.filter(u => u.faction == Faction.ENEMY)) {
          Unit.die(unit, overworld.underworld, false);
        }
        overworld.underworld.progressGameState();
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Delete all Enemies',
      action: () => {
        if (!overworld.underworld) {
          console.error('Cannot "Delete all Enemies", underworld does not exist');
          return;
        }
        // Remove without blood, remember clean up will just
        // flag them for deletion, they will be removed from the array
        // at the start of the next turn.
        // Note: This may prevent portal from spawning since they are just removed
        // but do not die
        overworld.underworld.units.filter(u => u.faction == Faction.ENEMY).forEach(u => {
          Unit.cleanup(u);
        });
        // Instantly fully remove units that are flagged for removal 
        // (in the game this happens during initTurnPhase, in order to prevent the units array
        // from being modified while it is being iterated) however the admin commands
        // are meant to set up game state, often for saving or exporting the state and so it should
        // clean up immediately
        overworld.underworld.units = overworld.underworld.units.filter(u => !u.flaggedForRemoval)
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Delete all Pickups',
      action: () => {
        if (!overworld.underworld) {
          console.error('Cannot "Delete all Pickups", underworld does not exist');
          return;
        }
        for (let pickup of overworld.underworld.pickups) {
          Pickup.removePickup(pickup, overworld.underworld, false);
        }
        // Instantly fully remove pickups that are flagged for removal 
        // (in the game this happens during initTurnPhase, in order to prevent the pickup array
        // from being modified while it is being iterated) however the admin commands
        // are meant to set up game state, often for saving or exporting the state and so it should
        // clean up immediately
        overworld.underworld.pickups = overworld.underworld.pickups.filter(p => !p.flaggedForRemoval)
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-global'
    },
    {
      label: '🩸 Clean up Blood',
      action: () => {
        cleanBlood();
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Skip to Next Level',
      action: () => {
        if (globalThis.player) {
          const underworld = overworld.underworld;
          if (!underworld) {
            console.error('Cannot "Skip to Next level", underworld does not exist');
            return;
          }
          if (!globalThis.isHost(underworld.pie)) {
            console.error('Cannot "Skip to Next level", player is not the host');
            return;
          }
          underworld.generateLevelData(underworld.levelIndex + 1);
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Skip to Water Biome',
      action: () => {
        if (globalThis.player) {
          const underworld = overworld.underworld;
          if (!underworld) {
            console.error('Cannot "Skip to Lava Biome", underworld does not exist');
            return;
          }
          if (!globalThis.isHost(underworld.pie)) {
            console.error('Cannot "Skip to Lava Biome", player is not the host');
            return;
          }
          underworld.generateLevelData(0);
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Skip to Lava Biome',
      action: () => {
        if (globalThis.player) {
          const underworld = overworld.underworld;
          if (!underworld) {
            console.error('Cannot "Skip to Lava Biome", underworld does not exist');
            return;
          }
          if (!globalThis.isHost(underworld.pie)) {
            console.error('Cannot "Skip to Lava Biome", player is not the host');
            return;
          }
          underworld.generateLevelData(3);
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Skip to Blood Biome',
      action: () => {
        if (globalThis.player) {
          const underworld = overworld.underworld;
          if (!underworld) {
            console.error('Cannot "Skip to Blood Biome", underworld does not exist');
            return;
          }
          if (!globalThis.isHost(underworld.pie)) {
            console.error('Cannot "Skip to Blood Biome", player is not the host');
            return;
          }
          underworld.generateLevelData(6);
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Skip to Ghost Biome',
      action: () => {
        if (globalThis.player) {
          const underworld = overworld.underworld;
          if (!underworld) {
            console.error('Cannot "Skip to Ghost Biome", underworld does not exist');
            return;
          }
          if (!globalThis.isHost(underworld.pie)) {
            console.error('Cannot "Skip to Ghost Biome", player is not the host');
            return;
          }
          underworld.generateLevelData(9);
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Skip to Deathmason',
      action: () => {
        if (globalThis.player) {
          const underworld = overworld.underworld;
          if (!underworld) {
            console.error('Cannot "Skip to Deathmason level", underworld does not exist');
            return;
          }
          if (!globalThis.isHost(underworld.pie)) {
            console.error('Cannot "Skip to Deathmason level", player is not the host');
            return;
          }
          underworld.generateLevelData(config.LAST_LEVEL_INDEX);
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Regenerate Level',
      action: () => {
        const underworld = overworld.underworld;
        if (!underworld) {
          console.error('Cannot "Regenerate Level", underworld does not exist');
          return;
        }
        if (!globalThis.isHost(underworld.pie)) {
          console.error('Cannot "Regenerate Level", player is not the host');
          return;
        }
        underworld.generateLevelData(underworld.levelIndex);
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: '✖️ Delete',
      action: ({ selectedUnitid }) => {
        if (!overworld.underworld) {
          console.error('Cannot "delete unit", underworld does not exist');
          return;
        }
        // Remove without blood, remember clean up will just
        // flag them for deletion, they will be removed from the array
        // at the start of the next turn.
        const unit = overworld.underworld.units.find(u => u.id == selectedUnitid);
        if (unit) {
          Unit.cleanup(unit);
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-selected-unit'
    },
    // Support adding any modifier from Shift+Space menu
    ...Object.entries(allModifiers).map<AdminContextMenuOption>(([key, value]) => ({
      label: `Add modifier: ${key}`,
      action: ({ selectedUnitid }) => {
        if (!overworld.underworld) {
          console.error('add modifier, underworld does not exist');
          return;
        }
        const unit = overworld.underworld.units.find(u => u.id == selectedUnitid);
        if (unit) {
          Unit.addModifier(unit, key, overworld.underworld, false, value.quantityPerUpgrade || 1);
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '',
    })),
    {
      label: '🔪 Die',
      action: ({ selectedUnitid }) => {
        if (!overworld.underworld) {
          console.error('Cannot admin kill unit, underworld does not exist');
          return;
        }
        const unit = overworld.underworld.units.find(u => u.id == selectedUnitid);
        if (unit) {
          Unit.die(unit, overworld.underworld, false);
          overworld.underworld.progressGameState();
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-selected-unit'
    },
    {
      label: '🏳️ Change Faction',
      action: ({ selectedUnitid }) => {
        if (!overworld.underworld) {
          console.error('Cannot admin change unit faction, underworld does not exist');
          return;
        }
        const unit = overworld.underworld.units.find(u => u.id == selectedUnitid);
        if (unit) {
          if (unit.faction == Faction.ALLY) {
            unit.faction = Faction.ENEMY;
          } else {
            unit.faction = Faction.ALLY;
          }
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-selected-unit'
    },
    {
      label: 'Play All Animations',
      action: () => {
        if (globalThis.selectedUnit) {
          Unit.demoAnimations(globalThis.selectedUnit);
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-selected-unit'
    },
    {
      label: '❤️ Set Health',
      action: () => {
        if (!overworld.underworld) {
          console.error('Cannot admin set unit health, underworld does not exist');
          return;
        }
        const unit = overworld.underworld.units.find(u => u.id == globalThis.selectedUnit?.id);
        if (unit) {
          const health = prompt('Choose a new max health')
          const parsedHealth = parseInt(health || '');
          if (!isNaN(parsedHealth) && globalThis.selectedUnit) {
            overworld.pie.sendData({
              type: MESSAGE_TYPES.ADMIN_CHANGE_STAT,
              unitId: unit.id,
              stats: {
                healthMax: parsedHealth,
                health: parsedHealth
              }
            });
          } else {
            floatingText({ coords: getCamera(), text: 'Invalid number', style: { fill: 'red' } });
          }
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      // NOTE: Commands that use `prompt` cannot run on headless server so use ADMIN_CHANGE_STAT
      // message instead of ADMIN_COMMAND.  `supportInMultiplayer` is set to false so it doesn't
      // trigger an ADMIN_COMMAND message automatically
      supportInMultiplayer: false,
      domQueryContainer: '#menu-selected-unit'
    },
    // These commands are needed because "Set mana/health/stamina" requires `prompt`
    // which is not available in electron
    ...['stamina', 'mana', 'health'].map<AdminContextMenuOption>(stat => {
      return {
        label: `Give 100 ${stat}`,
        action: () => {
          if (!overworld.underworld) {
            console.error('Cannot admin set unit mana, underworld does not exist');
            return;
          }
          const unit = overworld.underworld.units.find(u => u.id == globalThis.selectedUnit?.id) || globalThis.player?.unit;
          if (unit) {
            overworld.pie.sendData({
              type: MESSAGE_TYPES.ADMIN_CHANGE_STAT,
              unitId: unit.id,
              stats: {
                // @ts-ignore
                [stat]: unit[stat] += 100,
              }
            });
          } else {
            centeredFloatingText('You must select a unit first', 'red');
          }
        },
        supportInMultiplayer: true,
        domQueryContainer: ''

      }
    }),
    {
      label: '🔵 Set Mana',
      action: () => {
        if (!overworld.underworld) {
          console.error('Cannot admin set unit mana, underworld does not exist');
          return;
        }
        const unit = overworld.underworld.units.find(u => u.id == globalThis.selectedUnit?.id);
        if (unit) {
          const mana = prompt('Choose a new max mana')
          const parsedMana = parseInt(mana || '');
          if (!isNaN(parsedMana)) {
            overworld.pie.sendData({
              type: MESSAGE_TYPES.ADMIN_CHANGE_STAT,
              unitId: unit.id,
              stats: {
                manaMax: parsedMana,
                mana: parsedMana,
                manaPerTurn: parsedMana,
              }
            });
          } else {
            floatingText({ coords: getCamera(), text: 'Invalid number', style: { fill: 'red' } });

          }
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      // NOTE: Commands that use `prompt` cannot run on headless server so use ADMIN_CHANGE_STAT
      // message instead of ADMIN_COMMAND.  `supportInMultiplayer` is set to false so it doesn't
      // trigger an ADMIN_COMMAND message automatically
      supportInMultiplayer: false,
      domQueryContainer: '#menu-selected-unit'

    },
    {
      label: '👟 Set Stamina',
      action: () => {
        if (!overworld.underworld) {
          console.error('Cannot admin set unit stamina, underworld does not exist');
          return;
        }
        const unit = overworld.underworld.units.find(u => u.id == globalThis.selectedUnit?.id);
        if (unit) {
          const stamina = prompt('Choose a new max stamina')
          const parsedStamina = parseInt(stamina || '');
          if (!isNaN(parsedStamina)) {
            overworld.pie.sendData({
              type: MESSAGE_TYPES.ADMIN_CHANGE_STAT,
              unitId: unit.id,
              stats: {
                staminaMax: parsedStamina,
                stamina: parsedStamina
              }
            });
          } else {
            floatingText({ coords: getCamera(), text: 'Invalid number', style: { fill: 'red' } });

          }
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      // NOTE: Commands that use `prompt` cannot run on headless server so use ADMIN_CHANGE_STAT
      // message instead of ADMIN_COMMAND.  `supportInMultiplayer` is set to false so it doesn't
      // trigger an ADMIN_COMMAND message automatically
      supportInMultiplayer: false,
      domQueryContainer: '#menu-selected-unit'

    },
    {
      label: '👹 Make Miniboss',
      action: () => {
        if (!overworld.underworld) {
          console.error('Cannot admin make unit miniboss, underworld does not exist');
          return;
        }
        const unit = overworld.underworld.units.find(u => u.id == globalThis.selectedUnit?.id);
        if (unit) {
          Unit.makeMiniboss(unit, overworld.underworld);
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-selected-unit'

    },
    {
      label: 'Give all modifiers',
      action: () => {
        if (!overworld.underworld) {
          console.error('Cannot admin give unit all modifiers, underworld does not exist');
          return;
        }
        const unit = overworld.underworld.units.find(u => u.id == globalThis.selectedUnit?.id);
        if (unit) {
          Object.keys(allModifiers).forEach(key => {
            // Some modifiers throw errors if not given "extra" parameter. Manually exclude these
            const ignoreKeys = ['Grace', 'Regenerate', 'Caltrops', 'Soul Shard', 'Soul Shard Owner', 'Bloat', "Poison"];
            if (overworld.underworld && !ignoreKeys.includes(key)) {
              Unit.addModifier(unit, key, overworld.underworld, false, 1);
            }
          });
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-selected-unit'
    },
    {
      label: 'Skip next turn action',
      action: () => {
        if (!overworld.underworld) {
          console.error('Admin: Cannot apply summoning sickness, underworld does not exist');
          return;
        }
        const unit = overworld.underworld.units.find(u => u.id == globalThis.selectedUnit?.id);
        if (unit) {
          Unit.addModifier(unit, summoningSicknessId, overworld.underworld, false);
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-selected-unit'


    },
    {
      label: 'Orient image towards player',
      action: () => {
        if (globalThis.selectedUnit && player) {
          Unit.orient(globalThis.selectedUnit, player.unit);
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-selected-unit'

    },
    {
      label: 'Test: Induce server desync - selected unit position to NaN, NaN',
      action: (props) => {
        const selectedUnit = overworld.underworld?.units.find(u => u.id == props.selectedUnitid)
        if (selectedUnit) {
          if (globalThis.headless) {
            console.log('Server desync ', selectedUnit.name, 'to NaN,NaN');
            selectedUnit.x = NaN;
            selectedUnit.y = NaN;
          } else {
            floatingText({ coords: selectedUnit, text: 'on server: unit position to NaN, NaN' })
          }
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: ''

    },
    {
      label: 'Test: Induce server desync - selected player.endedTurn',
      action: (props) => {
        const selectedUnit = overworld.underworld?.units.find(u => u.id == props.selectedUnitid)
        const player = overworld.underworld?.players.find(p => p.unit == selectedUnit);
        if (player) {
          if (globalThis.headless) {
            player.endedTurn = !player.endedTurn;
            console.log('Server desync ', player.name, 'to endedTurn:', player.endedTurn);
          } else {
            centeredFloatingText('Desynced server player.endedTurn to: ' + !player.endedTurn, 'green');
          }
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: ''

    },
    {
      label: 'Test: Induce server desync - selected unit',
      action: (props) => {
        const selectedUnit = overworld.underworld?.units.find(u => u.id == props.selectedUnitid)
        if (selectedUnit) {
          if (globalThis.headless) {
            selectedUnit.x += 100;
            selectedUnit.health = 1;
          } else {
            floatingText({ coords: selectedUnit, text: 'on server: unit.x += 100, unit.health = 1' })
          }
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: ''

    },
    {
      label: 'Test: Induce client desync - selected unit',
      action: (props) => {
        const selectedUnit = overworld.underworld?.units.find(u => u.id == props.selectedUnitid)
        if (selectedUnit) {
          if (!globalThis.headless) {
            selectedUnit.x -= 100;
            selectedUnit.health = 2
          }
        } else {
          centeredFloatingText('You must select a unit first', 'red');
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: ''
    },
    {
      label: 'Test: Induce server desync - new unit',
      action: (props) => {
        if (globalThis.headless) {
          const sourceUnit = allUnits.golem;
          const summonLocation = {
            x: 100,
            y: 100
          }
          if (sourceUnit) {
            if (overworld.underworld) {
              Unit.create(
                sourceUnit.id,
                summonLocation.x,
                summonLocation.y,
                Faction.ALLY,
                sourceUnit.info.image,
                UnitType.AI,
                sourceUnit.info.subtype,
                {
                  ...sourceUnit.unitProps,
                  isMiniboss: false,
                  strength: 1,
                },
                overworld.underworld,
                false
              );
            } else {
              centeredFloatingText(`Unit created at ${summonLocation.x},${summonLocation.y} on server`, 'blue');
            }
          }
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: ''

    },
    {
      label: 'Test: Induce client desync - new unit',
      action: (props) => {
        if (!globalThis.headless) {
          const sourceUnit = allUnits.golem;
          const summonLocation = {
            x: 100,
            y: 100
          }
          if (sourceUnit) {
            if (overworld.underworld) {
              Unit.create(
                sourceUnit.id,
                summonLocation.x,
                summonLocation.y,
                Faction.ALLY,
                sourceUnit.info.image,
                UnitType.AI,
                sourceUnit.info.subtype,
                {
                  ...sourceUnit.unitProps,
                  isMiniboss: false,
                  strength: 1,
                },
                overworld.underworld,
                false
              );
              centeredFloatingText(`Unit created at ${summonLocation.x},${summonLocation.y} only on client and not on server`, 'blue');
            }
          }
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: ''
    },
    ...[
      CardCategory.Mana,
      CardCategory.Blessings,
      CardCategory.Curses,
      CardCategory.Damage,
      CardCategory.Movement,
      CardCategory.Targeting,
      CardCategory.Soul
    ].map<AdminContextMenuOption>(category => {
      return {
        label: `Test: Cast all ${CardCategory[category]} spells`,
        action: ({ selectedUnitid }) => {
          if (!overworld.underworld) {
            console.error(`Cannot admin Cast all ${CardCategory[category]} spells, underworld does not exist`);
            return;
          }

          const unit = overworld.underworld.units.find(u => u.id == selectedUnitid);

          if (unit && player) {
            // Give player enough mana to cast
            const newMana = 20_000;
            overworld.pie.sendData({
              type: MESSAGE_TYPES.ADMIN_CHANGE_STAT,
              unitId: player.unit.id,
              stats: {
                health: 100,
                healthMax: 100,
                mana: newMana,
                manaMax: newMana
              }
            });

            if (player) {
              const cardIds = Object.values(allCards).filter(c => c.category == category).map(c => c.id);
              if (category == CardCategory.Targeting) {
                // Must add an additional card to the targeting spells for them to do anything
                cardIds.push('resurrect');
              }
              floatingText({ coords: player.unit, text: cardIds.join(',') });

              overworld.pie.sendData({
                type: MESSAGE_TYPES.SPELL,
                casterPositionAtTimeOfCast: Vec.clone(player.unit),
                x: unit.x,
                y: unit.y,
                cards: cardIds,
                initialTargetedUnitId: unit.id,
                initialTargetedPickupId: undefined
              });
            }
          }

        },
        supportInMultiplayer: true,
        domQueryContainer: '#menu-selected-unit'
      };
    }),
    {
      label: '️✖️ Delete',
      action: ({ selectedPickupLocation }) => {
        if (!overworld.underworld) {
          console.error('Cannot admin delete pickup, underworld does not exist');
          return;
        }
        if (selectedPickupLocation) {
          const pickup = overworld.underworld.pickups.find(p => p.x == selectedPickupLocation.x && p.y == selectedPickupLocation.y);
          if (pickup) {
            Pickup.removePickup(pickup, overworld.underworld, false);
          }
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-selected-pickup'
    }
  ];
  for (let op of options) {
    // Register with admin commands:
    adminCommands[op.label] = op;
  }
}
export function triggerAdminOption(option: AdminContextMenuOption, overworld: Overworld, pos?: Vec2) {
  const { label, action, domQueryContainer, supportInMultiplayer } = option;
  if (supportInMultiplayer) {
    overworld.pie.sendData({
      type: MESSAGE_TYPES.ADMIN_COMMAND,
      label,
      pos,
      selectedUnitid: globalThis.selectedUnit && globalThis.selectedUnit.id,
      selectedPickupLocation: globalThis.selectedPickup && Vec.clone(globalThis.selectedPickup),
      playerId: globalThis.player?.playerId || ''
    });
  } else {
    // Warn when non supportInMultiplayer admin commands are executed to let the admin know
    // that the command wont persist to the server.
    if (!globalThis.isHost(overworld.pie)) {
      const errMsg = 'This admin command is not broadcast to multiplayer';
      if (globalThis.player) {
        floatingText({ coords: globalThis.player.unit, style: { fill: 'red' }, text: errMsg })
      }
    }
    action({ playerId: globalThis.player?.playerId || '', pos });
  }

}
function createContextMenuOptions(menu: HTMLElement, overworld: Overworld) {
  if (!overworld.underworld) {
    console.error('Cannot create context menu options, underworld does not exist');
    return;
  }
  for (let option of Object.values(adminCommands)) {
    const { label, domQueryContainer } = option;
    // Make DOM button to trigger command
    let el = document.createElement('li');
    if (Object.keys(allUnits).includes(label)) {
      // Add unit summon image to help identify them
      el.innerHTML = `<img width="32px" height="32px" src="${CardUI.getSpellThumbnailPath(`spellIconSummon_${label.split(' ').join('').toLowerCase()}.png`)}"/>&nbsp;${label}`
    } else {
      el.innerHTML = label;
    }
    // cache mouse position when context menu is created
    const pos = overworld.underworld.getMousePos();
    el.addEventListener('click', () => {
      triggerAdminOption(option, overworld, pos)
      // Close the menu
      menu.remove();
      document.getElementById('admin-menu-holder')?.remove();
    })
    // domQueryContainer is optional for admin commands only accessible via the power bar
    if (domQueryContainer) {
      const container = document.querySelector(domQueryContainer);
      if (container) {
        container.appendChild(el);
      } else {
        console.error('Could not find DOM element by query:', domQueryContainer)
      }
    }
  }

}
function updatePowerBar(): AdminContextMenuOption[] {
  const options = Object.values(adminCommands).filter(x => elAdminPowerBarInput ? x.label.toLowerCase().includes(elAdminPowerBarInput.value.toLowerCase()) : true);
  globalThis.adminPowerBarIndex = Math.max(0, Math.min(globalThis.adminPowerBarIndex, options.length - 1))

  // Overide index if I have a previous selection
  if (globalThis.adminPowerBarSelection) {
    const index = options.findIndex(x => x.label == globalThis.adminPowerBarSelection);
    globalThis.adminPowerBarIndex = Math.max(0, index);
  }

  if (elAdminPowerBarOptions) {
    elAdminPowerBarOptions.innerHTML = options.map((x, i) => i == globalThis.adminPowerBarIndex ? `<div class="selected-admin-action">${x.label}</div>` : `<div>${x.label}</div>`).join('\n');
  }
  return options;
}