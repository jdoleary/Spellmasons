import PieClient from "@websocketpie/client";
import { setupDevGlobalFunctions } from "./devUtils";
import { registerAdminContextMenuOptions } from "./graphics/ui/eventListeners";
import { setupNetworkHandlerGlobalFunctions } from "./network/networkHandler";
import { hostGiveClientGameState, IHostApp } from "./network/networkUtil";
import Underworld from "./Underworld";
import * as storage from './storage';
import * as Cards from './cards';
import * as Units from './entity/units';
import * as CardUI from './graphics/ui/CardUI';
import * as Player from './entity/Player';
import * as Unit from './entity/Unit';
import * as GameStatistics from "./GameStatistics";
import * as Achievements from "./Achievements";
import { UnitType } from './types/commonTypes';
import { MESSAGE_TYPES } from './types/MessageTypes';
import { addOverworldEventListeners } from "./views";
import { calculateGameDifficulty } from "./Difficulty";
import { setPlayerNameUI } from "./PlayerUtils";
import registerAllMods from "./registerMod";
import { upgradeCardsSource, upgradeMageClassSource, upgradeSourceWhenDead } from "./Upgrade";

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
  // Note: Units must be registered before cards so that summon_generic
  // can access all the unit ids
  Units.registerUnits();
  // Note: Register mods before cards so that if any mods add a unit,
  // that unit will be available in allCards (which is used by summon_generic to create a summon
  // card for that monster)
  registerAllMods(overworld);
  Cards.registerCards(overworld);
  GameStatistics.LogStats();
  Achievements.registerAllAchievements()

  addOverworldEventListeners(overworld);
  // Setup global functions that need access to underworld:
  setupNetworkHandlerGlobalFunctions(overworld);
  setupDevGlobalFunctions(overworld);

  // Setup UI event listeners
  CardUI.setupCardUIEventListeners(overworld);


  // register Admin menu AFTER mods so that you can access mod content
  // in the admin menu
  registerAdminContextMenuOptions(overworld);
  // When the game is ready to process wsPie messages, begin
  // processing them
  // The game is ready when the following have been loaded
  // - wsPieConnection
  // - wsPieRoomJoined 
  // - pixiAssets 
  // - content (register cards and untis)
  // - underworld

  // Check for duplicate upgrades on dev
  if (location && location.href.includes('localhost')) {
    const all_upgrades = [...upgradeCardsSource, ...upgradeSourceWhenDead, ...upgradeMageClassSource];
    for (let upgrade of all_upgrades) {
      if (all_upgrades.filter(u => u.title == upgrade.title).length > 1) {
        console.error(`Multiple upgrades with the same title "${upgrade.title}"`);
      }
    }
  }


  return overworld;
}
// Returns an array of newly created players
export function ensureAllClientsHaveAssociatedPlayers(overworld: Overworld, clients: string[], defaultLobbyReady?: boolean) {
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
    for (let i = 0; i < globalThis.numberOfHotseatPlayers; i++) {
      // playerId helps distinguish multiple players on one client
      let playerId = clientId + "_" + i;

      const player = underworld.players.find(p => p.playerId == playerId);
      if (!player) {
        // If the client that joined does not have a player yet, make them one immediately
        // since all clients should always have a player associated
        console.log(`Setup: Create a Player instance for ${clientId}`)
        const config = globalThis.hotseatPlayerConfig?.[i];
        const player = Player.create(clientId, playerId, underworld);
        // Assign created player to globalThis.player if they are the primary client player
        if (i == 0) Player.updateGlobalRefToPlayerIfCurrentClient(player);
        player.lobbyReady = !!defaultLobbyReady;
        if (config) {
          player.name = config.name;
          player.color = config.color;
          player.colorMagic = config.colorMagic;
          setPlayerNameUI(player);
        }
      }
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
      player.endedTurn = false;
    }
  }
  // Since the player's array length has changed, recalculate all
  // unit strengths.  This must happen BEFORE clients are given the gamestate
  console.log('The number of players has changed');
  recalculateGameDifficulty(underworld);

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
      // Store the level index that this function was invoked on
      // so that it can be sent along with the message so that if
      // the level index changes, 
      // the old SYNC_PLAYERS state won't overwrite the newer state
      currentLevelIndex: underworld.levelIndex,
      units: underworld.units.map(Unit.serialize),
      players: underworld.players.map(Player.serialize),
      lastUnitId: underworld.lastUnitId,
    });
  }

  // Resume turn loop if currently stalled but now a player is able to act:
  underworld.tryRestartTurnPhaseLoop();
}
export function recalculateGameDifficulty(underworld: Underworld) {
  const newDifficulty = calculateGameDifficulty(underworld);
  underworld.units.forEach(unit => {
    // Adjust npc unit strength when the number of players changes
    // Do NOT adjust player unit strength
    if (unit.unitType !== UnitType.PLAYER_CONTROLLED) {
      Unit.adjustUnitDifficulty(unit, newDifficulty);
    }
  });
  console.log('adjusting game difficulty to ', newDifficulty, ' for ', underworld.players.filter(p => p.clientConnected).length, ' connected players.');

}