import PieClient, { Room } from 'pie-client';
import { onData, onClientPresenceChanged } from './wsPieHandler';
import * as readyState from './readyState';
import { setView, View } from './views';
// Locally hosted, locally accessed
const wsUri = 'ws://localhost:8080';
// Locally hosted, available to LAN (use your own IP)
//const wsUri = 'ws://192.168.0.19:8080';
// Locally hosted, externally accessed (use your own IP)
// const wsUri = 'ws://68.48.199.138:7337';
// Current digital ocean wsPie app:
// const wsUri = 'wss://websocket-pie-6ggew.ondigitalocean.app';
export const pie: PieClient = window.pie = new PieClient({
  env: import.meta.env.MODE,
});
addHandlers(pie);
window.connect_to_wsPie_server = function connect_to_wsPie_server(wsUri?: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const storedClientId = sessionStorage.getItem('pie-clientId');
    pie.onConnectInfo = (o) => {
      console.log('onConnectInfo', o);
      if (o.connected) {
        readyState.set('wsPieConnection', true);
        console.log("Pie: Successfully connected to PieServer.")
        resolve();
      }
    };
    if (wsUri) {
      pie.connect('ws://' + wsUri + (storedClientId ? `?clientId=${storedClientId}` : ''), true).catch(() => {
        console.error('Unable to connect to server.  Please check the wsURI.');
        // TODO: remove alert for prod
        alert('Unable to connect to server.  Please check the wsURI.');
        reject();

      });
    } else {
      pie.connectSolo().then(() => {
        resolve();
      });
    }
  });

}

let maxClients = 8;
function defaultRoomInfo(_room_info = {}): Room {
  const room_info = Object.assign({
    name: 'Golems Lobby 1',
    app: 'Golems',
    version: import.meta.env.SNOWPACK_PUBLIC_PACKAGE_VERSION,
    maxClients,
  }, _room_info);
  maxClients = room_info.maxClients;
  return room_info;
}

window.joinRoom = function joinRoom(_room_info = {}): Promise<unknown> {
  if (!pie) {
    return Promise.reject();
  }
  const room_info = defaultRoomInfo(_room_info);
  return pie.joinRoom(room_info, true).then(() => {
    readyState.set('wsPieRoomJoined', true);
    console.log('Pie: You are now in the room');
    // Useful for development to get into the game quickly
    let quickloadName = localStorage.getItem('quickload')
    if (quickloadName) {
      console.log('ADMIN: quickload:', quickloadName);
      window.load(quickloadName);
    } else {
      // All clients should join at the CharacterSelect screen so they can
      // choose their character.  Once they choose their character their
      // Player entity is created and then the messageQueue can begin processing
      // including LOAD_GAME_STATE.
      // --
      // Note: This must occur AFTER PIXI assets are done being loaded
      // or else the characters to select wont display
      setView(View.CharacterSelect);
    }
  }).catch((err: string) => console.error('Failed to join room', err));

}
function addHandlers(pie: PieClient) {
  pie.onServerAssignedData = (o) => {
    // console.log('serverAssignedData', o);
    window.clientId = o.clientId;
    sessionStorage.setItem('pie-clientId', o.clientId);
  };
  pie.onData = onData;
  // TODO: remove alert for production
  pie.onError = ({ message }: { message: any }) => window.alert(message);
  pie.onClientPresenceChanged = onClientPresenceChanged;
  pie.onLatency = (l) => {
    if (window.latencyPanel) {
      window.latencyPanel.update(l.average, l.max);
    }
  };
}
