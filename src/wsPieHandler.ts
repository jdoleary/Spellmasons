import type { ClientPresenceChangedArgs, OnDataArgs } from '@websocketpie/client';

import { MESSAGE_TYPES } from './MessageTypes';
import { UnitType } from './commonTypes';
import floatingText from './FloatingText';
import { getUpgradeByTitle } from './Upgrade';
import Underworld, { SyncInformation, turn_phase } from './Underworld';
import * as Player from './Player';
import * as Unit from './Unit';
import * as Pickup from './Pickup';
import * as Obstacle from './Obstacle';
import * as readyState from './readyState';
import * as messageQueue from './messageQueue';
import * as storage from './storage';
import * as GlobalPromises from './GlobalPromises';
import { setView, View } from './views';
import { tutorialLevels } from './HandcraftedLevels';
import manBlue from './units/manBlue';
import { mouseMove } from './ui/eventListeners';

const messageLog: any[] = [];
let clients: string[] = [];
export function initializeUnderworld() {
  console.log('Setup: Initialize Underworld');
  window.underworld = new Underworld(Math.random().toString());
  // Mark the underworld as "ready"
  readyState.set('underworld', true);
}
window.exitCurrentGame = function exitCurrentGame() {
  // Go back to the main PLAY menu
  window.setMenu('PLAY');
  if (window.underworld) {
    window.underworld.cleanup();
  }
}
export function onData(d: OnDataArgs) {
  console.log("onData:", MESSAGE_TYPES[d.payload.type], d)
  // Temporarily for development
  // TODO: Remove for production, messageLog will take
  // up a lot of memory for real games
  messageLog.push(d);

  const { payload, fromClient } = d;
  const type: MESSAGE_TYPES = payload.type;
  switch (type) {
    case MESSAGE_TYPES.PING:
      floatingText({
        coords: payload,
        text: '🎈',
      });
      break;
    case MESSAGE_TYPES.DESYNC:
      console.warn(`Client ${fromClient} detected desync from host`)
      // When a desync is detected, sync the clients 
      forceSyncClient(fromClient);
      break;
    case MESSAGE_TYPES.INIT_GAME_STATE:
      // Only accept INIT_GAME_STATE message if it contains own player information to prevent
      // loading into a game where you as a player don't exist
      if (payload.underworld.players.find((p: Player.IPlayer) => p.clientId === window.clientId)) {
        // If the underworld is not yet setup for this client then
        // load the game state
        // INIT_GAME_STATE is only to be handled by clients who just
        // connected to the room and need the first transfer of game state
        // This is why it is okay that updating the game state happens 
        // asynchronously.
        if (!readyState.get("underworld")) {
          handleLoadGameState(payload);
        } else {
          console.log('Ignoring INIT_GAME_STATE because underworld has already been initialized.');
        }
      } else {
        console.log('Ignoring INIT_GAME_STATE because it does not contain own client as a player yet');

      }
      break;
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      // If a client loads a full game state, they should be fully synced
      // so clear the onDataQueue to prevent old messages from being processed
      onDataQueueContainer.queue = [d];
      // Reset processedMessageCount since once a client loads a new state
      // it will be synced with all the others and they can all start counting again
      // from 0 to see if they're up to date.
      window.underworld.processedMessageCount = 0;
      // The LOAD_GAME_STATE message is tricky, it is an 
      // exception to the normal pattern used
      // with the queue, but it should still be processed sequentially to prevent
      // weird race conditions.
      // Since it is a fully copy of the latest
      // game state, it should empty the queue (except for itself).
      // And rather than calling handleOnDataMessageSyncronously(d) here,
      // we just skip right to calling processNextInQueue since this message
      // can execute regardless of whether readyState.isReady() is true or not
      // --
      processNextInQueueIfReady();
      break;
    default:
      // All other messages should be handled one at a time to prevent desync
      handleOnDataMessageSyncronously(d);
      break;
  }
}
let onDataQueueContainer = messageQueue.makeContainer<OnDataArgs>();
// Waits until a message is done before it will continue to process more messages that come through
// This ensures that players can't move in the middle of when spell effects are occurring for example.
function handleOnDataMessageSyncronously(d: OnDataArgs) {
  // Queue message for processing one at a time
  onDataQueueContainer.queue.push(d);
  // 10 is an arbitrary limit which will report that something may be wrong
  // because it's unusual for the queue to get this large
  if (onDataQueueContainer.queue.length > 10) {
    console.warn("onData queue is growing unusually large: ", onDataQueueContainer.queue.length, "stuck on message: ", currentlyProcessingOnDataMessage);
  }
  // process the "next" (the one that was just added) immediately
  processNextInQueueIfReady();
}
// currentlyProcessingOnDataMessage is used to help with bug reports to show
// which message is stuck and didn't finish being processed.
let currentlyProcessingOnDataMessage: any = null;
export function processNextInQueueIfReady() {
  // If game is ready to process messages, begin processing
  // (if not, they will remain in the queue until the game is ready)
  if (readyState.isReady()) {
    messageQueue.processNextInQueue(onDataQueueContainer, handleOnDataMessage);
  }
}
function tryStartGame() {
  const gameAlreadyStarted = window.underworld.levelIndex >= 0;
  const currentClientIsHost = window.hostClientId == window.clientId;
  const clientsLeftToChooseCharacters = clients.length - window.underworld.players.length;
  // Starts a new game if all clients have chosen characters, THIS client is the host, and 
  // if the game hasn't already been started
  if (currentClientIsHost && clientsLeftToChooseCharacters <= 0 && !gameAlreadyStarted) {
    console.log('Host: Start game');
    setView(View.Game);
    window.underworld.initLevel(0);
    window.underworld.gameStarted = true;
    console.log('Host: Send all clients game state for initial load');
    clients.forEach(clientId => {
      giveClientGameStateForInitialLoad(clientId);
    });
  } else {
    console.log('Before game can begin, users left to choose a character: ', clientsLeftToChooseCharacters);
  }
}
export async function startTutorial() {
  console.log('Game: Start Tutorial');
  await window.startSingleplayer();
  const p = Player.create(window.clientId, manBlue.id);
  if (p) {
    window.underworld.players.push(p);
    if (window.underworld.gameStarted) {
      // Initialize the player for the level
      Player.resetPlayerForNextLevel(p);
    }
  } else {
    console.error('Could not create player character for tutorial');
  }
  const gameAlreadyStarted = window.underworld.levelIndex >= 0;
  const currentClientIsHost = window.hostClientId == window.clientId;
  const clientsLeftToChooseCharacters = clients.length - window.underworld.players.length;
  // Starts a new game if all clients have chosen characters, THIS client is the host, and 
  // if the game hasn't already been started
  if (tutorialLevels[0] && currentClientIsHost && clientsLeftToChooseCharacters <= 0 && !gameAlreadyStarted) {
    console.log('Host: Start tutorial');
    window.underworld.initHandcraftedLevel(tutorialLevels[0]);
    window.underworld.gameStarted = true;
  } else {
    console.log('Users left to choose a character: ', clientsLeftToChooseCharacters);
  }
}
async function handleOnDataMessage(d: OnDataArgs): Promise<any> {
  window.underworld.processedMessageCount++;
  currentlyProcessingOnDataMessage = d;
  const { payload, fromClient } = d;
  const type: MESSAGE_TYPES = payload.type;
  console.log("Handle ONDATA", type, payload)
  // Get player of the client that sent the message 
  const fromPlayer = window.underworld.players.find((p) => p.clientId === fromClient);
  switch (type) {
    // Checks to see if desync has occurred between clients
    // It is important that this message is handled syncronously, so we don't get 
    // false positives (reporting on desyncs when it's client-only state such as moveTarget -
    // moveTarget changes rapidly in the gameLoop, if it were to be factored into the hash, 
    // there would easily be false positives where it reports that clients are out of sync
    // when really they just took a snapshot (the hash) at slightly different times when executing
    // the same messages.
    // case MESSAGE_TYPES.GAMESTATE_HASH:
    //   const hostClientsHash = payload.hash;
    //   if (window.underworld.processedMessageCount != payload.processedMessageCount) {
    //     console.log('Skip hash comparison as one of the clients is still catching up to the other in the message queue', window.underworld.processedMessageCount, payload.processedMessageCount)
    //     break;
    //   }
    //   const currentSerializedGameState = window.underworld.serializeForHash();
    //   const currentHash = hash(JSON.stringify(currentSerializedGameState));
    //   if (currentHash != hostClientsHash) {
    //     console.error(`Desync: ${window.underworld.processedMessageCount} ${payload.processedMessageCount} Out of sync with host, ${currentHash} ${hostClientsHash} (${hash(payload.state)})`);
    //     // TODO: Remove floating text for production
    //     floatingText({
    //       coords: { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 }, text: "Out of sync with host!",
    //       style: {
    //         fill: 'red',
    //         fontSize: '60px',
    //       },
    //     })
    //     console.log("gamestate diff:\n", diff(currentSerializedGameState, JSON.parse(payload.state)));
    //     window.pie.sendData({
    //       type: MESSAGE_TYPES.DESYNC
    //     });
    //   }
    //   break;
    case MESSAGE_TYPES.JOIN_GAME:
      if (readyState.isReady()) {
        const currentClientIsHost = window.hostClientId == window.clientId;
        // JOIN_GAME is meant to be handled by everyone except the client that 
        // send the message because the client that just joined will get a whole
        // gamestate dump from the host.
        // Exception: The host should handle their own player creation
        // If current client is the host or this message is from a different client then self
        if (currentClientIsHost || fromClient !== window.clientId) {
          // Create Player entity for the client that just joined:
          // If player doesn't already exist, make them
          const alreadyAssociatedPlayer = window.underworld.players.find((p) => p.clientId === fromClient);
          if (alreadyAssociatedPlayer) {
            console.log('Client is already associated with a Player instance, so they will rejoin as that player rather than creating a new one', fromClient);
            Player.setClientConnected(alreadyAssociatedPlayer, true);
          } else {
            console.log(`Setup: Create a Player instance for ${fromClient}`)
            const p = Player.create(fromClient, payload.unitId);
            if (p) {
              window.underworld.players.push(p);
              if (window.underworld.gameStarted) {
                // Initialize the player for the level
                Player.resetPlayerForNextLevel(p);
              }
              const cachedPlayerActiveTurn = window.underworld.players[window.underworld.playerTurnIndex];
              // Sort underworld.players according to client order so that all
              // instances of the game have a underworld.players array in the same
              // order
              // --
              // (the .filter removes possible undefined players so that underworld.players doesn't contain any undefined values)
              window.underworld.players = clients.map(c => window.underworld.players.find(p => p.clientId == c)).filter(x => !!x) as Player.IPlayer[];
              // Restore playerTurnIndex after mutating the players array
              const restorePlayerTurnIndex = window.underworld.players.findIndex(p => p == cachedPlayerActiveTurn);
              if (restorePlayerTurnIndex !== undefined) {
                window.underworld.playerTurnIndex = restorePlayerTurnIndex;
              }
            } else {
              console.error("Failed to SelectCharacter because Player.create did not return a player object")
            }
          }

          // Note: Allow the client to recieve gamestate even if a new player cannot be created because they may
          // be rejoining as an already existing character
          const gameAlreadyStarted = window.underworld.levelIndex >= 0;
          if (gameAlreadyStarted) {
            // Send the lastest gamestate to that client so they can be up-to-date:
            // Note: It is important that this occurs AFTER the player instance is created for the
            // client who just joined
            // If the game has already started (e.g. the host has already joined), send the initial state to the new 
            // client only so they can load
            giveClientGameStateForInitialLoad(fromClient);
          }

        }
      } else {
        console.error('Attempted to JOIN_GAME before readState.isReady()');
      }
      tryStartGame();
      break;
    case MESSAGE_TYPES.SYNC:
      const { players, units, level } = payload as SyncInformation;

      if (players) {
        console.log('sync: Syncing players...');
        for (let originalPlayer of window.underworld.players) {
          const syncPlayer = players.find(p => p.clientId == originalPlayer?.clientId)
          if (!syncPlayer) {
            console.error("Something is wrong, underworld has different players than sync players")
            // Client incurred major desync, resolve via DESYNC message
            window.pie.sendData({ type: MESSAGE_TYPES.DESYNC });
            return;
          } else {
            Player.syncronize(syncPlayer, originalPlayer);
          }
        }

      }
      if (units) {
        console.log('sync: Syncing units...');
        for (let originalUnit of window.underworld.units) {
          // TODO: optimize if needed
          const syncUnit = units.find(u => u.id === originalUnit.id);
          if (!syncUnit) {
            console.error("Something is wrong, underworld has different length unit than sync units")
            // Client incurred major desync, resolve via DESYNC message
            window.pie.sendData({ type: MESSAGE_TYPES.DESYNC });
            return;
          } else {
            // Note: Unit.syncronize will currently maintain the player.unit reference
            Unit.syncronize(syncUnit, originalUnit);
          }
        }

      }
      if (level) {
        console.log('sync: Syncing level...');
        if (window.underworld) {
          window.underworld.createLevel(level);
        } else {
          console.error('Cannot sync level, no window.underworld exists')
        }
      }

      GlobalPromises.resolve('sync');

      break;
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      // Clean up old game state
      if (window.underworld) {
        window.underworld.cleanup();
      }
      handleLoadGameState(payload);
      break;
    case MESSAGE_TYPES.ENTER_PORTAL:
      if (fromPlayer) {
        Player.enterPortal(fromPlayer);
      } else {
        console.error('Recieved ENTER_PORTAL message but "caster" is undefined')
      }
      break;
    case MESSAGE_TYPES.MOVE_PLAYER:
      if (fromPlayer) {
        await Unit.moveTowards(fromPlayer.unit, payload).then(() => {
          window.underworld.calculateEnemyAttentionMarkers();
        });
      } else {
        console.error('Cannot move player, caster does not exist');
      }
      break;
    case MESSAGE_TYPES.SPELL:
      if (fromPlayer) {
        await handleSpell(fromPlayer, payload);
      } else {
        console.error('Cannot cast, caster does not exist');
      }
      break;
    case MESSAGE_TYPES.CHOOSE_UPGRADE:
      const upgrade = getUpgradeByTitle(payload.upgrade.title);
      if (fromPlayer && upgrade) {
        window.underworld.chooseUpgrade(fromPlayer, upgrade);
      } else {
        console.error(
          'Cannot choose upgrade, either the caster or upgrade does not exist',
          fromPlayer,
          upgrade,
        );
      }
      break;
    case MESSAGE_TYPES.END_TURN:
      if (fromPlayer) {
        window.underworld.endPlayerTurn(fromPlayer.clientId);
        // Reset stamina immediately on endTurn so that the end-turn-btn highlight goes away
        if (fromPlayer == window.player) {
          window.player.unit.stamina = window.player.unit.staminaMax;
        }
      } else {
        console.error('Unable to end turn because caster is undefined');
      }
      break;
  }
}
function handleLoadGameState(payload: any) {
  console.log("Setup: Load game state", payload)
  // Resume game / load game / rejoin game
  const loadedGameState: Underworld = { ...payload.underworld };
  window.underworld = new Underworld(loadedGameState.seed, loadedGameState.RNGState);
  window.underworld.width = loadedGameState.width;
  window.underworld.height = loadedGameState.height;
  window.underworld.playerTurnIndex = loadedGameState.playerTurnIndex;
  window.underworld.levelIndex = loadedGameState.levelIndex;
  // Load all units that are not player's, those will be loaded indepentently
  window.underworld.units = loadedGameState.units
    // Player controlled units are loaded within the players array
    .filter((u) => u.unitType !== UnitType.PLAYER_CONTROLLED)
    .map(Unit.load);
  window.underworld.players = loadedGameState.players.map(Player.load);
  // Resort units by id since player units are loaded last
  window.underworld.units.sort((a, b) => a.id - b.id);
  window.underworld.pickups = loadedGameState.pickups.map(Pickup.load);
  window.underworld.groundTiles = loadedGameState.groundTiles;
  window.underworld.addGroundTileImages();

  window.underworld.setTurnPhase(window.underworld.turn_phase);

  // TODO are bounds, pathingPolygons, and walls in loadstate?
  // Maybe use levelData to recreate level on load
  // window.underworld.cacheWalls();

  // Mark the underworld as "ready"
  readyState.set('underworld', true);

}
async function handleSpell(caster: Player.IPlayer, payload: any) {
  if (typeof payload.x !== 'number' || typeof payload.y !== 'number') {
    console.error('Spell is invalid, it must have coordinates');
    return;
  }

  // TODO: Keep this around for when we have one-use cards
  // Card.removeCardsFromHand(caster, payload.cards);

  // Only allow casting during the PlayerTurns phase
  if (window.underworld.turn_phase === turn_phase.PlayerTurns) {
    window.animatingSpells = true;
    await window.underworld.castCards(caster.cardUsageCounts, caster.unit, payload.cards, payload, false);
    // Now that units may have died or be frozen, calculate their attention markers
    window.underworld.calculateEnemyAttentionMarkers();
    window.animatingSpells = false;
    // When spells are done animating but the mouse hasn't moved,
    // syncSpellEffectProjection needs to be called so that the icon ("footprints" for example)
    // will be shown in the tile that the mouse is hovering over
    mouseMove();
    // Check for dead players to end their turn,
    // this occurs here because spells may have caused their death
    for (let p of window.underworld.players) {
      // If a player's unit is dead, end their turn
      if (!p.unit.alive) {
        window.underworld.endPlayerTurn(p.clientId);
      }
    }
  } else {
    console.log('Someone is trying to cast out of turn');
  }
}
// Returns the list of clientIds
export function getClients(): string[] {
  return clients;
}
function forceSyncClient(syncClientId: string) {
  // Only the host should be sending LOAD_GAME_STATE messages
  // because the host has the canonical game state
  if (window.hostClientId === window.clientId) {
    console.error('forceSyncClient occurred')
    window.pie.sendData({
      type: MESSAGE_TYPES.LOAD_GAME_STATE,
      underworld: window.underworld.serializeForSaving(),
    }, {
      subType: "Whisper",
      whisperClientIds: [syncClientId],
    });
  }
}
function giveClientGameStateForInitialLoad(clientId: string) {
  // Only the host should be sending INIT_GAME_STATE messages
  // because the host has the canonical game state
  if (window.hostClientId === window.clientId) {
    // Do not send this message to self
    if (window.clientId !== clientId) {
      console.log(`Host: Send ${clientId} game state for initial load`);
      window.pie.sendData({
        type: MESSAGE_TYPES.INIT_GAME_STATE,
        underworld: window.underworld.serializeForSaving(),
      }, {
        subType: "Whisper",
        whisperClientIds: [clientId],
      });
    }
  }
}

export function onClientPresenceChanged(o: ClientPresenceChangedArgs) {
  console.log('clientPresenceChanged', o);
  clients = o.clients;
  const playerOfClientThatChanged = window.underworld && window.underworld.players.find(
    (p) => p.clientId === o.clientThatChanged,
  );
  // Client joined
  if (o.present && clients[0] !== undefined) {
    // The host is always the first client
    window.hostClientId = clients[0];
    if (window.hostClientId === window.clientId) {
      console.log(`Setup: Setting Host client to ${window.hostClientId}. %c You are the host. `, 'background: #222; color: #bada55');
    } else {
      console.log(`Setup: Setting Host client to ${window.hostClientId}.`);
    }
    // And if the client that joined is associated with a player
    if (playerOfClientThatChanged) {
      // set their connected status
      Player.setClientConnected(playerOfClientThatChanged, o.present);
      // If the rejoining client is the current client and they already have a player
      // that means they suffered a mid game disconnection and should ask for the
      // entire gamestate
      if (playerOfClientThatChanged.clientId == window.clientId) {
        window.pie.sendData({
          type: MESSAGE_TYPES.DESYNC
        })
      }
    }
  } else {
    // Client left

    // If the client that left is associated with a player
    if (playerOfClientThatChanged) {
      // Disconnect the player and end their turn
      Player.setClientConnected(playerOfClientThatChanged, false);
      window.underworld.endPlayerTurn(playerOfClientThatChanged.clientId);
    } else {
      // this can occur naturally if a client disconnects before choosing
      // a character
    }

    // if host left
    if (o.clientThatChanged === window.hostClientId && clients[0] !== undefined) {
      // Set host to the 0th client that is still connected
      window.hostClientId = clients[0];
      if (window.hostClientId === window.clientId) {
        console.log(`Setup: Host client left, reassigning host to ${window.hostClientId}. %c You are the host. `, 'background: #222; color: #bada55');
      } else {
        console.log(`Setup: Host client left, reassigning host to ${window.hostClientId}.`);
      }
    }
  }
  // If the underworld doesn't exist, have the host setup the underworld
  // Note: This should occur regardless if the client in question is joining or leaving
  // because it will trigger if the host JOINs and is the first to join the room (thus being the host)
  // or if the host leaves and the 2nd client (which becomes the host) never got the gamestate and is thus
  // needed to initialize
  if (window.hostClientId == window.clientId && !readyState.get("underworld")) {
    console.log("Setup: Initializing underworld as host");
    initializeUnderworld();
  }
}

const savePrefix = 'spellmasons-save-';
window.getAllSaveFiles = () => Object.keys(localStorage).filter(x => x.startsWith(savePrefix)).map(x => x.substring(savePrefix.length));

window.save = (title) => {
  storage.set(
    savePrefix + title,
    JSON.stringify({
      underworld: window.underworld.serializeForSaving(),
    }),
  );
};
window.load = async (title) => {
  const savedGameString = storage.get(savePrefix + title);
  if (savedGameString) {

    if (!readyState.get('underworld')) {
      await window.startSingleplayer();
    }

    const { underworld } = JSON.parse(savedGameString);
    window.pie.sendData({
      type: MESSAGE_TYPES.LOAD_GAME_STATE,
      underworld,
    });
    setView(View.Game);

  } else {
    console.error('no save game found with title', title);
  }
};

window.saveReplay = (title: string) => {
  storage.set('golems-' + title, JSON.stringify(messageLog));
};
// TODO, replay is currently broken
// window.replay = (title: string) => {
//   const messages = JSON.parse(storage.get('golems-' + title) || '[]');
//   for (let i = 0; i < messages.length; i++) {
//     const message = messages[i];
//     message.fromClient = window.underworld.players[0].clientId;
//     onData(message);
//   }
// };
