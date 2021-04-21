import PieClient from 'pie-client';
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
import Game, { game_state, turn_phase } from './Game';

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
let pie: PieClient;
let game: Game;
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
        // Initialize Game Object
        // See makeGame function for where setup truly happens
        // This instantiation just spins up the instance of game
        game = new Game(Math.random().toString());
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

// const wsUri = 'ws://localhost:8000';
// const wsUri = 'ws://192.168.0.21:8000';
// Locally hosted, externally accessed
// const wsUri = 'ws://68.48.199.138:7337';
const wsUri = 'wss://websocket-pie-6ggew.ondigitalocean.app';
// const wsUri = 'wss://websocket-pie-e4elx.ondigitalocean.app/';
function connect_to_wsPie_server() {
  const room_info = {
    app: 'Golems',
    version: '0.1.0',
    maxClients: 8,
  };
  const storedClientId = sessionStorage.getItem('pie-clientId');
  window.pie = pie = new PieClient({
    env: import.meta.env.MODE,
    wsUri: wsUri + (storedClientId ? `?clientId=${storedClientId}` : ''),
    useStats: true,
  });
  pie.onConnectInfo = (o) => {
    console.log('onConnectInfo', o);
    // Make and join room
    if (o.connected) {
      pie
        .makeRoom(room_info)
        // Since the room_info is hard-coded,
        // if you can't make the room, it may be already made, so try to join it instead.
        .catch(() => pie.joinRoom(room_info))
        .then(() => console.log('You are now in the room'))
        .catch((err: string) => console.error('Failed to join room', err));
    }
  };
  pie.onLatency = (l: any) => {
    window.latencyPanel.update(l.average, l.max);
  };
}
