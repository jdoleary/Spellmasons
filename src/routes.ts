import {
  addPixiContainersForRoute,
  containerCharacterSelect,
  setupPixi,
} from './PixiUtils';
import {
  clickHandler,
  clickHandlerOverworld,
  contextmenuHandler,
  endTurnBtnListener,
  keydownListener,
  keyupListener,
  mousemoveHandler,
} from './ui/eventListeners';
import * as Cards from './cards';
import * as Units from './units';
import * as Overworld from './overworld';
import { initializeGameObject } from './wsPieHandler';
import { connect_to_wsPie_server, hostRoom, joinRoom } from './wsPieSetup';
import { setupMonitoring } from './monitoring';
import { app } from './PixiUtils';
import * as Image from './Image';
import { BOARD_HEIGHT, BOARD_WIDTH, CELL_SIZE } from './config';
import { UnitSubType } from './commonTypes';
import { MESSAGE_TYPES } from './MessageTypes';
import { turn_phase } from './Game';
import { createUpgradeElement, generateUpgrades } from './Upgrade';

export enum Route {
  Menu,
  CharacterSelect,
  // Overworld is where players, as a team, decide which level to tackle next
  Overworld,
  // Underworld contains the grid with levels and casting
  Underworld,
  // Post combat
  Upgrade,
}
window.route = Route.Menu;
// temp for testing
window.setRoute = setRoute;

export function setRoute(r: Route) {
  console.log('Set game route', Route[r]);
  for (let route of Object.keys(Route)) {
    document.body.classList.remove(`route-${route}`);
  }
  document.body.classList.add(`route-${Route[r]}`);
  window.route = r;
  addPixiContainersForRoute(r);

  // Remove previous event listeners:
  removeOverworldEventListeners();
  removeUnderworldEventListeners();
  switch (r) {
    case Route.Menu:
      // Start monitoring with development overlay
      setupMonitoring();
      // Initialize content
      Cards.registerCards();
      Units.registerUnits();

      // Initialize Assets
      let setupPixiPromise = setupPixi();
      // Initialize Network
      let connectToPieServerPromise = connect_to_wsPie_server();
      Promise.all([setupPixiPromise, connectToPieServerPromise]).then(() => {
        // Now that we are both connected to the pieServer and assets are loaded,
        // we can host or join a game

        // Initialize Game Object
        // See makeGame function for where setup truly happens
        // This instantiation just spins up the instance of game
        initializeGameObject();
        // ---
        // TEMP temporarily default to just entering a generic game for speed of development
        hostRoom({})
          .catch(() => joinRoom({}))
          .then(() => console.log('You are now in the room'))
          .then(() => {
            setRoute(Route.CharacterSelect);
          })
          .catch((err: string) => console.error('Failed to join room', err));
      });
      break;
    case Route.CharacterSelect:
      // Host or join a game brings client to Character select
      Object.values(Units.allUnits)
        .filter(
          (unitSource) =>
            unitSource.info.subtype === UnitSubType.PLAYER_CONTROLLED,
        )
        .forEach((unitSource, index) => {
          const image = Image.create(
            index,
            0,
            unitSource.info.image,
            containerCharacterSelect,
          );
          image.sprite.interactive = true;
          image.sprite.on('click', () => {
            // Timeout prevents click from propagating into overworld listener
            // for some reason e.stopPropagation doesn't work :/
            setTimeout(() => {
              // Cleanup container
              containerCharacterSelect.removeChildren();
              window.pie.sendData({
                type: MESSAGE_TYPES.SELECT_CHARACTER,
                unitId: unitSource.id,
              });
            }, 0);
          });
        });
      break;
    case Route.Overworld:
      // Picking a level brings players to Underworld from Overworld
      const overworld = Overworld.generate();
      window.overworld = overworld;
      Overworld.draw(overworld);
      // Align camera:
      app.stage.x = app.stage.width / 2 - overworld.levels[0].location.x;
      app.stage.y = app.stage.height - overworld.levels[0].location.y;
      addOverworldEventListeners();

      break;
    case Route.Underworld:
      // Set the first turn phase
      window.game.setTurnPhase(turn_phase.PlayerTurns);
      // Align Camera: center the app in the middle of the board
      app.stage.x = app.renderer.width / 2 - (CELL_SIZE * BOARD_WIDTH) / 2;
      app.stage.y = app.renderer.height / 2 - (CELL_SIZE * BOARD_HEIGHT) / 2;
      addUnderworldEventListeners();
      // Beating a level takes players from Underworld to Upgrade
      break;
    case Route.Upgrade:
      const elUpgradePicker = document.getElementById('upgrade-picker');
      const elUpgradePickerContent = document.getElementById(
        'upgrade-picker-content',
      );
      elUpgradePicker && elUpgradePicker.classList.remove('active');
      elUpgradePicker && elUpgradePicker.classList.add('active');
      const player = window.game.players.find(
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
  }
}
const elEndTurnBtn: HTMLButtonElement = document.getElementById(
  'endTurn',
) as HTMLButtonElement;
elEndTurnBtn.addEventListener('click', endTurnBtnListener);

function addOverworldEventListeners() {
  // Add keyboard shortcuts
  document.body.addEventListener('click', clickHandlerOverworld);
}
function removeOverworldEventListeners() {
  document.body.removeEventListener('click', clickHandlerOverworld);
}
function addUnderworldEventListeners() {
  // Add keyboard shortcuts
  window.addEventListener('keydown', keydownListener);
  window.addEventListener('keyup', keyupListener);
  document.body.addEventListener('contextmenu', contextmenuHandler);
  document.body.addEventListener('click', clickHandler);
  document.body.addEventListener('mousemove', mousemoveHandler);
}

function removeUnderworldEventListeners() {
  // Remove keyboard shortcuts
  window.removeEventListener('keydown', keydownListener);
  window.removeEventListener('keyup', keyupListener);
  // Remove mouse and click listeners
  document.body.removeEventListener('contextmenu', contextmenuHandler);
  document.body.removeEventListener('click', clickHandler);
  document.body.removeEventListener('mousemove', mousemoveHandler);
}
