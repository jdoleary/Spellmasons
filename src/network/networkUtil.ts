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
        // The host is always the first client
        window.hostClientId = clients[0];
        // If game is already started
        if (window.underworld) {
            // Ensure each client corresponds with a Player instance
            window.underworld.ensureAllClientsHaveAssociatedPlayers(clients);
        } else {
            if (window.hostClientId === window.clientId) {
                console.log(`Setup: Setting Host client to ${window.hostClientId}. You are the host. `);
                tryStartGame();
            } else {
                console.log(`Setup: Setting Host client to ${window.hostClientId}.`);
            }
        }
    } else {

    }
}

async function tryStartGame() {
    console.log('Start Game: Attempt to start the game')
    const currentClientIsHost = window.hostClientId == window.clientId;
    // Starts a new game if THIS client is the host, and 
    if (currentClientIsHost) {
        const gameAlreadyStarted = window.underworld && window.underworld.levelIndex >= 0;
        // if the game hasn't already been started
        if (!gameAlreadyStarted) {
            console.log('Host: Start game / Initialize Underworld');
            window.underworld = new Underworld(Math.random().toString());
            // Mark the underworld as "ready"
            readyState.set('underworld', true);
            const levelData = await window.underworld.initLevel(0);
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
export function hostGiveClientGameStateForInitialLoad(clientId: string, level: LevelData = window.lastLevelCreated) {
    // Only the host should be sending INIT_GAME_STATE messages
    // because the host has the canonical game state
    if (window.hostClientId === window.clientId) {
        // Do not send this message to self
        if (window.clientId !== clientId) {
            if (level) {
                console.log(`Host: Send ${clientId} game state for initial load`);
                window.pie.sendData({
                    type: MESSAGE_TYPES.INIT_GAME_STATE,
                    level,
                    underworld: window.underworld.serializeForSyncronize(),
                    phase: window.underworld.turn_phase,
                    units: window.underworld.units.map(Unit.serialize),
                    players: window.underworld.players.map(Player.serialize)
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