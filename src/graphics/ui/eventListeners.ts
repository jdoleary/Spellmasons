import { MESSAGE_TYPES } from '../../types/MessageTypes';
import throttle from 'lodash.throttle';
import * as CardUI from './CardUI';
import * as Unit from '../../entity/Unit';
import * as Pickup from '../../entity/Pickup';
import * as Player from '../../entity/Player';
import * as storage from '../../storage';
import floatingText from '../FloatingText';
import {
  clearSpellEffectProjection,
  clearTooltipSelection,
  clearTints,
  drawCircleUnderTarget,
  drawWalkRope,
  isOutOfBounds,
  runPredictions,
  updateTooltipSelection,
} from '../PlanningView';
import { toggleMenu, View } from '../../views';
import * as config from '../../config';
import { cameraAutoFollow, getCamera, graphicsBloodSmear, moveCamera, toggleHUD } from '../PixiUtils';
import { isOutOfRange } from '../../PlayerUtils';
import { vec2ToOneDimentionIndexPreventWrap } from '../../jmath/ArrayUtil';
import * as Vec from '../../jmath/Vec';
import { Vec2 } from '../../jmath/Vec';
import Underworld, { biome_level_index_map, showUpgradesClassName } from '../../Underworld';
import { toLineSegments } from '../../jmath/Polygon2';
import { closestLineSegmentIntersection } from '../../jmath/lineSegment';
import { allUnits } from '../../entity/units';
import { Faction } from '../../types/commonTypes';
import * as Freeze from '../../cards/freeze';
import { collideWithLineSegments } from '../../jmath/moveWithCollision';
import { getKeyCodeMapping } from './keyMapping';
import { inPortal } from '../../entity/Player';
import * as Doodad from '../../entity/Doodad';
import { hasTargetAtPosition } from '../../cards';
import { explain, EXPLAIN_END_TURN, tutorialCompleteTask, updateTutorialChecklist } from '../Explain';
import { Overworld } from '../../Overworld';

export const keyDown = {
  showWalkRope: false,
  cameraUp: false,
  cameraLeft: false,
  cameraDown: false,
  cameraRight: false
}

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
export function keydownListener(overworld: Overworld, event: KeyboardEvent) {
  // Only handle hotkeys when viewing the Game
  if (globalThis.view !== View.Game) {
    return;
  }
  if (event.code == 'Tab') {
    event.preventDefault();
  }
  const { underworld } = overworld;
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
    // Event was handled
    promptNoBtn.click();
    // Return immediately, prompt hotkey overrides other hotkeys
    return;
  }
  handleInputDown(getKeyCodeMapping(event.code), overworld);
}
function handleInputDown(keyCodeMapping: string | undefined, overworld: Overworld) {
  if (keyCodeMapping === undefined) {
    return;
  }
  const { underworld } = overworld;
  if (!underworld) {
    return;
  }
  switch (keyCodeMapping) {
    case 'clearQueuedSpell':
      const thereWasInventoryOpen = document.body?.classList.contains(CardUI.openInvClass);
      // force close inventory
      CardUI.toggleInventory(undefined, false, underworld);
      if (thereWasInventoryOpen) {
        // If inventory was open, don't clear selected cards
        return;
      }
      const thereWasTooltipActive = clearTooltipSelection();
      const thereWereCardsSelected = CardUI.areAnyCardsSelected();
      CardUI.clearSelectedCards(underworld);
      if (!thereWasTooltipActive && !thereWereCardsSelected && !thereWasInventoryOpen) {
        // Otherwise finally toggle menu
        toggleMenu();
      }
      break;
    case 'openInventory':
      CardUI.toggleInventory(undefined, undefined, underworld);
      break;
    case 'dequeueSpell':
      CardUI.deselectLastCard();
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
        const mouseTarget = underworld.getMousePos();
        floatingText({
          coords: mouseTarget,
          text: 'You must spawn first'
        })
        playSFXKey('deny');
      }
      break;
    case 'endTurn':
      underworld.endMyTurn();
      break;
    case 'spell1':
      CardUI.selectCardByIndex(0);
      break;
    case 'spell2':
      CardUI.selectCardByIndex(1);
      break;
    case 'spell3':
      CardUI.selectCardByIndex(2);
      break;
    case 'spell4':
      CardUI.selectCardByIndex(3);
      break;
    case 'spell5':
      CardUI.selectCardByIndex(4);
      break;
    case 'spell6':
      CardUI.selectCardByIndex(5);
      break;
    case 'spell7':
      CardUI.selectCardByIndex(6);
      break;
    case 'spell8':
      CardUI.selectCardByIndex(7);
      break;
    case 'spell9':
      CardUI.selectCardByIndex(8);
      break;
    case 'spell0':
      CardUI.selectCardByIndex(9);
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
  handleInputUp(getKeyCodeMapping(event.code), overworld);
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
  }
}

export function endTurnBtnListener(overworld: Overworld, e: MouseEvent) {
  overworld.underworld?.endMyTurn();
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

export function mouseMove(underworld: Underworld, e?: MouseEvent) {
  // Only handle clicks when viewing the Game
  if (globalThis.view !== View.Game) {
    return;
  }
  if (!underworld) {
    console.error('Cannot run mouseMove, underworld is undefined');
    return;
  }
  const mouseTarget = underworld.getMousePos();
  // Move the spawn "ghost" around so players can see where they will
  // spawn if they click
  if (globalThis.player && !globalThis.player.isSpawned &&
    !document.body?.classList.contains(showUpgradesClassName)) {
    const spawnPoint = { ...mouseTarget, radius: config.COLLISION_MESH_RADIUS }
    collideWithLineSegments(spawnPoint, underworld.walls, underworld);
    if (globalThis.player.unit.image) {
      globalThis.player.unit.image.sprite.alpha = 0.5;
      if (underworld.isCoordOnWallTile(spawnPoint) || isOutOfBounds(spawnPoint, underworld)) {
        globalThis.player.unit.x = NaN;
        globalThis.player.unit.y = NaN;
      } else {
        globalThis.player.unit.x = spawnPoint.x;
        globalThis.player.unit.y = spawnPoint.y;
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
    if (keyDown.showWalkRope) {
      drawWalkRope(mouseTarget, underworld);
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
            // Send current player movements to server
            sendMovePlayer(underworld);
            tutorialCompleteTask('moved', () => !!globalThis.player && globalThis.player.unit.stamina <= globalThis.player.unit.staminaMax * 0.7);

          } else {
            if (!globalThis.notifiedOutOfStamina) {
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
        } else {
          console.log('Cannot move until player is spawned into the level.');
        }
      } else {
        notifyYouMustWaitForYourTurn(mouseTarget);
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
export function mouseUpHandler(overworld: Overworld, e: MouseEvent) {
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

  if (isOutOfBounds(mousePos, underworld)) {
    // Disallow click out of bounds
    floatingText({
      coords: mousePos,
      text: 'Out of bounds!'
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
      // Spawn player:
      overworld.pie.sendData({
        type: MESSAGE_TYPES.SPAWN_PLAYER,
        x: spawnPoint.x,
        y: spawnPoint.y,
      });
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
            text: `${lastCard.id} only modifies\nspells on its right`,
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
        if (isOutOfRange(selfPlayer, mousePos, underworld)) {
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
        if ((!hasTarget) && cards.length && cards[0] && !cards[0].allowNonUnitTarget) {
          floatingText({
            coords: target,
            text: 'No Target!'
          });
          playSFXKey('deny_target');
          // Cancel Casting
          return;
        }


        if (selfPlayer.unit.modifiers[Freeze.id]) {
          floatingText({ coords: selfPlayer.unit, text: 'Cannot Cast. Frozen.' })
          playSFXKey('deny');
          // Cancel Casting
          return
        }
        clearSpellEffectProjection(underworld);
        // Clear resMarkers so they don't hang around once the spell is cast
        globalThis.resMarkers = [];

        overworld.pie.sendData({
          type: MESSAGE_TYPES.SPELL,
          x: target.x,
          y: target.y,
          cards: cardIds,
        });
        CardUI.clearSelectedCards(underworld);
        // Now that the cast has begun, clear the prediction tint so it doesn't color the targeted units anymore
        clearTints(underworld);
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
    let menu = document.createElement("div") as HTMLElement;
    menu.id = "ctxmenu"
    menu.style.top = `${Math.max(0, e.pageY - 100)}px`;
    menu.style.left = `${Math.max(0, e.pageX - 400)}px`;
    menu.style.zIndex = '2';
    menu.onmouseleave = () => menu.outerHTML = '';
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
    document.body.appendChild(menu);

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
const adminCommands: { [label: string]: AdminContextMenuOption } = {};
export function triggerAdminCommand(label: string, clientId: string, payload: any) {
  const { action } = adminCommands[label] || {};
  if (action) {
    action({ clientId, ...payload });
  } else {
    console.error('No admin action with label', label);
  }
}
interface AdminActionProps {
  clientId?: string;
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
      action: ({ clientId }: { clientId?: string }) => {
        if (superMe && overworld.underworld) {
          superMe(overworld.underworld, overworld.underworld.players.find(p => p.clientId == clientId) || globalThis.player);
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-self',
    },
    {
      label: '☄️ Teleport Here',
      action: (props) => {
        const { clientId, pos } = props;
        if (!overworld.underworld) {
          console.error('Cannot teleport, underworld does not exist');
          return;
        }
        const player = overworld.underworld.players.find(p => p.clientId == clientId);
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
          Pickup.create({ pos, pickupSource: p }, overworld.underworld, false);
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-spawn-pickup'
    })),
    ...Doodad.doodads.map<AdminContextMenuOption>(d => ({
      label: d.name,
      action: ({ pos }) => {
        if (!overworld.underworld) {
          console.error('Cannot spawn doodad, underworld does not exist');
          return;
        }
        if (pos) {
          Doodad.create({ pos, source: d }, overworld.underworld, false);
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-spawn-doodad'
    })),
    ...Object.values(allUnits).map<AdminContextMenuOption>(u => ({
      label: u.id,
      action: ({ pos }) => {
        if (pos) {
          if (!overworld.underworld) {
            console.error('Cannot spawn unit, underworld does not exist');
            return;
          }
          overworld.underworld.spawnEnemy(u.id, pos, false);
          // Orient newly spawned units towards the player
          if (globalThis.player) {
            const justSpawnedUnit = overworld.underworld.units[overworld.underworld.units.length - 1];
            if (justSpawnedUnit) {
              Unit.orient(justSpawnedUnit, globalThis.player.unit);
            }
          }
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-spawn'
    })),
    {
      label: 'Spawn many enemies',
      action: ({ pos }) => {
        if (pos && overworld.underworld) {
          const spawns = overworld.underworld.findValidSpawns(pos, 20, 5);
          for (let spawn of spawns) {
            overworld.underworld.spawnEnemy('golem', spawn, false);
          }
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
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-global'
    },
    {
      label: '🩸 Clean up Blood',
      action: () => {
        graphicsBloodSmear?.clear();
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Skip to Water Biome',
      action: () => {
        if (globalThis.player) {
          if (!overworld.underworld) {
            console.error('Cannot "Skip to Water Biome", underworld does not exist');
            return;
          }
          overworld.underworld.levelIndex = biome_level_index_map.water;
          Player.enterPortal(globalThis.player, overworld.underworld);
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Skip to Lava Biome',
      action: () => {
        if (globalThis.player) {
          if (!overworld.underworld) {
            console.error('Cannot "Skip to Lava Biome", underworld does not exist');
            return;
          }
          overworld.underworld.levelIndex = biome_level_index_map.lava;
          Player.enterPortal(globalThis.player, overworld.underworld);
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Skip to Blood Biome',
      action: () => {
        if (globalThis.player) {
          if (!overworld.underworld) {
            console.error('Cannot "Skip to Blood Biome", underworld does not exist');
            return;
          }
          overworld.underworld.levelIndex = biome_level_index_map.blood;
          Player.enterPortal(globalThis.player, overworld.underworld);
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Skip to Ghost Biome',
      action: () => {
        if (globalThis.player) {
          if (!overworld.underworld) {
            console.error('Cannot "Skip to Ghost Biome", underworld does not exist');
            return;
          }
          overworld.underworld.levelIndex = biome_level_index_map.ghost;
          Player.enterPortal(globalThis.player, overworld.underworld);
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-global'
    },
    {
      label: 'Regenerate Level',
      action: () => {
        if (!overworld.underworld) {
          console.error('Cannot "Regenerate Level", underworld does not exist');
          return;
        }
        overworld.underworld.generateLevelData(overworld.underworld.levelIndex);
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
        }
      },
      supportInMultiplayer: true,
      domQueryContainer: '#menu-selected-unit'
    },
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
        const health = prompt('Choose a new max health')
        const parsedHealth = parseInt(health || '');
        if (!isNaN(parsedHealth) && globalThis.selectedUnit) {
          const unit = overworld.underworld.units.find(u => u.id == globalThis.selectedUnit?.id);
          if (unit) {
            overworld.pie.sendData({
              type: MESSAGE_TYPES.ADMIN_CHANGE_STAT,
              unitId: unit.id,
              stats: {
                healthMax: parsedHealth,
                health: parsedHealth
              }
            });
          }
        }
      },
      // NOTE: Commands that use `prompt` cannot run on headless server so use ADMIN_CHANGE_STAT
      // message instead of ADMIN_COMMAND.  `supportInMultiplayer` is set to false so it doesn't
      // trigger an ADMIN_COMMAND message automatically
      supportInMultiplayer: false,
      domQueryContainer: '#menu-selected-unit'
    },
    {
      label: '🔵 Set Mana',
      action: () => {
        if (!overworld.underworld) {
          console.error('Cannot admin set unit mana, underworld does not exist');
          return;
        }
        const mana = prompt('Choose a new max mana')
        const parsedMana = parseInt(mana || '');
        if (!isNaN(parsedMana)) {
          const unit = overworld.underworld.units.find(u => u.id == globalThis.selectedUnit?.id);
          if (unit) {
            overworld.pie.sendData({
              type: MESSAGE_TYPES.ADMIN_CHANGE_STAT,
              unitId: unit.id,
              stats: {
                manaMax: parsedMana,
                mana: parsedMana
              }
            });
          }
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
        const stamina = prompt('Choose a new max stamina')
        const parsedStamina = parseInt(stamina || '');
        if (!isNaN(parsedStamina)) {
          const unit = overworld.underworld.units.find(u => u.id == globalThis.selectedUnit?.id);
          if (unit) {
            overworld.pie.sendData({
              type: MESSAGE_TYPES.ADMIN_CHANGE_STAT,
              unitId: unit.id,
              stats: {
                staminaMax: parsedStamina,
                stamina: parsedStamina
              }
            });
          }
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
          Unit.makeMiniboss(unit);
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
        }
      },
      supportInMultiplayer: false,
      domQueryContainer: '#menu-selected-unit'

    },
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
function createContextMenuOptions(menu: HTMLElement, overworld: Overworld) {
  if (!overworld.underworld) {
    console.error('Cannot create context menu options, underworld does not exist');
    return;
  }
  for (let { label, action, domQueryContainer, supportInMultiplayer } of Object.values(adminCommands)) {
    // Make DOM button to trigger command
    let el = document.createElement('li');
    el.innerHTML = label
    // cache mouse position when context menu is created
    const pos = overworld.underworld.getMousePos();
    el.addEventListener('click', () => {
      if (supportInMultiplayer) {
        overworld.pie.sendData({
          type: MESSAGE_TYPES.ADMIN_COMMAND,
          label,
          pos,
          selectedUnitid: globalThis.selectedUnit && globalThis.selectedUnit.id,
          selectedPickupLocation: globalThis.selectedPickup && Vec.clone(globalThis.selectedPickup)
        });
      } else {
        // Warn when non supportInMultiplayer admin commands are executed to let the admin know
        // that the command wont persist to the server.
        if (!globalThis.isHost(overworld.pie)) {
          const errMsg = 'This admin command is not broadcast to multiplayer';
          if (globalThis.player) {
            floatingText({ coords: globalThis.player.unit, style: { fill: 'red' }, text: errMsg })
          } else {
            alert(errMsg);
          }
        }
        action({ clientId: globalThis.clientId || '', pos });
      }
      // Close the menu
      menu.remove();
    })
    const container = document.querySelector(domQueryContainer);
    if (container) {
      container.appendChild(el);
    } else {
      console.error('Could not find DOM element by query:', domQueryContainer)
    }
  }

}