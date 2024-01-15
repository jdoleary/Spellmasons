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

// Copied from PieClient.d.ts so as to not have to import PieClient
export interface ClientPresenceChangedArgs {
    type: string;
    clients: string[];
    time: number;
}
export function onClientPresenceChanged(o: ClientPresenceChangedArgs, overworld: Overworld) {
    console.log('clientPresenceChanged', o);
    // clientPresenceChanged message is only ever received if the current client is in a room
    // The client will also receive one when they first join a room.
    globalThis.setMenuIsInRoom?.(true);
    // Ensure each client corresponds with a Player instance
    ensureAllClientsHaveAssociatedPlayers(overworld, o.clients);
    if (overworld.underworld) {
        overworld.underworld.tryGameOver();
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
                    underworld: underworld.serializeForSyncronize(),
                    phase: underworld.turn_phase,
                    pickups: underworld.pickups.filter(p => !p.flaggedForRemoval).map(Pickup.serialize),
                    units: underworld.units.filter(u => !u.flaggedForRemoval).map(Unit.serialize),
                    players: underworld.players.map(Player.serialize)
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
export function typeGuardHostApp(x: PieClient | IHostApp): x is IHostApp {
    // @ts-ignore: PieClient does not have isHostApp property but this typeguard will
    // still work
    return x.isHostApp;
}

export function getVersionInequality(clientVersion?: string, serverVersion?: string): 'equal' | 'client behind' | 'server behind' | 'malformed' {
    if (clientVersion && serverVersion) {
        const [clientMajor, clientMinor, _clientPatch] = clientVersion.split('.');
        const [serverMajor, serverMinor, _serverPath] = serverVersion.split('.');
        if ((clientMajor !== undefined && clientMinor !== undefined && serverMajor !== undefined && serverMinor !== undefined)) {
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