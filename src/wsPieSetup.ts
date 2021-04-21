import PieClient from 'pie-client';
import { onData, onClientPresenceChanged } from './wsPieHandler';
let maxClients = 8;
let pie: PieClient;
export function connect(_room_info = {}, wsUri: string) {
  const room_info = Object.assign(_room_info, {
    app: 'Golems',
    version: '0.1.0',
    maxClients,
  });
  console.log('Connecting to pie server with', room_info);
  maxClients = room_info.maxClients;
  const storedClientId = sessionStorage.getItem('pie-clientId');
  window.pie = pie = new PieClient({
    env: import.meta.env.MODE,
    wsUri: wsUri + (storedClientId ? `?clientId=${storedClientId}` : ''),
    useStats: true,
  });
  pie.onServerAssignedData = (o) => {
    console.log('serverAssignedData', o);
    window.clientId = o.clientId;
    sessionStorage.setItem('pie-clientId', o.clientId);
  };
  pie.onData = onData;
  pie.onError = ({ message }) => window.alert(message);
  pie.onClientPresenceChanged = onClientPresenceChanged;
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
  pie.onLatency = (l) => {
    if (latencyPanel) {
      latencyPanel.update(l.average, l.max);
    }
  };
}

import Stats from 'stats.js';
let latencyPanel: any;
setupDoobStats();
function setupDoobStats() {
  const stats = new Stats();
  // Add fps stats
  function monitorFPS() {
    stats.end();
    stats.begin();
    requestAnimationFrame(monitorFPS);
  }
  stats.begin();
  monitorFPS();

  stats.showPanel(3);
  latencyPanel = stats.addPanel(new Stats.Panel('latency', '#ff8', '#221'));
  stats.dom.classList.add('doob-stats');
  document.body.appendChild(stats.dom);
}
