import type { LevelData } from '../Underworld';
import { MESSAGE_TYPES } from '../types/MessageTypes';
import * as Player from '../entity/Player';
import * as Unit from '../entity/Unit';

// Copied from PieClient.d.ts so as to not have to import PieClient
export interface ClientPresenceChangedArgs {
    type: string;
    clients: string[];
    time: number;
}
let clients: string[] = [];
// Returns the list of clientIds
export function getClients(): string[] {
    return clients;
}
export function onClientPresenceChanged(o: ClientPresenceChangedArgs) {
    console.log('clientPresenceChanged', o);
    clients = o.clients;
    // If game is already started
    if (globalThis.underworld) {
        // Ensure each client corresponds with a Player instance
        globalThis.underworld.ensureAllClientsHaveAssociatedPlayers(clients);
    }
}
export function hostGiveClientGameStateForInitialLoad(clientId: string, level: LevelData = globalThis.lastLevelCreated) {
    // Only the host should be sending INIT_GAME_STATE messages
    // because the host has the canonical game state
    if (globalThis.isHost()) {
        // Do not send this message to self
        if (globalThis.clientId !== clientId) {
            if (level) {
                console.log(`Host: Send ${clientId} game state for initial load`);
                globalThis.pie.sendData({
                    type: MESSAGE_TYPES.INIT_GAME_STATE,
                    level,
                    underworld: globalThis.underworld.serializeForSyncronize(),
                    phase: globalThis.underworld.turn_phase,
                    units: globalThis.underworld.units.map(Unit.serialize),
                    players: globalThis.underworld.players.map(Player.serialize)
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
export function typeGuardHostApp(x: any): x is IHostApp {
    return x.isHostApp;
}