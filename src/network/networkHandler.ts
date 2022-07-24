import type { OnDataArgs } from '@websocketpie/client';

import { MESSAGE_TYPES } from '../types/MessageTypes';
import floatingText from '../graphics/FloatingText';
import { getUpgradeByTitle } from '../Upgrade';
import Underworld, { IUnderworldSerializedForSyncronize, LevelData, turn_phase } from '../Underworld';
import * as Player from '../entity/Player';
import * as Unit from '../entity/Unit';
import * as messageQueue from '../messageQueue';
import * as storage from '../storage';
import { allUnits } from '../entity/units';
import { typeGuardHostApp } from './networkUtil';

const messageLog: any[] = [];
export const NO_LOG_LIST = [MESSAGE_TYPES.PING, MESSAGE_TYPES.PLAYER_THINKING];
export const HANDLE_IMMEDIATELY = [MESSAGE_TYPES.PING, MESSAGE_TYPES.PLAYER_THINKING];
export function onData(d: OnDataArgs, underworld: Underworld) {
  if (!NO_LOG_LIST.includes(d.payload.type)) {
    // Don't clog up server logs with payloads, leave that for the client which can handle them better
    console.log("onData:", MESSAGE_TYPES[d.payload.type], globalThis.headless ? '' : d)
  }
  // Temporarily for development
  // TODO: Remove for production, messageLog will take
  // up a lot of memory for real games
  messageLog.push(d);

  const { payload } = d;
  const type: MESSAGE_TYPES = payload.type;
  switch (type) {
    case MESSAGE_TYPES.PING:
      floatingText({
        coords: payload,
        text: '🎈',
      });
      break;
    case MESSAGE_TYPES.INIT_GAME_STATE:
      // If the underworld is not yet initialized for this client then
      // load the game state
      // INIT_GAME_STATE is only to be handled by clients who just
      // connected to the room and need the first transfer of game state
      // This is why it is okay that updating the game state happens 
      // asynchronously.
      if (underworld.lastLevelCreated === undefined) {
        // If a client loads a full game state, they should be fully synced
        // so clear the onDataQueue to prevent old messages from being processed
        // after the full gamestate sync
        onDataQueueContainer.queue = [d];
        handleLoadGameState(payload, underworld);
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
      processNextInQueueIfReady(underworld);
      break;
    default:
      // MESSAGE_TYPES in HANDLE_IMMEDIATELY are not to be queued and can be processed
      // as soon as they are received.
      if (Object.values(HANDLE_IMMEDIATELY).includes(d.payload.type)) {
        handleOnDataMessage(d, underworld)
      } else {
        // All other messages should be handled one at a time to prevent desync
        handleOnDataMessageSyncronously(d, underworld);
      }
      break;
  }
}
let onDataQueueContainer = messageQueue.makeContainer<OnDataArgs>();
// Waits until a message is done before it will continue to process more messages that come through
// This ensures that players can't move in the middle of when spell effects are occurring for example.
function handleOnDataMessageSyncronously(d: OnDataArgs, underworld: Underworld) {
  // Queue message for processing one at a time
  onDataQueueContainer.queue.push(d);
  // 10 is an arbitrary limit which will report that something may be wrong
  // because it's unusual for the queue to get this large
  if (onDataQueueContainer.queue.length > 10) {
    console.warn("onData queue is growing unusually large: ", onDataQueueContainer.queue.length, "stuck on message: ", MESSAGE_TYPES[currentlyProcessingOnDataMessage.payload.type], currentlyProcessingOnDataMessage, 'Payload Types:', onDataQueueContainer.queue.map(x => MESSAGE_TYPES[x.payload.type]));
  }
  // process the "next" (the one that was just added) immediately
  processNextInQueueIfReady(underworld);
}
// currentlyProcessingOnDataMessage is used to help with bug reports to show
// which message is stuck and didn't finish being processed.
let currentlyProcessingOnDataMessage: any = null;
export function processNextInQueueIfReady(underworld: Underworld) {
  // If game is ready to process messages, begin processing
  // (if not, they will remain in the queue until the game is ready)
  if (underworld) {
    messageQueue.processNextInQueue(onDataQueueContainer, d => handleOnDataMessage(d, underworld));
  } else {
    console.error('underworld is undefined. This should never occur.')
  }
}
async function handleOnDataMessage(d: OnDataArgs, underworld: Underworld): Promise<any> {
  underworld.processedMessageCount++;
  currentlyProcessingOnDataMessage = d;
  const { payload, fromClient } = d;
  const type: MESSAGE_TYPES = payload.type;
  if (!NO_LOG_LIST.includes(type)) {
    // Don't clog up server logs with payloads, leave that for the client which can handle them better
    console.log("Handle ONDATA", underworld.processedMessageCount, MESSAGE_TYPES[type], globalThis.headless ? '' : payload)
  }
  // Get player of the client that sent the message 
  const fromPlayer = underworld.players.find((p) => p.clientId === fromClient);
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
    //     underworld.pie.sendData({
    //       type: MESSAGE_TYPES.DESYNC
    //     });
    //   }
    //   break;
    case MESSAGE_TYPES.PLAYER_THINKING:
      const thinkingPlayer = underworld.players.find(p => p.clientId === fromClient)
      if (thinkingPlayer && thinkingPlayer != globalThis.player) {
        underworld.playerThoughts[thinkingPlayer.clientId] = payload;
      }
      break;
    case MESSAGE_TYPES.CHANGE_CHARACTER:
      const player = underworld.players.find(p => p.clientId === fromClient)
      if (player) {
        const userSource = allUnits[payload.unitId];
        if (!userSource) {
          console.error('User unit source file not registered, cannot create player');
          return undefined;
        }
        player.unit.unitSourceId = payload.unitId;
        // Update the player image
        player.unit.defaultImagePath = userSource.info.image;
        Unit.returnToDefaultSprite(player.unit);
      } else {
        console.error('Cannot change character, player not found with id', fromClient);
        // TODO: This should request a unit and player sync
      }
      break;
    case MESSAGE_TYPES.REQUEST_SYNC_PLAYERS:
      // If host, send sync; if non-host, ignore 
      if (globalThis.isHost(underworld.pie)) {
        console.log('Host: Sending SYNC_PLAYERS')
        const message = {
          type: MESSAGE_TYPES.SYNC_PLAYERS,
          players: underworld.players.map(Player.serialize)
        }
        if (underworld.pie) {
          underworld.pie.sendData(message);
        } else {
          console.error('Cannot send SYNC_PLAYERS, underworld.pie is undefined')
        }
      }
      break;
    case MESSAGE_TYPES.SYNC_PLAYERS:
      {
        const { players } = payload as {
          // Sync data for players
          players?: Player.IPlayerSerialized[],
        }
        if (players) {
          underworld.syncPlayers(players);
        }
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

      if (units) {
        underworld.syncUnits(units);
      }
      // Note: Players should sync after units so
      // that the player.unit reference is synced
      // with up to date units
      if (players) {
        underworld.syncPlayers(players);
      }
      // Use the internal setTurnPhrase now that the desired phase has been sent
      // via the public setTurnPhase
      await underworld.initializeTurnPhase(phase);
      break;
    case MESSAGE_TYPES.CREATE_LEVEL:
      const { level } = payload as {
        level: LevelData
      }
      console.log('sync: Syncing level');
      if (underworld) {
        await underworld.createLevel(level);
      } else {
        console.error('Cannot sync level, no underworld exists')
      }

      break;
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      // Clean up old game state
      if (underworld) {
        underworld.cleanup();
      }
      handleLoadGameState(payload, underworld);
      break;
    case MESSAGE_TYPES.ENTER_PORTAL:
      if (fromPlayer) {
        Player.enterPortal(fromPlayer, underworld);
      } else {
        console.error('Recieved ENTER_PORTAL message but "caster" is undefined')
      }
      break;
    case MESSAGE_TYPES.MOVE_PLAYER:
      if (fromPlayer == globalThis.player) {
        // Do not do anything, own player movement is handled locally
        // so that it is smooth
        break;
      }
      if (fromPlayer) {
        await Unit.moveTowards(fromPlayer.unit, payload, underworld).then(() => {
          if (fromPlayer.unit.path?.points.length && fromPlayer.unit.stamina == 0) {
            // If they do not reach their destination, notify that they are out of stamina
            floatingText({
              coords: fromPlayer.unit,
              text: 'Out of Stamina!'
            });
          }
          // Clear player unit path when they are done moving so they get
          // to choose a new path next turn
          fromPlayer.unit.path = undefined;
        });
      } else {
        console.error('Cannot move player, caster does not exist');
      }
      break;
    case MESSAGE_TYPES.SPELL:
      if (fromPlayer) {
        await handleSpell(fromPlayer, payload, underworld);
      } else {
        console.error('Cannot cast, caster does not exist');
      }
      break;
    case MESSAGE_TYPES.CHOOSE_UPGRADE:
      const upgrade = getUpgradeByTitle(payload.upgrade.title);
      if (fromPlayer && upgrade) {
        underworld.chooseUpgrade(fromPlayer, upgrade);
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
        underworld.endPlayerTurn(fromPlayer.clientId);
      } else {
        console.error('Unable to end turn because caster is undefined');
      }
      break;
  }
}
async function handleLoadGameState(payload: {
  level: LevelData,
  underworldSerialized: IUnderworldSerializedForSyncronize,
  phase: turn_phase,
  units: Unit.IUnitSerialized[],
  players: Player.IPlayerSerialized[]
}, underworld: Underworld) {
  console.log("Setup: Load game state", payload)
  const { level, underworldSerialized: payloadUnderworld, phase, units, players } = payload
  // Sync underworld properties
  const loadedGameState: IUnderworldSerializedForSyncronize = { ...payloadUnderworld };
  underworld.levelIndex = loadedGameState.levelIndex;

  underworld.seed = loadedGameState.seed;
  if (loadedGameState.RNGState) {
    underworld.syncronizeRNG(loadedGameState.RNGState);
  }
  underworld.turn_phase = loadedGameState.turn_phase;
  underworld.turn_number = loadedGameState.turn_number;
  underworld.processedMessageCount = loadedGameState.processedMessageCount;
  underworld.cardDropsDropped = loadedGameState.cardDropsDropped;
  underworld.enemiesKilled = loadedGameState.enemiesKilled;

  // Sync Level.  Must await createLevel since it uses setTimeout to ensure that
  // the DOM can update with the "loading..." message before locking up the CPU with heavy processing.
  // This is important so that createLevel runs BEFORE loading units and syncing Players
  // Note: createLevel syncronizes a bunch of underworld properties; for example it invokes cache_walls.
  // Check if carefully befor manually syncronizing properties
  await underworld.createLevel(level);

  // Load units
  if (units) {
    // Clean up previous units if they exist
    underworld.units.map(Unit.cleanup)

    underworld.units = units.map(u => Unit.load(u, underworld, false));
  }
  // Note: Players should sync after units are loaded so
  // that the player.unit reference is synced
  // with up to date units
  if (players) {
    underworld.syncPlayers(players);
  }
  // lastUnitId must be synced AFTER all of the units are synced since the synced
  // units are id aware
  underworld.lastUnitId = loadedGameState.lastUnitId;
  // Set the turn_phase; do not use initializeTurnPhase
  // because that function runs initialization logic that would
  // make the loaded underworld desync from the host's underworld
  underworld.setTurnPhase(phase);

  underworld.syncTurnMessage();

}
async function handleSpell(caster: Player.IPlayer, payload: any, underworld: Underworld) {
  if (typeof payload.x !== 'number' || typeof payload.y !== 'number') {
    console.error('Spell is invalid, it must have coordinates');
    return;
  }

  // TODO: Keep this around for when we have one-use cards
  // Card.removeCardsFromHand(caster, payload.cards);

  // Only allow casting during the PlayerTurns phase
  if (underworld.turn_phase === turn_phase.PlayerTurns) {
    globalThis.animatingSpells = true;
    let animationKey = 'playerAttackLarge';
    if (payload.cards.length < 3) {
      animationKey = 'playerAttackSmall';
    } else if (payload.cards.length < 5) {
      animationKey = 'playerAttackMedium';
    }
    const keyMoment = () => underworld.castCards(caster.cardUsageCounts, caster.unit, payload.cards, payload, false, false);
    await Unit.playComboAnimation(caster.unit, animationKey, keyMoment, { animationSpeed: 0.2, loop: false });
    globalThis.animatingSpells = false;
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

export function setupNetworkHandlerGlobalFunctions(underworld: Underworld) {


  const savePrefix = 'spellmasons-save-';
  globalThis.getAllSaveFiles = () => Object.keys(localStorage).filter(x => x.startsWith(savePrefix)).map(x => x.substring(savePrefix.length));

  globalThis.save = (title: string) => {
    storage.set(
      savePrefix + title,
      JSON.stringify({
        level: underworld.lastLevelCreated,
        underworld: underworld.serializeForSyncronize(),
        phase: underworld.turn_phase,
        units: underworld.units.map(Unit.serialize),
        players: underworld.players.map(Player.serialize)
      }),
    );
  };
  globalThis.load = async (title: string) => {
    const savedGameString = storage.get(savePrefix + title);
    if (savedGameString) {

      await globalThis.startSingleplayer?.();

      const { level, underworld: savedUnderworld, phase, units, players } = JSON.parse(savedGameString);
      underworld.pie.sendData({
        type: MESSAGE_TYPES.LOAD_GAME_STATE,
        level,
        underworld: savedUnderworld,
        phase,
        units,
        players
      });

    } else {
      console.error('no save game found with title', title);
    }
  };

  globalThis.saveReplay = (title: string) => {
    storage.set('golems-' + title, JSON.stringify(messageLog));
  };
  globalThis.exitCurrentGame = function exitCurrentGame(): Promise<void> {
    // Go back to the main PLAY menu
    globalThis.setMenu?.('PLAY');
    if (underworld) {
      underworld.cleanup();
    }
    return typeGuardHostApp(underworld.pie) ? Promise.resolve() : underworld.pie.disconnect();
  }
  // TODO, replay is currently broken
  // globalThis.replay = (title: string) => {
  //   const messages = JSON.parse(storage.get('golems-' + title) || '[]');
  //   for (let i = 0; i < messages.length; i++) {
  //     const message = messages[i];
  //     message.fromClient = underworld.players[0].clientId;
  //     onData(message);
  //   }
  // };

}