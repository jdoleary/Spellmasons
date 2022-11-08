import PieClient from "@websocketpie/client";
import { setupDevGlobalFunctions } from "./devUtils";
import { registerAdminContextMenuOptions } from "./graphics/ui/eventListeners";
import { setupNetworkHandlerGlobalFunctions } from "./network/networkHandler";
import { hostGiveClientGameState, IHostApp } from "./network/networkUtil";
import Underworld from "./Underworld";
import * as Cards from './cards';
import * as Units from './entity/units';
import * as CardUI from './graphics/ui/CardUI';
import * as Player from './entity/Player';
import * as Unit from './entity/Unit';
import { UnitType } from './types/commonTypes';
import { MESSAGE_TYPES } from './types/MessageTypes';
import { addOverworldEventListeners } from "./views";
import { calculateGameDifficulty } from "./Difficulty";

export interface Overworld {
    pie: PieClient | IHostApp;
    // a list of clientIds
    clients: string[];
    underworld?: Underworld;
}
// Overworld exists so that functions that need a reference to an underworld
// can hold on to a persistant reference which CONTAINS the lastest underworld reference.
// This allows Underworlds to be created and destroyed without invalidating functions
// (like event listeners) that need to keep a reference to the current underworld
export default function makeOverworld(pie: PieClient | IHostApp): Overworld {
    const overworld: Overworld = {
        pie,
        clients: [],
        underworld: undefined
    };

    // Initialize content
    Cards.registerCards(overworld);
    Units.registerUnits();

    addOverworldEventListeners(overworld);
    registerAdminContextMenuOptions(overworld);
    // Setup global functions that need access to underworld:
    setupNetworkHandlerGlobalFunctions(overworld);
    setupDevGlobalFunctions(overworld);

    // Setup UI event listeners
    CardUI.setupCardUIEventListeners(overworld);

    // When the game is ready to process wsPie messages, begin
    // processing them
    // The game is ready when the following have been loaded
    // - wsPieConnection
    // - wsPieRoomJoined 
    // - pixiAssets 
    // - content (register cards and untis)
    // - underworld

    return overworld;
}
// Returns an array of newly created players
export function ensureAllClientsHaveAssociatedPlayers(overworld: Overworld, clients: string[]) {
    if (!overworld) {
        console.error('Cannot sync clients, no overworld');
        return;
    }
    const { underworld } = overworld;
    if (!underworld) {
        console.error('Cannot sync clients with players, no underworld exists.');
        return;
    }
    overworld.clients = clients;
    // Ensure all clients have players
    for (let clientId of overworld.clients) {
        const player = underworld.players.find(p => p.clientId == clientId);
        if (!player) {
            // If the client that joined does not have a player yet, make them one immediately
            // since all clients should always have a player associated
            console.log(`Setup: Create a Player instance for ${clientId}`)
            Player.create(clientId, underworld);
        }
    }
    // Sync all players' connection statuses with the clients list
    // This ensures that there are no players left that think they're connected
    // but are not a part of the clients list
    let clientsToSendGameState = [];
    for (let player of underworld.players) {
        const wasConnected = player.clientConnected;
        const isConnected = clients.includes(player.clientId);
        Player.setClientConnected(player, isConnected, underworld);
        if (!wasConnected && isConnected) {
            clientsToSendGameState.push(player.clientId);
        }
    }
    // Since the player's array length has changed, recalculate all
    // unit strengths.  This must happen BEFORE clients are given the gamestate
    const newDifficulty = calculateGameDifficulty(underworld);
    underworld.units.forEach(unit => {
        // Adjust npc unit strength when the number of players changes
        // Do NOT adjust player unit strength
        if (unit.unitType !== UnitType.PLAYER_CONTROLLED) {
            Unit.adjustUnitDifficulty(unit, newDifficulty);
        }
    });
    console.log('The number of players has changed, adjusting game difficulty to ', newDifficulty, ' for ', underworld.players.filter(p => p.clientConnected).length, ' connected players.');

    // Send game state after units' strength has been recalculated
    for (let clientId of clientsToSendGameState) {
        // Send the lastest gamestate to that client so they can be up-to-date:
        // Note: It is important that this occurs AFTER the player instance is created for the
        // client who just joined
        // If the game has already started (e.g. the host has already joined), send the initial state to the new 
        // client only so they can load
        hostGiveClientGameState(clientId, underworld, underworld.lastLevelCreated, MESSAGE_TYPES.INIT_GAME_STATE);
    }

    if (globalThis.isHost(underworld.pie)) {
        overworld.pie.sendData({
            type: MESSAGE_TYPES.SYNC_PLAYERS,
            units: underworld.units.map(Unit.serialize),
            players: underworld.players.map(Player.serialize)
            // todo sync doodads here
        });
    }

    // Resume turn loop if currently stalled but now a player is able to act:
    underworld.tryRestartTurnPhaseLoop();
}
// window.test_GC_underworld = () => {
//     for (let i = 0; i < 1000; i++) {
//         new Underworld(test, test.pie, Math.random().toString());
//     }
// }