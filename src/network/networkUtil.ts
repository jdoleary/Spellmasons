import type { LevelData } from '../Underworld';
import { MESSAGE_TYPES } from '../types/MessageTypes';
import * as Player from '../entity/Player';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import Underworld from '../Underworld';
import type PieClient from '@websocketpie/client';
import { ensureAllClientsHaveAssociatedPlayers, Overworld } from '../Overworld';
import { sendEventToServerHub } from '../RemoteLogging';
import type { Room } from '@websocketpie/client';
import PiePeer from './PiePeer';
import { Pie } from '../types/commonTypes';

// Copied from PieClient.d.ts so as to not have to import PieClient
export interface ClientPresenceChangedArgs {
  type: string;
  clients: string[];
  names?: string[];
  time: number;
  // For peer connections only
  peerLobbyId?: string;

}
export function onClientPresenceChanged(o: ClientPresenceChangedArgs, overworld: Overworld) {
  console.log('clientPresenceChanged', o);
  // clientPresenceChanged message is only ever received if the current client is in a room
  // The client will also receive one when they first join a room.
  globalThis.setMenuIsInRoom?.(true);
  if (o.peerLobbyId) {
    // If not in a lobby
    if (!peerLobbyId) {
      // Set that client is in a lobby
      globalThis.peerLobbyId = o.peerLobbyId;
      if (!isHost(overworld.pie)) {
        // Now that we have a peer lobby Id, no need to stay in the steam lobby
        // but the host remains to accept new connections
        globalThis.electronSettings?.leaveLobby();
      }
    } else if (o.peerLobbyId !== globalThis.peerLobbyId) {
      // TODO This may cause an issue because the host will still think they are connected, they will have to send a leave lobby message to the host
      console.warn(`Already in ${peerLobbyId}, attempted to join ${o.peerLobbyId}`)
      Jprompt({ text: 'Cannot join a new lobby until you have left your existing lobby.', yesText: 'Okay', forceShow: true })
      return;
    }
  }
  // Clients update peers list when client presence changes
  // Host manages peers list separately when handshake occurs and should not update own
  // list here or else may clobber during race condition
  if (o.peerLobbyId == peerLobbyId && !globalThis.isHost(overworld.pie)) {
    for (let steamId64String of o.clients) {
      console.debug('Adding peer', steamId64String, '; own id:', clientId);
      globalThis.peers.add(steamId64String);
    }
  }

  // Ensure each client corresponds with a Player instance
  ensureAllClientsHaveAssociatedPlayers(overworld, o.clients, o.names || []);
  // If first client to join a stateless pie server, create the underworld and flag self as host
  if (globalThis.statelessRelayPieServer && overworld.underworld?.pie) {
    const isFirstClient = o.clients.findIndex(c => c == globalThis.clientId) == 0;
    globalThis.isHostForStatelessPie = isFirstClient;
    const { underworld } = overworld;
    if (isFirstClient && isNullOrUndef(underworld.lastLevelCreated)) {
      console.log('Setup: Host creating level');
      // Generate the level data
      underworld.lastLevelCreated = underworld.generateLevelDataSyncronous(0);
      // Actually create the level 
      underworld.createLevelSyncronous(underworld.lastLevelCreated);
    }
  } else {
    globalThis.isHostForStatelessPie = false;
  }
  if (overworld.underworld) {
    overworld.underworld.progressGameState();
  }
  if (o.clients.length == 0 && overworld.underworld) {
    // Send an end time for the game when all clients disconnect
    sendEventToServerHub({
      endTime: Date.now(),
    }, overworld.underworld);
  }
}
export function hostGiveClientGameState(clientId: string, underworld: Underworld, level: LevelData | undefined, message_type: MESSAGE_TYPES.INIT_GAME_STATE | MESSAGE_TYPES.LOAD_GAME_STATE) {
  // Only the host should be sending INIT_GAME_STATE messages
  // because the host has the canonical game state
  if (globalThis.isHost(underworld.pie)) {
    // Do not send this message to self
    if (globalThis.clientId !== clientId) {
      if (level) {
        console.log(`Host: Send ${clientId} game state for initial load`);
        underworld.pie.sendData({
          type: message_type,
          level,
          underworld: underworld.serializeForSaving(),
        }, {
          subType: "Whisper",
          whisperClientIds: [clientId],
        });
      } else {
        console.error('hostGiveClientGameState: Could not send INIT_GAME_STATE, levelData is undefined');
      }
    }
  }
}
export interface IHostApp {
  // Copied from PieClient.d.ts
  sendData(payload: any, extras?: any): void;
  isHostApp: boolean;
  soloMode: boolean;
  currentRoomInfo?: Room;
}
export function typeGuardHostApp(x: Pie): x is IHostApp {
  // @ts-ignore: PieClient does not have isHostApp property but this typeguard will
  // still work
  return x.isHostApp;
}

export function getVersionInequality(clientVersion?: string, serverVersion?: string): 'equal' | 'client behind' | 'server behind' | 'malformed' {
  if (clientVersion && serverVersion) {
    const [clientMajor, clientMinor, _clientPatch] = clientVersion.split('.');
    const [serverMajor, serverMinor, _serverPath] = serverVersion.split('.');
    if ((exists(clientMajor) && exists(clientMinor) && exists(serverMajor) && exists(serverMinor))) {
      if ((clientMajor !== serverMajor || clientMinor !== serverMinor)) {
        if (parseInt(serverMajor) > parseInt(clientMajor)) {
          return 'client behind'

        } else if (parseInt(serverMajor) < parseInt(clientMajor)) {
          return 'server behind'
        } else {
          return parseInt(serverMinor) > parseInt(clientMinor) ? 'client behind' : 'server behind';
        }
      } else {
        return 'equal'
      }
    }
  }
  return 'malformed'

}