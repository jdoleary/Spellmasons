import Underworld, { LevelData } from '../Underworld';
import { MESSAGE_TYPES } from '../types/MessageTypes';
import * as readyState from '../readyState';
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
    // Client joined
    if (clients[0] !== undefined) {
        // If game is already started
        if (globalThis.underworld) {
            // Ensure each client corresponds with a Player instance
            globalThis.underworld.ensureAllClientsHaveAssociatedPlayers(clients);
        } else {
            if (globalThis.isHost()) {
                tryStartGame();
            } else {
                console.error('Unexpected, joined a room where the game is not already started but you are not in solomode');
            }
        }
    } else {

    }
}

async function tryStartGame() {
    console.log('Start Game: Attempt to start the game')
    // Starts a new game if THIS client is the host, and 
    if (globalThis.isHost()) {
        const gameAlreadyStarted = globalThis.underworld && globalThis.underworld.levelIndex >= 0;
        // if the game hasn't already been started
        if (!gameAlreadyStarted) {
            console.log('Host: Start game / Initialize Underworld');
            globalThis.underworld = new Underworld(Math.random().toString());
            // Mark the underworld as "ready"
            readyState.set('underworld', true);
            const levelData = await globalThis.underworld.initLevel(0);
            console.log('Host: Send all clients game state for initial load');
            clients.forEach(clientId => {
                hostGiveClientGameStateForInitialLoad(clientId, levelData);
            });
        } else {
            console.log('Start Game: Won\'t, game has already been started');
        }
    } else {
        console.log('Start Game: Won\'t, client must be host to start the game.')
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