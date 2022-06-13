import {
  containerCharacterSelect,
  addPixiContainersForView,
  resizePixi,
  app,
  updateCameraPosition,
} from './PixiUtils';
import * as PIXI from 'pixi.js';
import * as Units from './units';
import { UnitSubType } from './commonTypes';
import { MESSAGE_TYPES } from './MessageTypes';
import * as Image from './Image';
import * as config from './config';
import {
  clickHandler,
  contextmenuHandler,
  endTurnBtnListener,
  keydownListener,
  keyupListener,
  mouseDownHandler,
  mouseUpHandler,
  mouseMove,
  onWindowBlur,
} from './ui/eventListeners';

const elPIXIHolder = document.getElementById('PIXI-holder') as HTMLElement;
// A view is not shared between players in the same game, a player could choose any view at any time
export enum View {
  Menu,
  Setup,
  CharacterSelect,
  Game,
  Disconnected
}
const elUpgradePicker = document.getElementById('upgrade-picker') as HTMLElement;
let lastNonMenuView: View | undefined;
function closeMenu() {
  // Change to the last non menu view
  if (lastNonMenuView) {
    setView(lastNonMenuView);
    // When the menu closes, set the menu back
    // to the main menu route
    window.setMenu('PLAY');
  } else {
    console.log('Cannot close menu yet, no previous view to change to.');
  }

}
const menuBtnId = 'menuBtn';
const elMenuBtn: HTMLButtonElement = document.getElementById(
  menuBtnId,
) as HTMLButtonElement;
elMenuBtn.addEventListener('click', toggleMenu);
// Make 'closeMenu' available to the svelte menu
window.closeMenu = closeMenu;
export function toggleMenu() {
  const elMenu = document.getElementById('menu') as HTMLElement;
  const menuClosed = elMenu.classList.contains('hidden');
  if (menuClosed) {
    // Open it
    setView(View.Menu);
  } else {
    closeMenu();
  }

}
// The "View" is what the client is looking at
// No gamelogic should be executed inside setView
// including setup.
export function setView(v: View) {
  console.log('setView(', View[v], ')');
  if (window.view == v) {
    // Prevent setting a view more than once if the view hasn't changed
    // Since some of these views, (such as upgrade) have
    // initialization logic
    console.log('Short circuit: View has already been set to ', View[v], 'so setView has exited without doing anything.');
    return;
  }
  for (let view of Object.keys(View)) {
    document.body.classList.remove(`view-${view}`);
  }
  document.body.classList.add(`view-${View[v]}`);
  window.view = v;
  addPixiContainersForView(v);
  const elMenu = document.getElementById('menu') as HTMLElement;
  if (v !== View.Menu) {
    elMenu.classList.add('hidden');
    lastNonMenuView = v;
  }
  removeUnderworldEventListeners();
  // Hide the upgrade picker when the view changes
  elUpgradePicker.classList.remove('active');
  switch (v) {
    case View.Menu:
      elMenu.classList.remove('hidden');
      window.updateInGameMenuStatus();
      break;
    case View.CharacterSelect:
      // Host or join a game brings client to Character select
      const playerControlledUnits =
        Object.values(Units.allUnits)
          .filter(
            (unitSource) =>
              unitSource.info.subtype === UnitSubType.PLAYER_CONTROLLED,
          );

      playerControlledUnits.forEach((unitSource, index) => {
        const image = Image.create(
          { x: 0, y: 0 },
          unitSource.info.image,
          containerCharacterSelect,
        );
        Image.setPosition(image, { x: (index - playerControlledUnits.length / 2) * image.sprite.width + image.sprite.width / 2, y: 0 })
        image.sprite.interactive = true;
        image.sprite.on('click', () => {
          // Timeout prevents click from propagating into overworld listener
          // for some reason e.stopPropagation doesn't work :/
          setTimeout(() => {
            clientChooseUnit(unitSource.id);
          }, 0);
        });
        // If devMode is true, automatically choose the first character
        if (index == 0 && window.devMode) {
          clientChooseUnit(unitSource.id);
        }
      });
      // Add title:
      const pixiText = new PIXI.Text("Select a Character", { fill: 'white', align: 'center' });
      pixiText.x = 0;
      pixiText.y = -config.COLLISION_MESH_RADIUS * 2;
      pixiText.anchor.x = 0.5;
      pixiText.anchor.y = 0.5;
      containerCharacterSelect.addChild(pixiText);

      break;
    case View.Game:
      resizePixi();
      addUnderworldEventListeners();
      break;
    case View.Disconnected:
      // Intentionally left blank - this view is handled in css
      break;
    default:
      console.error('Cannot set view to', v, 'no such view exists or is not configured');
      break;
  }
  // Update the camera position when the view changes because gameLoop might not be
  // running yet (and gameLoop is what usually updates the camera position)
  updateCameraPosition();
}

function clientChooseUnit(unitId: string) {
  // Cleanup container
  containerCharacterSelect.removeChildren();

  window.pie.sendData({
    type: MESSAGE_TYPES.CHANGE_CHARACTER,
    unitId
  });
  // Now that user has selected a character, they can enter the game
  setView(View.Game);
}

// zoom camera
function zoom(e: WheelEvent) {
  // TODO: This value could be customizable in the menu later:
  const scrollSensitivity = 200;
  const scrollFactor = Math.abs(e.deltaY / scrollSensitivity);
  const zoomIn = e.deltaY < 0;
  const zoomDelta = (zoomIn ? 1 + 1 * scrollFactor : 1 - 0.5 * scrollFactor);
  let newScale = app.stage.scale.x * zoomDelta;
  // Limit zoom out and in to sensible limits
  newScale = Math.min(Math.max(0.3, newScale), 4);

  window.zoomTarget = newScale;
}


const endTurnBtnId = 'end-turn-btn';
function addUnderworldEventListeners() {
  // Add keyboard shortcuts
  window.addEventListener('keydown', keydownListener);
  window.addEventListener('keyup', keyupListener);
  elPIXIHolder.addEventListener('contextmenu', contextmenuHandler);
  document.body.addEventListener('click', clickHandler);
  window.addEventListener('mousedown', mouseDownHandler);
  window.addEventListener('mouseup', mouseUpHandler);
  window.addEventListener('blur', onWindowBlur);
  document.body.addEventListener('wheel', zoom);
  document.body.addEventListener('mousemove', mouseMove);
  // Add button listeners
  const elEndTurnBtn: HTMLButtonElement = document.getElementById(
    endTurnBtnId,
  ) as HTMLButtonElement;
  elEndTurnBtn.addEventListener('click', endTurnBtnListener);

}

export function removeUnderworldEventListeners() {
  // Remove keyboard shortcuts
  window.removeEventListener('keydown', keydownListener);
  window.removeEventListener('keyup', keyupListener);
  // Remove mouse and click listeners
  document.body.removeEventListener('contextmenu', contextmenuHandler);
  document.body.removeEventListener('click', clickHandler);
  document.body.removeEventListener('wheel', zoom);
  document.body.removeEventListener('mousemove', mouseMove);
  // Remove button listeners
  const elEndTurnBtn: HTMLButtonElement = document.getElementById(
    endTurnBtnId,
  ) as HTMLButtonElement;
  elEndTurnBtn.removeEventListener('click', endTurnBtnListener);
}