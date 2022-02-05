import PieClient, { Room } from 'pie-client';
import { onData, onClientPresenceChanged } from './wsPieHandler';
// Locally hosted, locally accessed
const wsUri = 'ws://localhost:8080';
// Locally hosted, available to LAN (use your own IP)
//const wsUri = 'ws://192.168.0.19:8080';
// Locally hosted, externally accessed (use your own IP)
// const wsUri = 'ws://68.48.199.138:7337';
// Current digital ocean wsPie app:
// const wsUri = 'wss://websocket-pie-6ggew.ondigitalocean.app';
let pie: PieClient | undefined;
export function connect_to_wsPie_server(): Promise<void> {
  return new Promise((resolve, reject) => {
    const storedClientId = sessionStorage.getItem('pie-clientId');
    window.pie = pie = new PieClient({
      env: import.meta.env.MODE,
      wsUri: wsUri + (storedClientId ? `?clientId=${storedClientId}` : ''),
      useStats: true,
    });
    addHandlers(pie);
    pie.onConnectInfo = (o) => {
      console.log('onConnectInfo', o);
      if (o.connected) {
        resolve();
      } else {
        reject();
      }
    };
  });
}
let maxClients = 8;
function defaultRoomInfo(_room_info = {}): Room {
  const room_info = Object.assign(_room_info, {
    name: 'Golems Lobby 1',
    app: 'Golems',
    version: '0.1.0',
    maxClients,
  });
  maxClients = room_info.maxClients;
  return room_info;
}

export function joinRoom(_room_info = {}): Promise<unknown> {
  if (!pie) {
    return Promise.reject();
  }
  const room_info = defaultRoomInfo(_room_info);
  return pie.joinRoom(room_info, true);
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
