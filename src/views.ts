import {
  containerCharacterSelect,
  addPixiContainersForView,
  resizePixi,
  app,
  cameraAutoFollow,
  updateCameraPosition,
} from './PixiUtils';
import * as PIXI from 'pixi.js';
import * as Units from './units';
import { UnitSubType } from './commonTypes';
import { MESSAGE_TYPES } from './MessageTypes';
import * as Image from './Image';
import * as config from './config';
import { createUpgradeElement, generateUpgrades } from './Upgrade';
import {
  clickHandler,
  contextmenuHandler,
  endTurnBtnListener,
  keydownListener,
  keyupListener,
  mouseMove,
} from './ui/eventListeners';

// A view is not shared between players in the same game, a player could choose any view at any time
export enum View {
  Menu,
  Setup,
  CharacterSelect,
  Game,
  Upgrade,
}
let lastNonMenuView: View | undefined;
function closeMenu() {
  // Change to the last non menu view
  if (lastNonMenuView) {
    setView(lastNonMenuView);
  } else {
    console.log('Cannot close menu yet, no previous view to change to.');
  }

}
// Make 'closeMenu' available to the svelte menu
window.closeMenu = closeMenu;
export function toggleMenu() {
  console.log('toggle menu');
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
  const elUpgradePicker = document.getElementById('upgrade-picker');
  // Hide the upgrade picker when the view changes
  elUpgradePicker && elUpgradePicker.classList.remove('active');
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
      });
      // Add title:
      const pixiText = new PIXI.Text("Select a Character", { fill: 'white', align: 'center' });
      pixiText.x = 0;
      pixiText.y = -config.COLLISION_MESH_RADIUS * 2;
      pixiText.anchor.x = 0.5;
      pixiText.anchor.y = 0.5;
      containerCharacterSelect.addChild(pixiText);

      break;
    case View.Upgrade:
      const elUpgradePickerContent = document.getElementById(
        'upgrade-picker-content',
      );
      if (!elUpgradePicker || !elUpgradePickerContent) {
        console.error('elUpgradePicker or elUpgradePickerContent are undefined.');
      }
      // Reveal the upgrade picker
      elUpgradePicker && elUpgradePicker.classList.add('active');
      const player = window.underworld.players.find(
        (p) => p.clientId === window.clientId,
      );
      if (player) {
        const upgrades = generateUpgrades(player);
        const elUpgrades = upgrades.map((upgrade) =>
          createUpgradeElement(upgrade, player),
        );
        if (elUpgradePickerContent) {
          elUpgradePickerContent.innerHTML = '';
          for (let elUpgrade of elUpgrades) {
            elUpgradePickerContent.appendChild(elUpgrade);
          }
        }
      } else {
        console.error('Upgrades cannot be generated, player not found');
      }
      break;
    case View.Game:
      resizePixi();
      addUnderworldEventListeners();
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

  // Queue asking for the gamestate
  // from the other players.
  // The reason sending game state is queued and not sent immediately
  // is that if there's a game in progress you don't want to send the
  // state in the middle of an action (which could cause desyncs for
  // code that depends on promises such as resolveDoneMoving)
  console.log("Setup: JOIN_GAME: Ask for latest gamestate from other players")
  window.pie.sendData({
    type: MESSAGE_TYPES.JOIN_GAME,
    unitId
  });
  // Now that user has selected a character, they can enter the game
  setView(View.Game);
}

// zoom camera
function zoom(e: WheelEvent) {
  let newScale = app.stage.scale.x + e.deltaY * -0.002;
  // Limit zoom out and in to sensible limits
  newScale = Math.min(Math.max(0.3, newScale), 3);

  window.zoomTarget = newScale;
}

const menuBtnId = 'menuBtn';
const endTurnBtnId = 'end-turn-btn';
const centerCamBtnId = 'center-cam-btn';
function addUnderworldEventListeners() {
  // Add keyboard shortcuts
  window.addEventListener('keydown', keydownListener);
  window.addEventListener('keyup', keyupListener);
  document.body.addEventListener('contextmenu', contextmenuHandler);
  document.body.addEventListener('click', clickHandler);
  document.body.addEventListener('wheel', zoom);
  document.body.addEventListener('mousemove', mouseMove);
  // Add button listeners
  const elEndTurnBtn: HTMLButtonElement = document.getElementById(
    endTurnBtnId,
  ) as HTMLButtonElement;
  elEndTurnBtn.addEventListener('click', endTurnBtnListener);
  const elCenterCamBtn: HTMLButtonElement = document.getElementById(
    centerCamBtnId,
  ) as HTMLButtonElement;
  elCenterCamBtn.addEventListener('click', () => {
    // Recenter the camera on yourself
    cameraAutoFollow(true);
  });
  const elMenuBtn: HTMLButtonElement = document.getElementById(
    menuBtnId,
  ) as HTMLButtonElement;
  elMenuBtn.addEventListener('click', toggleMenu);
}

function removeUnderworldEventListeners() {
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
  const elMenuBtn: HTMLButtonElement = document.getElementById(
    menuBtnId,
  ) as HTMLButtonElement;
  elMenuBtn.removeEventListener('click', toggleMenu);
}