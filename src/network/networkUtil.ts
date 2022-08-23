import type { LevelData } from '../Underworld';
import { MESSAGE_TYPES } from '../types/MessageTypes';
import * as Player from '../entity/Player';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';
import type PieClient from '@websocketpie/client';
import * as storage from '../storage';
import * as config from '../config';

// Copied from PieClient.d.ts so as to not have to import PieClient
export interface ClientPresenceChangedArgs {
    type: string;
    clients: string[];
    clientThatChanged: string;
    time: number;
}
export function onClientPresenceChanged(o: ClientPresenceChangedArgs, underworld: Underworld) {
    console.log('clientPresenceChanged', o);
    // Ensure each client corresponds with a Player instance
    underworld.ensureAllClientsHaveAssociatedPlayers(o.clients);
    if (o.clientThatChanged == globalThis.player?.clientId) {
        const color = storage.get(config.STORAGE_ID_PLAYER_COLOR);
        const name = storage.get(config.STORAGE_ID_PLAYER_NAME);
        console.log('Initializing player settings from storage', name, color);
        underworld.pie.sendData({
            type: MESSAGE_TYPES.PLAYER_CONFIG,
            color,
            name
        });
    }
}
export function hostGiveClientGameState(clientId: string, underworld: Underworld, level: LevelData | undefined, message_type: MESSAGE_TYPES.INIT_GAME_STATE | MESSAGE_TYPES.LOAD_GAME_STATE) {
    // Only the host should be sending INIT_GAME_STATE messages
    // because the host has the canonical game state
    if (globalThis.isHost(underworld.pie)) {
        if (!level) {
            console.error('Cannot give client game state, levelData is undefined');
            return
        }
        // Do not send this message to self
        if (globalThis.clientId !== clientId) {
            if (level) {
                console.log(`Host: Send ${clientId} game state for initial load`);
                underworld.pie.sendData({
                    type: message_type,
                    level,
                    underworld: underworld.serializeForSyncronize(),
                    phase: underworld.turn_phase,
                    units: underworld.units.map(Unit.serialize),
                    players: underworld.players.map(Player.serialize)
                }, {
                    subType: "Whisper",
                    whisperClientIds: [clientId],
                });
            } else {
                console.error('Could not send INIT_GAME_STATE, levelData is undefined');
            }
        }
    }
}
export interface IHostApp {
    // Copied from PieClient.d.ts
    sendData(payload: any, extras?: any): void;
    isHostApp: boolean;
}
export function typeGuardHostApp(x: PieClient | IHostApp): x is IHostApp {
    // @ts-ignore: PieClient does not have isHostApp property but this typeguard will
    // still work
    return x.isHostApp;
}