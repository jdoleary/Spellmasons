import type { ClientPresenceChangedArgs, OnDataArgs } from 'pie-client';

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
import { voteForLevel } from './overworld';
import { setRoute, Route } from './routes';
import { setView, View } from './views';
import * as readyState from './readyState';
import * as messageQueue from './messageQueue';

const messageLog: any[] = [];
let clients: string[] = [];
let underworld: Underworld;
export function initializeUnderworld() {
  underworld = new Underworld(Math.random().toString());
  // Since the game was just created,
  // move the game to the Overworld
  setRoute(Route.Overworld);
  // Mark the underworld as "ready"
  readyState.set('underworld', true);
}
let onCharacterSelectQueueContainer = messageQueue.makeContainer<OnDataArgs>();
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
    case MESSAGE_TYPES.VOTE_FOR_LEVEL:
      voteForLevel(fromClient, payload.levelIndex);
      break;
    case MESSAGE_TYPES.DESYNC:
      console.warn(`Client ${fromClient} detected desync from host`)
      // When a desync is detected, sync the clients 
      forceSyncClients();
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
      }
      break;
    case MESSAGE_TYPES.SELECT_CHARACTER:
      // Add this message to a queue, SELECT_CHARACTER messages shouldn't be processed until
      // the underworld is setup
      onCharacterSelectQueueContainer.queue.push(d);
      // If the underworld is already setup, process the onCharacterSelectQueue
      if (readyState.get("underworld")) {
        messageQueue.processNextInQueue(onCharacterSelectQueueContainer, handleSelectCharacter);
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
    case MESSAGE_TYPES.ASK_FOR_INIT_GAME_STATE:
      giveClientGameStateForInitialLoad(fromClient);
      break;
    case MESSAGE_TYPES.SYNC:
      const { players, units, underworldPartial } = payload;
      for (let i = 0; i < underworld.players.length; i++) {
        const syncPlayer = players[i]
        if (!syncPlayer) {
          console.error("Something is wrong, underworld has different length players than sync players")
          // Client incurred major desync, resolve via DESYNC message
          window.pie.sendData({ type: MESSAGE_TYPES.DESYNC });
        }
        Player.syncronize(syncPlayer, underworld.players[i]);
      }
      for (let i = 0; i < underworld.units.length; i++) {
        const syncUnit = units[i]
        if (!syncUnit) {
          console.error("Something is wrong, underworld has different length unit than sync units")
          // Client incurred major desync, resolve via DESYNC message
          window.pie.sendData({ type: MESSAGE_TYPES.DESYNC });
        }
        Unit.syncronize(syncUnit, underworld.units[i]);
      }
      underworld.syncronize(underworldPartial);
      break;
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      // Clean up old game state
      if (underworld) {
        underworld.cleanup();
      }
      handleLoadGameState(payload);
      break;
    case MESSAGE_TYPES.MOVE_PLAYER:
      if (caster) {
        await Unit.moveTowards(caster.unit, payload).then(() => {
          underworld.endPlayerTurn(caster.clientId);
        });
      } else {
        console.error('Cannot move player, caster does not exist');
      }
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
async function handleSelectCharacter(d: OnDataArgs) {
  console.log(`Setup: Select Character for client ${d.fromClient}`);
  const { payload, fromClient } = d;
  // If player doesn't already exist, make them
  if (!underworld.players.find((p) => p.clientId === fromClient)) {
    const p = Player.create(fromClient, payload.unitId);
    if (p) {
      underworld.players.push(p);
      // Sort underworld.players according to client order so that all
      // instances of the game have a underworld.players array in the same
      // order
      // --
      // (the .filter removes possible undefined players so that underworld.players doesn't contain any undefined values)
      underworld.players = clients.map(c => underworld.players.find(p => p.clientId == c)).filter(x => !!x) as Player.IPlayer[];
    } else {
      console.error("Failed to SelectCharacter because Player.create did not return a player object")
    }
  } else {
    console.error(
      'Client already has a character and cannot create a new one.',
    );
  }
}
function handleLoadGameState(payload: any) {
  console.log("Setup: Load game state", payload)
  // Resume game / load game / rejoin game
  const loadedGameState: Underworld = { ...payload.underworld };
  underworld = new Underworld(loadedGameState.seed, loadedGameState.RNGState);
  underworld.playerTurnIndex = loadedGameState.playerTurnIndex;
  underworld.level = loadedGameState.level;
  underworld.secondsLeftForTurn = loadedGameState.secondsLeftForTurn;
  window.hostClientId = loadedGameState.hostClientId;
  // Load all units that are not player's, those will be loaded indepentently
  underworld.units = loadedGameState.units
    // Player controlled units are loaded within the players array
    .filter((u) => u.unitType !== UnitType.PLAYER_CONTROLLED)
    .map(Unit.load);
  underworld.players = loadedGameState.players.map(Player.load);
  underworld.pickups = loadedGameState.pickups.map(Pickup.load);
  underworld.obstacles = loadedGameState.obstacles.map(Obstacle.load);
  // Mark the underworld as "ready"
  readyState.set('underworld', true);

  // Load route
  setRoute(payload.route);
  // If current client already has a player... (meaning they disconnected and rejoined)
  if (underworld.players.find((p) => p.clientId === window.clientId)) {
    // go to game view
    setView(View.Game);
  } else {
    // otherwise, go to character select
    setView(View.CharacterSelect);
  }
  // Proccess any CHARACTER_SELECT messages in the queue now that the underworld is setup
  messageQueue.processNextInQueue(onCharacterSelectQueueContainer, handleSelectCharacter);

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
function forceSyncClients() {
  // Only the host should be sending LOAD_GAME_STATE messages
  // because the host has the canonical game state
  if (window.hostClientId === window.clientId) {
    window.pie.sendData({
      type: MESSAGE_TYPES.LOAD_GAME_STATE,
      route: window.route,
      underworld: underworld.serializeForSaving(),
    });
  }
}
function giveClientGameStateForInitialLoad(clientId: string) {
  // Only the host should be sending INIT_GAME_STATE messages
  // because the host has the canonical game state
  if (window.hostClientId === window.clientId) {
    window.pie.sendData({
      type: MESSAGE_TYPES.INIT_GAME_STATE,
      subType: "Whisper",
      whisperClientIds: [clientId],
      route: window.route,
      underworld: underworld.serializeForSaving(),
    });
  }
}

export function onClientPresenceChanged(o: ClientPresenceChangedArgs) {
  console.log('clientPresenceChanged', o);
  clients = o.clients;
  // Client joined
  if (o.present) {
    if (o.clientThatChanged === window.clientId) {
      // All clients should join at the CharacterSelect screen so they can
      // choose their character.  Once they choose their character their
      // Player entity is created and then the messageQueue can begin processing
      // including LOAD_GAME_STATE.
      setView(View.CharacterSelect);
    }
    // The host is always the first client
    window.hostClientId = clients[0]
    console.log(`Setup: Setting Host client to ${window.hostClientId}. ${window.hostClientId === window.clientId ? 'you are the host.' : ''}`);
    // If the underworld doesn't exist, have the host setup the underworld
    if (window.hostClientId == window.clientId && !readyState.get("underworld")) {
      console.log("Setup: Initializing underworld as host");
      initializeUnderworld();
    }
    // Now that another client has joined the game
    // queue sending game state to other player so they can load:
    // The reason sending game state is queued and not sent immediately
    // is that if there's a game in progress you don't want to send the
    // state in the middle of an action (which could cause desyncs for
    // code that depends on promises such as resolveDoneMoving)
    onDataQueueContainer.queue.push({
      type: "Data",
      // This is the client that needs to be wispered to
      fromClient: o.clientThatChanged,
      time: new Date().getTime(),
      payload: {
        type: MESSAGE_TYPES.ASK_FOR_INIT_GAME_STATE,
      }

    })
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
      console.log(`Setup: Host client left, reassigning host to ${window.hostClientId}. ${window.hostClientId === window.clientId ? 'you are the host.' : ''}`);
    }
  }
}

window.save = (title) => {
  localStorage.setItem(
    'golems-save-' + title,
    JSON.stringify({
      underworld: window.underworld.serializeForSaving(),
      route: window.route,
    }),
  );
};
window.load = (title) => {
  const savedGameString = localStorage.getItem('golems-save-' + title);
  if (savedGameString) {
    const { underworld, route } = JSON.parse(savedGameString);
    window.pie.sendData({
      type: MESSAGE_TYPES.LOAD_GAME_STATE,
      route,
      underworld,
    });
  } else {
    console.error('no save game found with title', title);
  }
};

window.saveReplay = (title: string) => {
  localStorage.setItem('golems-' + title, JSON.stringify(messageLog));
};
// Note, replay is currently broken
window.replay = (title: string) => {
  const messages = JSON.parse(localStorage.getItem('golems-' + title) || '');
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    message.fromClient = underworld.players[0].clientId;
    onData(message);
  }
};
