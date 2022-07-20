import PieClient, { Room } from '@websocketpie/client';
import { onData } from './networkHandler';
import { onClientPresenceChanged } from './networkUtil';
import * as readyState from '../readyState';
import { setView, View } from '../views';
import * as storage from '../storage';
import { updateGlobalRefToCurrentClientPlayer } from '../entity/Player';
// Locally hosted, locally accessed
// const wsUri = 'ws://localhost:8080';
// Locally hosted, available to LAN (use your own IP)
//const wsUri = 'ws://192.168.0.19:8080';
// Locally hosted, externally accessed (use your own IP)
// const wsUri = 'ws://68.48.199.138:7337';
// Current digital ocean wsPie app:
// const wsUri = 'wss://websocket-pie-6ggew.ondigitalocean.app';
export const pie: PieClient = globalThis.pie = new PieClient();
addHandlers(pie);
function connect_to_wsPie_server(wsUri?: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const storedClientId = sessionStorage.getItem('pie-clientId');
    pie.onConnectInfo = (o) => {
      console.log('onConnectInfo', o);
      if (o.connected) {
        readyState.set('wsPieConnection', true);
        console.log("Pie: Successfully connected to PieServer.")
        resolve();
      } else {
        if (globalThis.underworld) {
          globalThis.underworld.cleanup();
          readyState.set('underworld', false);
          setView(View.Disconnected);
        }
      }
    };
    if (wsUri) {
      console.log(`Pie: Connecting to ${wsUri} with clientId ${storedClientId}`)
      pie.connect(wsUri + (storedClientId ? `?clientId=${storedClientId}` : ''), true).catch(() => {
        console.error('Unable to connect to server.  Please check the wsURI. The protocol should be wss:// or ws://');
        // TODO: remove alert for prod
        alert('Unable to connect to server.  Please check the wsURI.');
        reject();

      }).then(() => {
        console.log(`Pie: Connection to server ${wsUri} succeeded`)
      });
    } else {
      pie.connectSolo().then(() => {
        resolve();
      });
    }
  });
}
globalThis.connect_to_wsPie_server = connect_to_wsPie_server;

let maxClients = 8;
function defaultRoomInfo(_room_info = {}): Room {
  const room_info = Object.assign({
    name: 'Golems Lobby 1',
    app: 'Golems',
    version: globalThis.SPELLMASONS_PACKAGE_VERSION,
    maxClients,
  }, _room_info);
  maxClients = room_info.maxClients;
  return room_info;
}

export function joinRoom(_room_info = {}): Promise<void> {
  if (!pie) {
    console.error('Could not join room, pie instance is undefined');
    return Promise.reject();
  }
  const room_info = defaultRoomInfo(_room_info);
  // Lowercase room name so capitalization won't cause confusion
  // when people are trying to join each other's games
  room_info.name = room_info.name.toLowerCase();
  return pie.joinRoom(room_info, true).then(() => {
    readyState.set('wsPieRoomJoined', true);
    console.log('Pie: You are now in the room', JSON.stringify(room_info, null, 2));
    // Useful for development to get into the game quickly
    let quickloadName = storage.get('quickload');
    if (quickloadName) {
      console.log('ADMIN: quickload:', quickloadName);
      globalThis.load(quickloadName);
    } else {
      // All clients should join at the CharacterSelect screen so they can
      // choose their character.  Once they choose their character their
      // Player entity is created and then the messageQueue can begin processing
      // including LOAD_GAME_STATE.
      // --
      // Note: This must occur AFTER PIXI assets are done being loaded
      // or else the characters to select wont display
      // setView(View.CharacterSelect);
      // FUTURE: THis might be a good place to view the lobby
    }
  }).catch((err: string) => {
    console.error(err);
  });
}
globalThis.joinRoom = joinRoom;

function addHandlers(pie: PieClient) {
  pie.onServerAssignedData = (o) => {
    console.log('Pie: set globalThis.clientId:', o.clientId);
    globalThis.clientId = o.clientId;
    if (globalThis.underworld) {
      const selfPlayer = globalThis.underworld.players.find(p => p.clientId == globalThis.clientId);
      if (selfPlayer) {
        updateGlobalRefToCurrentClientPlayer(selfPlayer);
      }
    }
    if (globalThis.allowCookies) {
      // Only store clientId if it is from a multiplayer session
      // 'solomode_client_id' comes from pieclient's solo mode
      if (o.clientId !== 'solomode_client_id') {
        sessionStorage.setItem('pie-clientId', o.clientId);
      }
    }
  };
  pie.onData = onData;
  pie.onError = ({ message }: { message: any }) => console.error('wsPie Error:', message);
  pie.onClientPresenceChanged = onClientPresenceChanged;
  pie.onLatency = (l) => {
    if (globalThis.latencyPanel) {
      globalThis.latencyPanel.update(l.average, l.max);
    }
  };
}

globalThis.startSingleplayer = function startSingleplayer() {
  return connect_to_wsPie_server().then(() => {
    return joinRoom();
  });
}