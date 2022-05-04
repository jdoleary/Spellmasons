import type { ClientPresenceChangedArgs, OnDataArgs } from '@websocketpie/client';

import { MESSAGE_TYPES } from './MessageTypes';
import floatingText from './FloatingText';
import { getUpgradeByTitle } from './Upgrade';
import Underworld, { IUnderworldSerializedForSyncronize, LevelData, turn_phase } from './Underworld';
import * as Player from './Player';
import * as Unit from './Unit';
import * as Image from './Image';
import * as readyState from './readyState';
import * as messageQueue from './messageQueue';
import * as storage from './storage';
import { setView, View } from './views';
import { tutorialLevels } from './HandcraftedLevels';
import manBlue from './units/manBlue';
import { mouseMove } from './ui/eventListeners';
import { addPixiSprite, containerUnits } from './PixiUtils';
import { allUnits } from './units';

const messageLog: any[] = [];
let clients: string[] = [];
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
    case MESSAGE_TYPES.INIT_GAME_STATE:
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
      setView(View.Game);
      window.underworld.initLevel(0);
      console.log('Host: Send all clients game state for initial load');
      clients.forEach(clientId => {
        giveClientGameStateForInitialLoad(clientId);
      });
    } else {
      console.log('Start Game: Won\'t, game has already been started');
    }
  } else {
    console.log('Start Game: Won\'t, client must be host to start the game.')
  }
}
export async function startTutorial() {
  console.log('Game: Start Tutorial');
  await window.startSingleplayer();
  const p = Player.create(window.clientId, manBlue.id);
  if (p) {
    // Initialize the player for the level
    Player.resetPlayerForNextLevel(p);
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
    case MESSAGE_TYPES.CHANGE_CHARACTER:
      const player = window.underworld.players.find(p => p.clientId === fromClient)
      if (player) {
        const userSource = allUnits[payload.unitId];
        if (!userSource) {
          console.error('User unit source file not registered, cannot create player');
          return undefined;
        }
        // Update the player image
        player.unit.defaultImagePath = userSource.info.image;
        Unit.returnToDefaultSprite(player.unit);
      } else {
        console.error('Cannot change character, player not found with id', fromClient);
      }
      break;
    case MESSAGE_TYPES.SET_PHASE:
      const { phase, units, players } = payload as {
        phase: turn_phase,
        // Sync data for players
        players?: Player.IPlayerSerialized[],
        // Sync data for units
        units?: Unit.IUnitSerialized[],
      }

      if (players) {
        window.underworld.syncPlayers(players);
      }
      if (units) {
        window.underworld.syncUnits(units);
      }
      // Use the internal setTurnPhrase now that the desired phase has been sent
      // via the public setTurnPhase
      window.underworld._setTurnPhase(phase);
      break;
    case MESSAGE_TYPES.CREATE_LEVEL:
      const { level } = payload as {
        level: LevelData
      }
      console.log('sync: Syncing level');
      if (window.underworld) {
        window.underworld.createLevel(level);
      } else {
        console.error('Cannot sync level, no window.underworld exists')
      }

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
function handleLoadGameState(payload: {
  level: LevelData,
  underworld: IUnderworldSerializedForSyncronize,
  phase: turn_phase,
  units: Unit.IUnitSerialized[],
  players: Player.IPlayerSerialized[]
}) {
  console.log("Setup: Load game state", payload)
  const { level, underworld, phase, units, players } = payload
  // Sync underworld properties
  const loadedGameState: IUnderworldSerializedForSyncronize = { ...underworld };
  window.underworld = new Underworld(loadedGameState.seed, loadedGameState.RNGState);
  window.underworld.width = loadedGameState.width;
  window.underworld.height = loadedGameState.height;
  window.underworld.playerTurnIndex = loadedGameState.playerTurnIndex;
  window.underworld.levelIndex = loadedGameState.levelIndex;
  // Sync Level
  window.underworld.createLevel(level);

  // Sync units, players, and turn_phase
  if (units) {
    window.underworld.syncUnits(units);
  }
  if (players) {
    window.underworld.syncPlayers(players);
  }
  // lastUnitId must be synced AFTER all of the units are synced since the synced
  // units are id aware
  window.underworld.lastUnitId = loadedGameState.lastUnitId;
  // Use the internal setTurnPhrase now that the desired phase has been sent
  // via the public setTurnPhase
  window.underworld._setTurnPhase(phase);

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
function giveClientGameStateForInitialLoad(clientId: string) {
  // Only the host should be sending INIT_GAME_STATE messages
  // because the host has the canonical game state
  if (window.hostClientId === window.clientId) {
    // Do not send this message to self
    if (window.clientId !== clientId) {
      console.log(`Host: Send ${clientId} game state for initial load`);
      if (window.lastLevelCreated) {
        window.pie.sendData({
          type: MESSAGE_TYPES.INIT_GAME_STATE,
          level: window.lastLevelCreated,
          underworld: window.underworld.serializeForSyncronize(),
          phase: window.underworld.turn_phase,
          units: window.underworld.units.map(Unit.serialize),
          players: window.underworld.players.map(Player.serialize)
        }, {
          subType: "Whisper",
          whisperClientIds: [clientId],
        });
      } else {
        console.error('Could not send INIT_GAME_STATE, window.lastLevelCreated is undefined');
      }
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
      console.log(`Setup: Setting Host client to ${window.hostClientId}. You are the host. `);
      tryStartGame();
    } else {
      console.log(`Setup: Setting Host client to ${window.hostClientId}.`);
    }
    if (window.underworld) {

      // And if the client that joined is associated with a player
      if (playerOfClientThatChanged) {
        // set their connected status
        Player.setClientConnected(playerOfClientThatChanged, o.present);
      } else {
        // If the client that joined does not have a player yet, make them one immediately
        // since all clients should always have a player associated
        console.log(`Setup: Create a Player instance for ${o.clientThatChanged}`)
        const p = Player.create(o.clientThatChanged, 'jester');
        if (p) {
          Player.resetPlayerForNextLevel(p);
        }
      }
      // Send the lastest gamestate to that client so they can be up-to-date:
      // Note: It is important that this occurs AFTER the player instance is created for the
      // client who just joined
      // If the game has already started (e.g. the host has already joined), send the initial state to the new 
      // client only so they can load
      giveClientGameStateForInitialLoad(o.clientThatChanged);
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
        console.log(`Setup: Host client left, reassigning host to ${window.hostClientId}. % c You are the host. `, 'background: #222; color: #bada55');
      } else {
        console.log(`Setup: Host client left, reassigning host to ${window.hostClientId}.`);
      }
    }
  }
}

const savePrefix = 'spellmasons-save-';
window.getAllSaveFiles = () => Object.keys(localStorage).filter(x => x.startsWith(savePrefix)).map(x => x.substring(savePrefix.length));

window.save = (title) => {
  storage.set(
    savePrefix + title,
    JSON.stringify({
      level: window.lastLevelCreated,
      underworld: window.underworld.serializeForSyncronize(),
      phase: window.underworld.turn_phase,
      units: window.underworld.units.map(Unit.serialize),
      players: window.underworld.players.map(Player.serialize)
    }),
  );
};
window.load = async (title) => {
  const savedGameString = storage.get(savePrefix + title);
  if (savedGameString) {

    if (!readyState.get('underworld')) {
      await window.startSingleplayer();
    }

    const { level, underworld, phase, units, players } = JSON.parse(savedGameString);
    window.pie.sendData({
      type: MESSAGE_TYPES.LOAD_GAME_STATE,
      level,
      underworld,
      phase,
      units,
      players
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
