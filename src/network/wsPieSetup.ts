// Note: headless server MUST NOT import this file because @websocketpie/client is a browser only package
// If you get something like the following error:
// C:\git\Golems\node_modules\@websocketpie\client\dist\src\PieClient.js:10
// import { MessageType } from './enums';
// ^^^^^^

// SyntaxError: Cannot use import statement outside a module
// Trace the imports for headless server and you will find that somewhere this file
// is imported.

import PieClient, { Room } from '@websocketpie/client';
import { onData } from './networkHandler';
import { getVersionInequality, onClientPresenceChanged, typeGuardHostApp } from './networkUtil';
import { setView } from '../views';
import { View } from '../View';
import * as storage from '../storage';
import Underworld from '../Underworld';
import { version } from '../../package.json';
import makeOverworld, { Overworld } from '../Overworld';
import { MESSAGE_TYPES } from '../types/MessageTypes';
import { GameMode } from '../types/commonTypes';
import { elEndTurnBtn } from '../HTMLElements';
import { sendEventToServerHub } from '../RemoteLogging';
import PiePeer, { piePeerSingleton } from './PiePeer';
// Locally hosted, locally accessed
// const wsUri = 'ws://localhost:8080';
// Locally hosted, available to LAN (use your own IP)
//const wsUri = 'ws://192.168.0.19:8080';
// Locally hosted, externally accessed (use your own IP)
// const wsUri = 'ws://68.48.199.138:7337';
// Current digital ocean wsPie app:
// const wsUri = 'wss://orca-app-99xgk.ondigitalocean.app/';
function connect_to_wsPie_server(wsUri: string | undefined, overworld: Overworld): Promise<void> {
  const pie = overworld.pie;
  if (typeGuardHostApp(pie)) {
    console.error('This file should only ever be used with the client, never with the Headless Server');
    return Promise.reject();
  }
  addHandlers(pie, overworld);
  return new Promise<void>((resolve, reject) => {
    const storedClientId = storage.get(storage.STORAGE_PIE_CLIENTID_KEY);
    pie.onConnectInfo = (o) => {
      console.log('onConnectInfo', o);
      if (o.connected) {
        globalThis.remoteLog?.(`User connected: ${wsUri}`);
        // Reset intentionalDisconnect because now that we are connected, if it disconnects without intentionalDisconnect being set to true,
        // it should show the View.Disconnect view.
        intentionalDisconnect = false;
        console.log("Pie: Successfully connected to PieServer.")
        // If connection is restored after unexpected disconnection
        if (view == View.Disconnected) {
          // Always return to the menu on a disconnect so that the player can choose to reload the auto save
          // if the disconnect was due to the server
          setView(View.Menu);
        }
        resolve();
      } else {
        // On disconnect, set menu `isInRoom` state to false.  It will be set back to true if join succeeds
        globalThis.setMenuIsInRoom?.(false);
        const elVersionInfoHeadless = document.getElementById('version-info-headless-server')
        if (elVersionInfoHeadless) {
          elVersionInfoHeadless.innerHTML = '';
        }
        // !intentionalDisconnect ensures it will only go to the View.Disconnected if it was unexpectedly disconnected
        if (view == View.Game || (!intentionalDisconnect && globalThis.getMenuRoute && globalThis.getMenuRoute() == 'MULTIPLAYER_SERVER_CHOOSER')) {
          setView(View.Disconnected);
        }
        // `if(globalThis.player.lobbyReady)` ensures it only saves a backup once.  Since this backup save logic is
        // invoked on every disconnect (including failed reconnects), we only want it to save once for each disconnect
        // from a live game, and if the player isn't ready either they haven't readied up in the first place or the
        // backup has already been made because below we set lobbyReady to false after a disconnect.
        if (globalThis.save && globalThis.player?.lobbyReady) {
          console.error('Client disconnected unintentionally');
          if (remoteLog) {
            remoteLog(`Disconnect (wsPie): Lost Connection`);
          }
          const backupSaveName = `backup ${(overworld.pie as PieClient).currentRoomInfo?.name || ''}`;
          // Backups are unique to the current date and the save name
          // so multiple backups in the same day and same game name will overwrite each other
          const todayDate = new Date().setHours(0, 0, 0, 0);
          globalThis.save(`${todayDate}-${backupSaveName}`, true).then(errMsg => {
            if (!errMsg) {
              Jprompt({ text: `Disconnected\n\nLost connection to Dedicated Server\n` + i18n(['auto save notice', backupSaveName]), yesText: 'Okay', forceShow: true });
            }
          });
        }
        // pie IS PieClient because wsPieSetup is only called in the context of the client
        // Change menu state so that when player reconnects they will be in the lobby
        // so they can choose to reload the backup save
        if (globalThis.player) {
          globalThis.setMenu?.('MULTIPLAYER_SERVER_CHOOSER');
          globalThis.player.lobbyReady = false;
        }
        if (overworld.underworld) {
          // Allow forcing receiving a new init_game_state since after disconnect
          // a user will be out of sync with the server
          // --
          // it is important that this code occurs OUTSIDE of the above `view == View.Game`
          // check or else players on the lobby screen that disconnect and that already
          // have an underworld won't receive the new underworld after reconnecting
          overworld.underworld.allowForceInitGameState = true;
        }
      }
    };
    if (wsUri) {
      console.log(`Pie: Connecting to ${wsUri} with clientId ${storedClientId}`)
      pie.connect(wsUri + (storedClientId ? `?clientId=${storedClientId}` : ''), true).catch(() => {
        console.error('Unable to connect to server.  Please check the wsURI. The protocol should be wss:// or ws://');
        reject('Unable to connect to server at ' + wsUri);
      }).then(() => {
        console.log(`Pie: Connection to server ${wsUri} succeeded`);
        if (globalThis.remoteLog)
          globalThis.remoteLog(`Connection to server ${wsUri} succeeded`);
        resolve();
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
    name: 'Default Lobby',
    app: 'Spellmasons',
    version: globalThis.SPELLMASONS_PACKAGE_VERSION,
    maxClients,
  }, _room_info);
  maxClients = room_info.maxClients;
  return room_info;
}

export function joinRoom(overworld: Overworld, _room_info = {}, makeRoomIfNonexistant = false): Promise<void> {
  if (!overworld.pie) {
    console.error('Could not join room, pie instance is undefined');
    return Promise.reject();
  }
  const pie = overworld.pie;
  if (typeGuardHostApp(pie)) {
    console.error('wsPieSetup is for client only, not host app. This function should never be called with a pie of IHostApp');
    return Promise.reject();
  }
  const room_info = defaultRoomInfo(_room_info);
  // Lowercase room name so capitalization won't cause confusion
  // when people are trying to join each other's games
  room_info.name = room_info.name.toLowerCase();
  // Create a new underworld to sync with the payload so that no old state carries over
  const underworld = new Underworld(overworld, overworld.pie, Math.random().toString());
  if (makeRoomIfNonexistant && pie instanceof PiePeer) {
    console.log('Setup: PiePeer host creating level');
    // Generate the level data
    underworld.lastLevelCreated = underworld.generateLevelDataSyncronous(0);
    // Actually create the level 
    underworld.createLevelSyncronous(underworld.lastLevelCreated);

  }
  if (isSinglePlayer()) {
    // set mods:
    underworld.activeMods = globalThis.activeMods || [];
    sendEventToServerHub({
      events: [{
        time: Date.now(),
        message: 'activeMods: ' + underworld.activeMods.join(',')
      }]
    }, underworld);
    console.log('Mods: set active mods', underworld.activeMods);
  }
  return pie.joinRoom(room_info, makeRoomIfNonexistant).then(() => {
    console.log('Pie: You are now in the room', JSON.stringify(room_info, null, 2));
  }).catch((err: string) => {
    console.error('wsPieSetup: Failed to join room:', err);
    return Promise.reject(err);
  });
}

function addHandlers(pie: PieClient | PiePeer, overworld: Overworld) {
  pie.onServerAssignedData = (o) => {
    console.log('Pie: set globalThis.clientId:', o.clientId, o);
    // The headless server's version
    const elVersionInfoHeadless = document.getElementById('version-info-headless-server')
    if (elVersionInfoHeadless) {
      if (o?.hostAppVersion) {
        elVersionInfoHeadless.innerText = `Server v${o.hostAppVersion}`;
        // Log error if client and server versions are minor or major out of sync:
        const versionInequality = getVersionInequality(globalThis.SPELLMASONS_PACKAGE_VERSION, o.hostAppVersion);
        if (versionInequality !== 'equal' && versionInequality !== 'malformed') {
          const explainUpdateText = versionInequality == 'client behind' ? 'Please reboot Steam to get the latest Version of Spellmasons' : 'This server is scheduled to update soon to the latest version.';
          Jprompt({
            text: `Server and Game versions are out of sync.
<pre>
Server: ${o.hostAppVersion}
Client: ${globalThis.SPELLMASONS_PACKAGE_VERSION}
</pre>
${explainUpdateText}
`, yesText: "Disconnect", forceShow: true
          }).then(() => {
            intentionalDisconnect = true;
            pie.disconnect('Cannot join, server and game versions are out of sync.');
            globalThis.syncConnectedWithPieState(false);
          });
        }
      } else {
        elVersionInfoHeadless.innerText = '';
      }
    }
    if (exists(o.hostAppVersion) && o.hostAppVersion !== version) {
      console.warn('Host app version does not match client version');
    }
    // If hostAppVersion is undefined, assume the client has connected to a stateless pie server (relay) with no host app
    globalThis.statelessRelayPieServer = isNullOrUndef(o.hostAppVersion);
    if (globalThis.statelessRelayPieServer) {
      console.log('Pie: Connected to stateless relay pie server');
      if (globalThis.remoteLog)
        globalThis.remoteLog(`using Stateless Relay Pie server`);
    } else {
      if (globalThis.remoteLog)
        globalThis.remoteLog(`using Stateful HostApp Pie server`);
    }

    console.log('Setting clientId', o.clientId);
    globalThis.clientId = o.clientId;
  };
  pie.onData = d => onData(d, overworld);
  pie.onError = ({ message }: { message: any }) => {
    console.warn('wsPie Error:', message);
  }
  pie.onClientPresenceChanged = c => onClientPresenceChanged(c, overworld);
  pie.onLatency = (l) => {
    if (globalThis.latencyPanel) {
      globalThis.latencyPanel.update(l.average, l.max);
    }
  };
}

let useP2P = true;
globalThis.setPieToP2PMode = (active: boolean) => {
  if (useP2P == active) {
    console.debug(`setPieToP2PMode, do nothing already set to ${active}`);
    return;
  }
  useP2P = active;
  console.log('Setup: Switch network backend to', active ? 'P2P' : 'wsPie');
  setupPieAndUnderworld();
}
function preventIdleTimeout() {
  if (globalThis.pie && globalThis.pie.isConnected() && globalThis.pie.currentRoomInfo && pie instanceof PieClient) {
    // Keep connection alive.  Bun's websocket server has a 2 minute timeout
    // https://github.com/jdoleary/Spellmasons/issues/22
    console.debug('Send empty message to keep connection from idle timeouting');
    globalThis.pie.sendData({
      type: MESSAGE_TYPES.PREVENT_IDLE_TIMEOUT,
    });
  }
}
setInterval(preventIdleTimeout, 60_000);

export function setupPieAndUnderworld() {
  if (globalThis.headless) {
    console.error('wsPieSetup is only for browser clients and should not be invoked from headless server.')
    return;
  } else {
    console.log(`Client: Initialize ${useP2P ? 'PiePeer' : 'PieClient'}`);
    // TODO: This is where it decides if we do p2p or websocketPie
    const pie = useP2P ? piePeerSingleton : new PieClient();
    document.body.classList.toggle('pieIsInstanceOfPiePeer', useP2P);
    // Every time PieClient is instantiated it will create a clientId, overwrite this
    // with the stored clientId if there is one
    const previouslyStoredClientId = storage.get(storage.STORAGE_PIE_CLIENTID_KEY);
    if (previouslyStoredClientId) {
      pie.clientId = previouslyStoredClientId;
      console.log('Setting previously stored clientId', pie.clientId);
    } else if (pie.clientId) {
      storage.set(storage.STORAGE_PIE_CLIENTID_KEY, pie.clientId);
    }
    globalThis.pie = pie;
    // useStats must be true for latency information to come through
    pie.useStats = true;
    console.log('Client: Initialize Underworld');
    const overworld = makeOverworld(pie);
    // @ts-ignore: test_make_lobby_on_setup_pie
    if (useP2P && isNullOrUndef(overworld.underworld) && globalThis.test_make_lobby_on_setup_pie) {
      // Since p2p uses "lobbies" instead of rooms, initialize underworld immediately if it doesn't already exist
      new Underworld(overworld, overworld.pie, Math.random().toString());
    }
    addHandlers(pie, overworld);
    globalThis.connect_to_wsPie_server = wsUri => connect_to_wsPie_server(wsUri, overworld);
    globalThis.isConnected = pie.isConnected.bind(pie);
    // Caution! pieDisconnect just kills the pie connection but does not change menu state, you may be looking for globalThis.pieLeaveRoom
    globalThis.pieDisconnect = async (disconnectReason: string): Promise<void> => pie instanceof PiePeer ? pie.disconnect(disconnectReason) : pie.disconnect();
    globalThis.setDifficulty = (gameMode: 'normal' | 'hard' | 'impossible') => pie.sendData({ type: MESSAGE_TYPES.SET_GAME_MODE, gameMode });
    globalThis.saveActiveMods = (activeMods: string[]) => {
      // Ensure activeMods is never undefined
      if (!activeMods) {
        activeMods = [];
      }
      // Persist to storage
      if (globalThis.setOption) {
        globalThis.setOption(
          "activeMods",
          globalThis.activeMods
        );
      }
      console.log('Pie: setting active mods');
      pie.sendData({ type: MESSAGE_TYPES.SET_MODS, activeMods });
    }
    globalThis.pieLeaveRoom = () => {
      globalThis.exitCurrentGame?.();
      pie.leaveRoom();
    }
    globalThis.pieInhabitPlayer = (asPlayerClientId: string) => {
      pie.sendData({
        type: MESSAGE_TYPES.JOIN_GAME_AS_PLAYER,
        asPlayerClientId
      });
    }

    globalThis.joinRoom = (room_info, isHosting) => joinRoom(overworld, room_info, isHosting);
    function connectToSingleplayer() {
      // PiePeer can't handle singleplayer
      globalThis.setPieToP2PMode(false);
      document.body?.classList.toggle('loading', true);
      // If we just left multiplayer, make sure we change end turn button back to normal
      if (elEndTurnBtn) {
        const elEndTurnSpan = elEndTurnBtn.querySelector('[data-localize-text]') as HTMLElement;
        if (elEndTurnSpan.dataset.localizeText != "End Turn") {
          elEndTurnSpan.dataset.localizeText = "End Turn"
          elEndTurnSpan.innerText = i18n(elEndTurnSpan.dataset.localizeText);
        }
      }
      return new Promise<void>((resolve) => {
        // setTimeout allows the UI to refresh before locking up the CPU with
        // heavy level generation code
        setTimeout(() => {
          connect_to_wsPie_server(undefined, overworld).then(() => {
            joinRoom(overworld).then(resolve);
          })
        }, 10)
      });

    }
    globalThis.connectToSingleplayer = connectToSingleplayer;
    globalThis.startSingleplayer = function startSingleplayer(numberOfHotseatPlayers: number, gameMode?: GameMode) {
      console.log('Start Game: Attempt to start the game');
      globalThis.numberOfHotseatPlayers = numberOfHotseatPlayers;
      return connectToSingleplayer().then(() => {
        // Create first level
        if (overworld.underworld) {
          overworld.underworld.lastLevelCreated = overworld.underworld.generateLevelDataSyncronous(0, gameMode);
        } else {
          console.error('Overworld does not have underworld, cannot setup first level');
        }
        // Go directly into the game
        setView(View.Game);
      });
    }
  }
}
export function isSinglePlayer(): boolean {
  return !!globalThis.pie?.soloMode;
}