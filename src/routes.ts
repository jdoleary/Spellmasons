import { setupPixi } from './PixiUtils';
import {
  clickHandler,
  contextmenuHandler,
  endTurnBtnListener,
  keydownListener,
  keyupListener,
  mousemoveHandler,
} from './ui/eventListeners';
import * as Cards from './cards';
import * as Units from './units';
import { initializeGameObject } from './wsPieHandler';
import { connect_to_wsPie_server, hostRoom, joinRoom } from './wsPieSetup';

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
let route: Route = Route.Menu;
export function setRoute(r: Route) {
  route = r;
  switch (r) {
    case Route.Menu:
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
          .catch(joinRoom)
          .then(() => console.log('You are now in the room'))
          .then(() => {
            setRoute(Route.Underworld);
          })
          .catch((err: string) => console.error('Failed to join room', err));
      });
      break;
    case Route.CharacterSelect:
      // Host or join a game brings client to Character select
      break;
    case Route.Overworld:
      // Picking a level brings players to Underworld from Overworld
      break;
    case Route.Underworld:
      addUnderworldEventListeners();
      // Beating a level takes players from Underworld to Upgrade
      break;
    case Route.Upgrade:
      removeUnderworldEventListeners();
      break;
  }
}
const elEndTurnBtn: HTMLButtonElement = document.getElementById(
  'endTurn',
) as HTMLButtonElement;
elEndTurnBtn.addEventListener('click', endTurnBtnListener);

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
