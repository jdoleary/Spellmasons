import type { ClientPresenceChangedArgs, OnDataArgs } from '@websocketpie/client';

import { MESSAGE_TYPES } from './MessageTypes';
import { UnitType } from './commonTypes';
import floatingText from './FloatingText';
import { getUpgradeByTitle } from './Upgrade';
import Underworld, { turn_phase } from './Underworld';
import * as Player from './Player';
import * as Unit from './Unit';
import * as Pickup from './Pickup';
import * as Obstacle from './Obstacle';
import { syncSpellEffectProjection } from './ui/PlanningView';
import * as readyState from './readyState';
import * as messageQueue from './messageQueue';

const messageLog: any[] = [];
let clients: string[] = [];
let underworld: Underworld;
export function initializeUnderworld() {
  console.log('Setup: Initialize Underworld');
  underworld = new Underworld(Math.random().toString());
  // Mark the underworld as "ready"
  readyState.set('underworld', true);
}
window.exitCurrentGame = function exitCurrentGame() {
  if (underworld) {
    underworld.cleanup();
  }
  // @ts-ignore
  underworld = undefined;
  readyState.set('underworld', false);
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
      underworld.processedMessageCount = 0;
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
  const gameAlreadyStarted = underworld.levelIndex >= 0;
  const currentClientIsHost = window.hostClientId == window.clientId;
  const clientsLeftToChooseCharacters = clients.length - underworld.players.length;
  // Starts a new game if all clients have chosen characters, THIS client is the host, and 
  // if the game hasn't already been started
  if (currentClientIsHost && clientsLeftToChooseCharacters <= 0 && !gameAlreadyStarted) {
    console.log('Host: Start game');
    underworld.initLevel(0);
    console.log('Host: Send all clients game state for initial load');
    clients.forEach(clientId => {
      giveClientGameStateForInitialLoad(clientId);
    });
  } else {
    console.log('Users left to choose a character: ', clientsLeftToChooseCharacters);
  }

}
async function handleOnDataMessage(d: OnDataArgs): Promise<any> {
  underworld.processedMessageCount++;
  currentlyProcessingOnDataMessage = d;
  const { payload, fromClient } = d;
  const type: MESSAGE_TYPES = payload.type;
  console.log("Handle ONDATA", type, payload)
  // Get caster
  const caster = underworld.players.find((p) => p.clientId === fromClient);
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
    //   if (underworld.processedMessageCount != payload.processedMessageCount) {
    //     console.log('Skip hash comparison as one of the clients is still catching up to the other in the message queue', underworld.processedMessageCount, payload.processedMessageCount)
    //     break;
    //   }
    //   const currentSerializedGameState = underworld.serializeForHash();
    //   const currentHash = hash(JSON.stringify(currentSerializedGameState));
    //   if (currentHash != hostClientsHash) {
    //     console.error(`Desync: ${underworld.processedMessageCount} ${payload.processedMessageCount} Out of sync with host, ${currentHash} ${hostClientsHash} (${hash(payload.state)})`);
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
          const alreadyAssociatedPlayer = underworld.players.find((p) => p.clientId === fromClient);
          if (alreadyAssociatedPlayer) {
            console.log('Client is already associated with a Player instance, so they will rejoin as that player rather than creating a new one', fromClient);
            Player.setClientConnected(alreadyAssociatedPlayer, true);
          } else {
            console.log(`Setup: Create a Player instance for ${fromClient}`)
            const p = Player.create(fromClient, payload.unitId);
            if (p) {
              underworld.players.push(p);
              // Initialize the player for the level
              Player.resetPlayerForNextLevel(p);
              const cachedPlayerActiveTurn = underworld.players[underworld.playerTurnIndex];
              // Sort underworld.players according to client order so that all
              // instances of the game have a underworld.players array in the same
              // order
              // --
              // (the .filter removes possible undefined players so that underworld.players doesn't contain any undefined values)
              underworld.players = clients.map(c => underworld.players.find(p => p.clientId == c)).filter(x => !!x) as Player.IPlayer[];
              // Restore playerTurnIndex after mutating the players array
              const restorePlayerTurnIndex = underworld.players.findIndex(p => p == cachedPlayerActiveTurn);
              if (restorePlayerTurnIndex !== undefined) {
                underworld.playerTurnIndex = restorePlayerTurnIndex;
              }
            } else {
              console.error("Failed to SelectCharacter because Player.create did not return a player object")
            }
          }

          // Note: Allow the client to recieve gamestate even if a new player cannot be created because they may
          // be rejoining as an already existing character
          const gameAlreadyStarted = underworld.levelIndex >= 0;
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
      const { players, units, underworldPartial } = payload;

      underworld.syncronize(underworldPartial);
      for (let i = 0; i < underworld.units.length; i++) {
        const syncUnit = units[i]
        if (!syncUnit) {
          console.error("Something is wrong, underworld has different length unit than sync units")
          // Client incurred major desync, resolve via DESYNC message
          window.pie.sendData({ type: MESSAGE_TYPES.DESYNC });
          return;
        } else {
          const sourceUnit = underworld.units[i];
          if (syncUnit.id !== sourceUnit.id) {
            console.error('Sync failure, units are out of order', syncUnit.id, sourceUnit.id);
            // Client incurred major desync, resolve via DESYNC message
            window.pie.sendData({ type: MESSAGE_TYPES.DESYNC });
            return;
          } else {
            Unit.syncronize(syncUnit, underworld.units[i]);
          }
        }
      }
      for (let i = 0; i < underworld.players.length; i++) {
        const syncPlayer = players[i]
        if (!syncPlayer || syncPlayer.clientId !== underworld.players[i].clientId) {
          console.error("Something is wrong, underworld has different players than sync players")
          // Client incurred major desync, resolve via DESYNC message
          window.pie.sendData({ type: MESSAGE_TYPES.DESYNC });
          return;
        } else {
          Player.syncronize(syncPlayer, underworld.players[i]);
        }
      }

      break;
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      // Clean up old game state
      if (underworld) {
        underworld.cleanup();
      }
      handleLoadGameState(payload);
      break;
    case MESSAGE_TYPES.SPELL:
      if (caster) {
        await handleSpell(caster, payload);
      } else {
        console.error('Cannot cast, caster does not exist');
      }
      break;
    case MESSAGE_TYPES.CHOOSE_UPGRADE:
      const upgrade = getUpgradeByTitle(payload.upgrade.title);
      if (caster && upgrade) {
        underworld.chooseUpgrade(caster, upgrade);
      } else {
        console.error(
          'Cannot choose upgrade, either the caster or upgrade does not exist',
          caster,
          upgrade,
        );
      }
      break;
    case MESSAGE_TYPES.END_TURN:
      if (caster) {
        underworld.endPlayerTurn(caster.clientId);
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
  underworld = new Underworld(loadedGameState.seed, loadedGameState.RNGState);
  underworld.playerTurnIndex = loadedGameState.playerTurnIndex;
  underworld.levelIndex = loadedGameState.levelIndex;
  // Load all units that are not player's, those will be loaded indepentently
  underworld.units = loadedGameState.units
    // Player controlled units are loaded within the players array
    .filter((u) => u.unitType !== UnitType.PLAYER_CONTROLLED)
    .map(Unit.load);
  underworld.players = loadedGameState.players.map(Player.load);
  // Resort units by id since player units are loaded last
  underworld.units.sort((a, b) => a.id - b.id);
  underworld.pickups = loadedGameState.pickups.map(Pickup.load);
  // Filtering out the undefined ensures that this is an array of IObstacle
  underworld.obstacles = loadedGameState.obstacles.map(Obstacle.load).filter(o => !!o) as Obstacle.IObstacle[];

  underworld.setTurnPhase(underworld.turn_phase);

  underworld.cacheWalls();

  // Start the gameloop
  window.underworld.gameLoopUnits();

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
  if (underworld.turn_phase === turn_phase.PlayerTurns) {
    window.animatingSpells = true;
    await underworld.castCards(caster, payload.cards, payload, false);
    window.animatingSpells = false;
    // When spells are done animating but the mouse hasn't moved,
    // syncSpellEffectProjection needs to be called so that the icon ("footprints" for example)
    // will be shown in the tile that the mouse is hovering over
    syncSpellEffectProjection();
    // Check for dead players to end their turn,
    // this occurs here because spells may have caused their death
    for (let p of underworld.players) {
      // If a player's unit is dead, end their turn
      if (!p.unit.alive) {
        underworld.endPlayerTurn(p.clientId);
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
    window.pie.sendData({
      type: MESSAGE_TYPES.LOAD_GAME_STATE,
      underworld: underworld.serializeForSaving(),
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
        underworld: underworld.serializeForSaving(),
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
  // Client joined
  if (o.present) {
    // The host is always the first client
    window.hostClientId = clients[0];
    if (window.hostClientId === window.clientId) {
      console.log(`Setup: Setting Host client to ${window.hostClientId}. %c You are the host. `, 'background: #222; color: #bada55');
    } else {
      console.log(`Setup: Setting Host client to ${window.hostClientId}.`);
    }
  } else {
    // client left

    // If the underworld is already setup
    if (underworld) {
      const player = underworld.players.find(
        (p) => p.clientId === o.clientThatChanged,
      );
      // And if the client that left is associated with a player
      if (player) {
        // Disconnect the player and end their turn
        Player.setClientConnected(player, false);
        underworld.endPlayerTurn(player.clientId);
      } else {
        // this can occur naturally if a client disconnects before choosing
        // a character
      }
    }

    // if host left
    if (o.clientThatChanged === window.hostClientId) {
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
  if (window.allowCookies) {
    localStorage.setItem(
      savePrefix + title,
      JSON.stringify({
        underworld: window.underworld.serializeForSaving(),
      }),
    );
  } else {
    console.error('May not use this feature without accepting the cookie policy.');
  }
};
window.load = (title) => {
  if (window.allowCookies) {
    const savedGameString = localStorage.getItem(savePrefix + title);
    if (savedGameString) {
      const { underworld } = JSON.parse(savedGameString);
      window.pie.sendData({
        type: MESSAGE_TYPES.LOAD_GAME_STATE,
        underworld,
      });
    } else {
      console.error('no save game found with title', title);
    }
  } else {
    console.error('May not use this feature without accepting the cookie policy.');
  }
};

window.saveReplay = (title: string) => {
  if (window.allowCookies) {
    localStorage.setItem('golems-' + title, JSON.stringify(messageLog));
  } else {
    console.error('May not use this feature without accepting the cookie policy.');
  }
};
// Note, replay is currently broken
window.replay = (title: string) => {
  if (window.allowCookies) {
    const messages = JSON.parse(localStorage.getItem('golems-' + title) || '');
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      message.fromClient = underworld.players[0].clientId;
      onData(message);
    }
  } else {
    console.error('May not use this feature without accepting the cookie policy.');
  }
};
