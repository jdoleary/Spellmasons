import type { LevelData } from '../Underworld';
import { MESSAGE_TYPES } from '../types/MessageTypes';
import * as Player from '../entity/Player';
import * as Unit from '../entity/Unit';
import Underworld from '../Underworld';

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
export function onClientPresenceChanged(o: ClientPresenceChangedArgs, underworld: Underworld) {
    console.log('clientPresenceChanged', o);
    clients = o.clients;
    // Ensure each client corresponds with a Player instance
    underworld.ensureAllClientsHaveAssociatedPlayers(clients);
}
export function hostGiveClientGameStateForInitialLoad(clientId: string, underworld: Underworld, level?: LevelData) {
    if (!level) {
        console.error('Cannot give client game state, levelData is undefined');
        return
    }
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
export function typeGuardHostApp(x: any): x is IHostApp {
    return x.isHostApp;
}