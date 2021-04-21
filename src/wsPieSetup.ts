import type PieClient from 'pie-client';
import { onData, onClientPresenceChanged, makeGame } from './wsPieHandler';
import * as UI from './ui/UserInterface';
let maxClients = 8;
function defaultRoomInfo(_room_info = {}) {
  const room_info = Object.assign(_room_info, {
    app: 'Golems',
    version: '0.1.0',
    maxClients,
  });
  maxClients = room_info.maxClients;
  return room_info;
}
function prepareForGame(pie: PieClient) {
  makeGame([]);
  UI.setup();
  addHandlers(pie);
}
export function hostRoom(pie?: PieClient, _room_info = {}): Promise<unknown> {
  if (!pie) {
    return Promise.reject();
  }
  const room_info = defaultRoomInfo(_room_info);
  prepareForGame(pie);
  return pie.makeRoom(room_info);
}
export function joinRoom(pie?: PieClient, _room_info = {}): Promise<unknown> {
  if (!pie) {
    return Promise.reject();
  }
  const room_info = defaultRoomInfo(_room_info);
  prepareForGame(pie);
  return pie.joinRoom(room_info);
}
function addHandlers(pie: PieClient) {
  pie.onServerAssignedData = (o) => {
    console.log('serverAssignedData', o);
    window.clientId = o.clientId;
    sessionStorage.setItem('pie-clientId', o.clientId);
  };
  pie.onData = onData;
  pie.onError = ({ message }: { message: any }) => window.alert(message);
  pie.onClientPresenceChanged = onClientPresenceChanged;
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
