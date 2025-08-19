import type { OnDataArgs } from '@websocketpie/client';

import { MESSAGE_TYPES } from '../types/MessageTypes';
import * as Image from '../graphics/Image';
import floatingText from '../graphics/FloatingText';
import { getUpgradeByTitle } from '../Upgrade';
import Underworld, { elUpgradePickerContent, IUnderworldSerialized, LevelData, showUpgradesClassName, turn_phase } from '../Underworld';
import * as Player from '../entity/Player';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import * as messageQueue from '../messageQueue';
import * as storage from '../storage';
import * as config from '../config';
import * as Cards from '../cards';
import * as Chat from '../graphics/ui/Chat';
import * as colors from '../graphics/ui/colors';
import { allUnits } from '../entity/units';
import { hostGiveClientGameState, typeGuardHostApp } from './networkUtil';
import { skyBeam } from '../VisualEffects';
import { tryFallInOutOfLiquid } from '../entity/Obstacle';
import { removePickup } from '../entity/Pickup';
import { triggerAdminCommand } from '../graphics/ui/eventListeners';
import { clone, Vec2 } from '../jmath/Vec';
import pingSprite from '../graphics/Ping';
import { clearLastNonMenuView, setView } from '../views';
import { View } from '../View';
import { autoExplain, explain, EXPLAIN_END_TURN, tutorialCompleteTask } from '../graphics/Explain';
import { cacheBlood, cameraAutoFollow, getCameraCenterInGameSpace, getZoom, PixiSpriteOptions, setCamera, startScreenshake } from '../graphics/PixiUtils';
import { ensureAllClientsHaveAssociatedPlayers, Overworld, recalculateGameDifficulty } from '../Overworld';
import { playerCastAnimationColor, playerCastAnimationColorLighter, playerCastAnimationGlow } from '../graphics/ui/colors';
import { lightenColor } from '../graphics/ui/colorUtil';
import { runPredictions } from '../graphics/PlanningView';
import seedrandom from 'seedrandom';
import { getUniqueSeedString, SeedrandomState } from '../jmath/rand';
import { setPlayerNameUI } from '../PlayerUtils';
import { GameMode, WizardType } from '../types/commonTypes';
import { getSpellThumbnailPath, recalcPositionForCards, renderRunesMenu } from '../graphics/ui/CardUI';
import { isSinglePlayer } from './wsPieSetup';
import { elEndTurnBtn } from '../HTMLElements';
import { sendEventToServerHub } from '../RemoteLogging';
import { raceTimeout } from '../Promise';
import { teleport } from '../effects/teleport';
import Events from '../Events';
import { mergeExcessPickups, mergeExcessUnits } from '../stability';
import { distance, lerp } from '../jmath/math';
import PiePeer from './PiePeer';
import { GORU_ATTACK_IMAGE_PATH, GORU_DEFAULT_IMAGE_PATH, GORU_UNIT_ID } from '../entity/units/goru';
import { visualPolymorphPlayerUnit } from '../cards/polymorph';
import { spellmasonUnitId } from '../entity/units/playerUnit';
import { makeManaTrail, removeFloatingParticlesFor } from '../graphics/Particles';
import { test_ignorePromiseSpy } from '../promiseSpy';

export const NO_LOG_LIST = [MESSAGE_TYPES.PREVENT_IDLE_TIMEOUT, MESSAGE_TYPES.PING, MESSAGE_TYPES.PLAYER_THINKING, MESSAGE_TYPES.MOVE_PLAYER, MESSAGE_TYPES.SET_PLAYER_POSITION, MESSAGE_TYPES.PEER_PING, MESSAGE_TYPES.PEER_PONG];
export const HANDLE_IMMEDIATELY = [MESSAGE_TYPES.PREVENT_IDLE_TIMEOUT, MESSAGE_TYPES.PING, MESSAGE_TYPES.PLAYER_THINKING, MESSAGE_TYPES.MOVE_PLAYER, MESSAGE_TYPES.SET_PLAYER_POSITION,
MESSAGE_TYPES.PEER_PING, MESSAGE_TYPES.PEER_PONG, MESSAGE_TYPES.GET_PLAYER_CONFIG, MESSAGE_TYPES.KICKED_FROM_PEER_LOBBY, MESSAGE_TYPES.PEER_VOLUNTARY_DISCONNECT
];
export const elInstructions = document.getElementById('instructions') as (HTMLElement | undefined);
export function onData(d: OnDataArgs, overworld: Overworld) {
  const { payload, fromClient } = d;
  if (!NO_LOG_LIST.includes(d.payload.type)) {
    // Don't clog up server logs with payloads, leave that for the client which can handle them better
    try {
      //console.log("Recieved onData:", MESSAGE_TYPES[d.payload.type], globalThis.headless ? '' : JSON.stringify(d))
      if (overworld.underworld && globalThis.headless) {
        try {
          const startTime = payload.type == MESSAGE_TYPES.INIT_GAME_STATE ? Date.now() : undefined;
          sendEventToServerHub({
            startTime,
            events: [{
              time: Date.now(),
              message: JSON.stringify({ _type: MESSAGE_TYPES[payload.type], ...payload })
            }]
          }, overworld.underworld);
        } catch (e) {
          console.error('Could not send event to server', e);
        }
      }
    } catch (e) {
      console.warn('Prevent error due to Stringify:', e);
    }
  }
  const type: MESSAGE_TYPES = payload.type;
  const { underworld } = overworld;
  if (!underworld) {
    console.error('Cannot process onData, underworld does not exist');
    return;
  }

  const fromPlayer = getFromPlayerViaClientId(fromClient, underworld);
  // If we have recieved a message from the player, then the player is connected
  if (fromPlayer && !fromPlayer.clientConnected && overworld.pie instanceof PiePeer) {
    Player.setClientConnected(fromPlayer, true, underworld)
  }
  switch (type) {
    case MESSAGE_TYPES.CHAT_SENT: {
      const { message } = payload;
      Chat.ReceiveMessage(fromPlayer, message);
      break;
    }
    case MESSAGE_TYPES.VIEWING_INVENTORY: {
      // Show animation when spellmason is viewing inventory
      if (fromPlayer) {
        const { isOpen } = payload;
        if (isOpen) {
          Player.setSpellmasonsToChannellingAnimation(fromPlayer);
        } else {
          Player.setSpellmasonsToChannellingAnimationClose(fromPlayer);
        }
      }
      break;
    }
    case MESSAGE_TYPES.PLAYER_THINKING: {
      const thinkingPlayer = fromPlayer;
      if (thinkingPlayer && thinkingPlayer != globalThis.player) {
        const thought = underworld.playerThoughts[thinkingPlayer.playerId];
        // Default the currentDrawLocation to target if it doesn't already exist
        // Clear currentDrawLocation if thought contains no cardIds
        const currentDrawLocation = thought && thought.cardIds.length == 0 ? undefined : thought?.currentDrawLocation || payload.target
        // When a new thought comes in, reset the lerp value so the currentDrawLocation will smoothly animate to the new target
        underworld.playerThoughts[thinkingPlayer.playerId] = { ...payload, currentDrawLocation, lerp: 0 };
      }
      break;
    }
    case MESSAGE_TYPES.CLIENT_SEND_PLAYER_TO_SERVER: {
      // This message is only ever handled by the host.  It is for the client
      // to send it's Player state to the host because the client is the source of truth for the player object
      // Do NOT process this message for hotseat or else it will may overwrite a player https://github.com/jdoleary/Spellmasons/issues/198
      if (isHost(overworld.pie) && overworld.underworld && globalThis.numberOfHotseatPlayers == 1) {
        const { player } = payload;
        const foundPlayerIndex = overworld.underworld.players.findIndex(p => p.playerId == player.playerId);
        if (exists(foundPlayerIndex)) {
          // Report Differences to evaluate where client server player desyncs are ocurring
          const currentPlayer = overworld.underworld.players[foundPlayerIndex];
          if (currentPlayer) {
            const currentPlayerSerialized = Player.serialize(currentPlayer);
            for (let key of new Set([...Object.keys(currentPlayerSerialized), ...Object.keys(player)])) {
              // @ts-ignore: No index signature with a parameter of type 'string' was found on type 'IPlayerSerialized'.
              // This is fine because we're just checking inequality to report desyncs
              if (JSON.stringify(currentPlayerSerialized[key]) != JSON.stringify(player[key])) {
                // @ts-ignore: No index signature with a parameter of type 'string' was found on type 'IPlayerSerialized'.
                // This is fine because we're just checking inequality to report desyncs
                console.error(`CLIENT_SEND_PLAYER_TO_SERVER property desync: property:${key}, host:${currentPlayerSerialized[key]}, client:${player[key]}`);
              }
            }
          }
          // End Report Differences to evaluate where client server player desyncs are ocurring

          // Host loads player data from client to syncronize the state
          Player.load(player, foundPlayerIndex, overworld.underworld, false);
        }
      }
      break;
    }
    case MESSAGE_TYPES.SET_GAME_MODE: {
      const { gameMode } = payload;
      if (underworld.levelIndex <= 1) {
        underworld.gameMode = gameMode;
        // Must be called when difficulty (gameMode) changes to update summon spell stats
        Cards.refreshSummonCardDescriptions(underworld);
        recalculateGameDifficulty(underworld);
        // Regenerate level data with new game mode information
        underworld.generateLevelData(underworld.levelIndex);

        // @ts-ignore
        if (globalThis.rerenderGameDifficultyButtons) {
          // @ts-ignore
          globalThis.rerenderGameDifficultyButtons();
        }
        console.log('gamemode set to: "', gameMode, '"');
      } else {
        Jprompt({ text: 'Cannot change difficulty for an ongoing game', yesText: 'Okay', forceShow: true });
      }
      break;
    }
    case MESSAGE_TYPES.SET_MODS: {
      const { activeMods } = payload;
      if (activeMods) {
        underworld.activeMods = activeMods;
      }
      break;
    }
    case MESSAGE_TYPES.JOIN_GAME_AS_PLAYER: {
      const { asPlayerClientId } = payload;
      joinGameAsPlayer(fromClient, asPlayerClientId, overworld);
      break;
    }
    case MESSAGE_TYPES.FORCE_TRIGGER_PICKUP: {
      const { pickupId, pickupName, unitId, collidedPlayerId } = payload;
      let pickup = underworld.pickups.find(p => p.id == pickupId);
      const unit = underworld.units.find(u => u.id == unitId);
      // Important: This is NOT fromPlayer
      // this is the optional player that collided with the pickup
      const player = underworld.players.find(p => p.playerId == collidedPlayerId);
      if (pickup) {
        if (pickup.name !== pickupName) {
          console.error("FORCE_TRIGGER_PICKUP: pickup name is desynced", pickup.name, pickupName);
        }
        if (unit) {
          Pickup.triggerPickup(pickup, unit, player, underworld, false);
        } else {
          console.error('Force trigger pickup failed, unit is undefined');
        }
      } else {
        console.error('Force trigger pickup failed, pickup is undefined');
      }
    }
      break;
    case MESSAGE_TYPES.QUEUE_PICKUP_TRIGGER:
      // QUEUE_PICKUP_TRIGGER is only for clients, the headless server triggers pickups
      // as soon as they are touched and is the source of truth on what pickups are touched
      // Also this should be ignored by single player host
      if (globalThis.isHost(underworld.pie)) {
        return;
      }
      const { pickupId, pickupName, unitId } = payload;
      let pickup = underworld.pickups.find(p => p.id == pickupId);
      const unit = underworld.units.find(u => u.id == unitId);
      if (!pickup) {
        const pickupSource = Pickup.pickups.find(p => p.name == pickupName);
        if (pickupSource) {
          console.log('pickups:', underworld.pickups.map(p => `${p.id},${p.name}`), 'pickupId:', pickupId)
          console.error('Attempted to aquire pickup but could not find it in list, creating one to aquire', pickupName);
          pickup = Pickup.create({ pos: { x: -1000, y: -1000 }, pickupSource, logSource: 'QUEUE_PICKUP_TRIGGER force create' }, underworld, false);
        } else {
          console.error(`Pickup source not found for name: ${pickupName}`)
        }
      }
      // note: player is optionally undefined, but pickup and unit are required
      if (pickup) {
        if (unit) {
          // Place it in the queue, server sees that unit has touched pickup but animations are still happening locally
          // and the unit hasn't collided with the pickup yet, placing it in the queue will allow the unit to pickup
          // the pickup once it touches
          underworld.aquirePickupQueue.push({ pickupId: pickup.id, unitId: unit.id, timeout: Date.now() + 3000, flaggedForRemoval: false });
        } else {
          console.log('units:', underworld.units.map(u => u.id), 'UnitId:', unitId);
          console.error('Attempted to aquire pickup but could not find unit');
        }
      } else {
        console.log('pickups:', underworld.pickups.map(p => `${p.id},${p.name}`), 'pickupId:', pickupId)
        console.error('Attempted to aquire pickup but could not find it in list');
      }
      break;
    case MESSAGE_TYPES.CHOOSE_RUNE:
      {
        const { stat } = payload;
        if (stat) {
          if (fromPlayer) {
            underworld.upgradeRune(stat, fromPlayer, payload);
            if (fromPlayer === globalThis.player) {
              tutorialCompleteTask('spendUpgradePoints');
              // Some runes may change player's stats, so sync the UI
              Unit.syncPlayerHealthManaUI(underworld);
            }
          } else {
            console.error('CHOOSE_RUNE, missing fromPlayer', fromClient);
          }
        } else {
          console.error('Missing stat in payload', payload);
        }
        break;
      }
    case MESSAGE_TYPES.LOCK_RUNE:
      {
        const { key, index } = payload;
        if (key) {
          if (fromPlayer) {
            const preexistingIndex = fromPlayer.lockedRunes.findIndex(lr => lr.key === key);
            const preexistingLockedRune = fromPlayer.lockedRunes[preexistingIndex];
            if (preexistingLockedRune) {
              if (exists(preexistingLockedRune.runePresentedIndexWhenLocked)) {
                // Relock it
                delete preexistingLockedRune.runePresentedIndexWhenLocked;
              } else {
                // unlocked rune will be removed after the current level.
                // This ensures that the rune list remains stable when runes are locked and unlocked
                preexistingLockedRune.runePresentedIndexWhenLocked = fromPlayer.runePresentedIndex;
              }
            } else {
              fromPlayer.lockedRunes.push({ index: parseInt(index), key });
            }
            renderRunesMenu(underworld);
          } else {
            console.error('LOCK_RUNE, missing fromPlayer', fromClient);
          }
        } else {
          console.error('Missing LOCK_RUNE key in payload', payload);
        }
        break;
      }
    case MESSAGE_TYPES.PING:
      if (fromPlayer) {
        pingSprite({ coords: payload as Vec2, color: fromPlayer.color });
      }
      break;
    case MESSAGE_TYPES.INIT_GAME_STATE:
      // This is executed on all clients, even ones that ignore the 
      // message due to logic below because if one client updates
      // the seed state, they all must in order to stay in sync
      // --
      // Update the seed (this MUST come before syncronizeRNG)
      if (payload.underworld) {
        underworld.seed = payload.underworld.seed;
        // Now sync the seed-based RNG state
        if (payload.RNGState) {
          underworld.syncronizeRNG(payload.underworld.RNGState);
        }
      }
      // If the underworld is not yet initialized for this client then
      // load the game state
      // INIT_GAME_STATE is only to be handled by clients who just
      // connected to the room and need the first transfer of game state
      // This is why it is okay that updating the game state happens 
      // asynchronously.
      // or in the case of allowForceInitGameState, clients who have reconnected
      if (underworld.allowForceInitGameState || isNullOrUndef(underworld.lastLevelCreated)) {
        underworld.allowForceInitGameState = false;
        // If a client loads a full game state, they should be fully synced
        // so clear the onDataQueue to prevent old messages from being processed
        // after the full gamestate sync
        onDataQueueContainer.queue = [d];
        processNextInQueueIfReady(overworld);
      } else {
        console.log('Ignoring INIT_GAME_STATE because underworld has already been initialized.');
      }
      break;
    case MESSAGE_TYPES.DEATHMASON_DISCARD_CARDS: {
      if (fromPlayer && overworld.underworld) {
        const countDiscard = Player.discardCards(fromPlayer, overworld.underworld, { dryRun: true });
        if (payload.countDiscard == countDiscard) {
          if (payload.drawChargesSeed !== underworld) {
            fromPlayer.drawChargesSeed = payload.drawChargesSeed;
          }
          Player.discardCards(fromPlayer, overworld.underworld, {});
          const drawNew = Math.floor(countDiscard / config.DEATHMASON_DISCARD_DRAW_RATIO);
          Unit.drawCharges(fromPlayer.unit, overworld.underworld, drawNew);
        } else {
          console.warn('Ignoring incorrect discard message')
        }
      }
      break;
    }
    case MESSAGE_TYPES.DEATHMASON_LOCK_DISCARD_CARDS:
      // This is only to sync with a client sending their state to the host.
      // No need to update your own or you may clobber more recent changes
      if (fromPlayer && fromPlayer !== globalThis.player) {
        const { lockedDiscardCards } = payload;
        fromPlayer.lockedDiscardCards = lockedDiscardCards;
      }
      break;
    case MESSAGE_TYPES.COLLECT_SOULS:
      if (fromPlayer) {

        const { victim_unit_id, soulFragments } = payload;
        const victim = underworld.units.find(u => u.id == victim_unit_id);
        if (!victim) {
          console.warn('Missing unit id: ' + victim_unit_id);
          console.error('attempted to collect souls but could not find unit by id');
          return;
        }
        if (victim.soulFragments != soulFragments) {
          console.error('COLLECT_SOULS desync soulFragments count');
          return;
        }

        const soulPositions = removeFloatingParticlesFor(victim);
        victim.soulFragments = 0;
        victim.soulsBeingCollected = false;
        // If a goru killed the unit that goru get's all the souls
        const colorStart = '#d9fff9';
        const colorEnd = '#566d70';
        fromPlayer.unit.soulFragments += soulFragments;
        globalThis.totalSoulTrails = Math.max(0, globalThis.totalSoulTrails || 0);
        globalThis.totalSoulTrails += soulFragments;
        for (let i = 0; i < soulFragments; i++) {
          const promise = makeManaTrail(soulPositions[i] || victim, fromPlayer.unit, underworld, colorStart, colorEnd, globalThis.totalSoulTrails).then(() => {
            globalThis.totalSoulTrails--;

            playSFXKey('soulget');
            if (player == fromPlayer) {
              floatingText({ coords: fromPlayer.unit, text: `+ 1 ${i18n('soul fragments')}`, aggregateMatcher: /\d+/ });
            }
          });
          test_ignorePromiseSpy(promise);
        }
      }

      break;
    case MESSAGE_TYPES.CHOOSE_UPGRADE:
      console.log('onData: CHOOSE_UPGRADE', `${fromClient}: ${payload?.upgrade?.title}`);
      if (fromPlayer) {
        const upgrade = getUpgradeByTitle(payload.upgrade.title);
        if (upgrade) {
          underworld.chooseUpgrade(fromPlayer, upgrade);
          if (fromPlayer === globalThis.player) {
            playSFXKey('levelUp');
          }
        } else {
          console.error(
            'Cannot CHOOSE_UPGRADE, upgrade does not exist',
            payload.upgrade.title,
          );
        }
      } else {
        console.error('Cannot CHOOSE_UPGRADE, fromPlayer is undefined', fromClient, fromPlayer)
      }
      break;
    case MESSAGE_TYPES.SKIP_UPGRADE:
      if (fromPlayer && payload.spCost) {
        fromPlayer.skippedCards += 1;
        fromPlayer.statPointsUnspent += payload.spCost
        // If there are more upgrades to be had, show them
        if (globalThis.player == fromPlayer) {
          underworld.showUpgrades();
          playSFXKey('levelUp');

        }
      }
      break;
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      // If a client loads a full game state, they should be fully synced
      // so clear the onDataQueue to prevent old messages from being processed
      onDataQueueContainer.queue = [d];
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
      processNextInQueueIfReady(overworld);
      break;
    default:
      // MESSAGE_TYPES in HANDLE_IMMEDIATELY are not to be queued and can be processed
      // as soon as they are received.
      if (Object.values(HANDLE_IMMEDIATELY).includes(d.payload.type)) {
        handleOnDataMessage(d, overworld).catch(e => {
          console.error('handled: Error in immediate handleOnDataMessage:', e);
        })
      } else {
        // All other messages should be handled one at a time to prevent desync
        handleOnDataMessageSyncronously(d, overworld);
      }
      break;
  }
}
let onDataQueueContainer = messageQueue.makeContainer<OnDataArgs>();
// Waits until a message is done before it will continue to process more messages that come through
// This ensures that players can't move in the middle of when spell effects are occurring for example.
function handleOnDataMessageSyncronously(d: OnDataArgs, overworld: Overworld) {
  // Queue message for processing one at a time
  onDataQueueContainer.queue.push(d);
  // 10 is an arbitrary limit which will report that something may be wrong
  // because it's unusual for the queue to get this large
  const arbitraryQueueStuckLimit = 10;
  if (onDataQueueContainer.queue.length > arbitraryQueueStuckLimit) {
    const cachedQueue = JSON.stringify(onDataQueueContainer.queue.slice(0, arbitraryQueueStuckLimit));
    setTimeout(() => {
      if (cachedQueue == JSON.stringify(onDataQueueContainer.queue.slice(0, arbitraryQueueStuckLimit))) {
        console.error("onData queue: growing unusually large", MESSAGE_TYPES[currentlyProcessingOnDataMessage.payload.type], JSON.stringify(currentlyProcessingOnDataMessage), '\nPayload Types:', onDataQueueContainer.queue.map(x => MESSAGE_TYPES[x.payload.type]));
      } else {
        console.log('onData queue: Thought there might be a stuck queue but it resolved itself', cachedQueue, JSON.stringify(onDataQueueContainer.queue.slice(0, arbitraryQueueStuckLimit)));
      }
    }, 5000);
  }
  // process the "next" (the one that was just added) immediately
  processNextInQueueIfReady(overworld);
}
// currentlyProcessingOnDataMessage is used to help with bug reports to show
// which message is stuck and didn't finish being processed.
let currentlyProcessingOnDataMessage: any = null;
export function processNextInQueueIfReady(overworld: Overworld) {
  // If game is ready to process messages, begin processing
  // (if not, they will remain in the queue until the game is ready)
  messageQueue.processNextInQueue(onDataQueueContainer, d => handleOnDataMessage(d, overworld).catch(e => {
    if (e) {
      console.error('Handled: error in handleOnDataMessage:', e.message, e.stack);
    } else {
      console.error('Handled: undefined error in handleOnDataMessage');
    }
  }));
}
function logHandleOnDataMessage(type: MESSAGE_TYPES, payload: any, fromClient: string, underworld: Underworld) {
  try {
    if (!NO_LOG_LIST.includes(type)) {
      // Count processed messages (but only those that aren't in the NO_LOG_LIST)
      underworld.processedMessageCount++;
      let payloadForLogging = '';
      // For headless, log only portions of some payloads so as to not swamp the logs with
      // unnecessary info
      if (globalThis.headless) {
        switch (type) {
          case MESSAGE_TYPES.SET_PHASE:
            payloadForLogging = `phase: ${turn_phase[payload.phase]}`
            break;
          case MESSAGE_TYPES.SYNC_PLAYERS:
            payloadForLogging = `units: ${payload?.units.length}; players: ${payload?.players.length}`;
            break;
          case MESSAGE_TYPES.CREATE_LEVEL:
            payloadForLogging = `levelIndex: ${payload?.level?.levelIndex}; enemies: ${payload?.level?.enemies.length}`;
            break;
          default:
            // To prevent heavy server logs, default payloadForLogging for server is empty
            payloadForLogging = '';
            break;
        }
      } else {
        payloadForLogging = payload;
      }
      // Don't clog up server logs with payloads, leave that for the client which can handle them better
      console.log("Handle onData", underworld.processedMessageCount, ":", MESSAGE_TYPES[type], payloadForLogging)
    }
  } catch (e) {
    console.error('Error in logging', e);
  }

}

let lastSpellMessageTime = 0;
async function handleOnDataMessage(d: OnDataArgs, overworld: Overworld): Promise<any> {
  currentlyProcessingOnDataMessage = d;
  const { payload, fromClient } = d;
  const type: MESSAGE_TYPES = payload.type;

  const { underworld } = overworld;
  if (!underworld) {
    console.error('Cannot handleOnDataMessage, underworld does not exist');
    return;
  }
  logHandleOnDataMessage(type, payload, fromClient, underworld);

  const fromPlayer = getFromPlayerViaClientId(fromClient, underworld);
  switch (type) {
    case MESSAGE_TYPES.PEER_VOLUNTARY_DISCONNECT: {
      globalThis.peers.delete(fromClient);
      if (payload.hostDisconnected) {
        const backupSaveName = `backup`;
        // Backups are unique to the current date and the save name
        // so multiple backups in the same day and same game name will overwrite each other
        const todayDate = new Date().setHours(0, 0, 0, 0);
        globalThis.save?.(`${todayDate}-${backupSaveName}`, true).then(errMsg => {
          if (!errMsg) {
            Jprompt({ text: `Disconnected\n\nLobby host disconnected due to: ${payload.disconnectReason}\n` + i18n(['auto save notice', backupSaveName]), yesText: 'Okay', forceShow: true });
          }
        });
        globalThis.exitCurrentGame?.();
      }
      if (underworld.pie instanceof PiePeer) {
        globalThis.peerHostBroadcastClientsPresenceChanged(underworld.pie);
      } else {
        console.error('pie is not PiePeer and recieved PEER_VOLUNTARY_DISCONNECT')
      }
      break;
    }
    case MESSAGE_TYPES.KICKED_FROM_PEER_LOBBY: {
      const { peerLobbyId, peerSteamId } = payload;
      if (underworld.pie instanceof PiePeer) {

        if (peerLobbyId != globalThis.peerLobbyId) {
          console.warn('Got Kick peer message for the wrong lobby', d);
          return;
        }
        globalThis.peers.delete(peerSteamId);
        if (peerSteamId == underworld.pie.clientId) {
          console.log('I got kicked from the peer lobby');
          Jprompt({ text: 'Removed from game', yesText: 'Okay', forceShow: true });
          globalThis.pieLeaveRoom?.();
        }
        globalThis.peerHostBroadcastClientsPresenceChanged(underworld.pie);
      }
      break;
    }
    case MESSAGE_TYPES.PEER_PING: {
      // Only respond with pong if current user matches the peerPingId
      if (globalThis.clientId == payload.peerPingId) {
        console.debug('Sending Peer Ping', d);
        // Respond with pong
        underworld.pie.sendData({
          type: MESSAGE_TYPES.PEER_PONG,
          peerPingId: payload.peerPingId,
        });
      } else {
        console.warn('Got PING meant for different user', payload);
      }
      break;
    }
    case MESSAGE_TYPES.PEER_PONG: {
      console.debug(`Got pong after ${Date.now() - d.time}ms.`, d);
      break;
    }
    case MESSAGE_TYPES.GET_PLAYER_CONFIG: {
      overworld.pie.sendData({
        type: MESSAGE_TYPES.PLAYER_CONFIG,
        color: storage.get(storage.STORAGE_ID_PLAYER_COLOR),
        name: storage.get(storage.STORAGE_ID_PLAYER_NAME),
        wizardType: storage.get(storage.STORAGE_ID_WIZARD_TYPE) || 'Spellmason',
        version: globalThis.SPELLMASONS_PACKAGE_VERSION
      });
      break;
    }
    case MESSAGE_TYPES.CHANGE_CHARACTER: {
      if (fromPlayer) {
        const userSource = allUnits[payload.unitId];
        if (!userSource) {
          console.error('User unit source file not registered, cannot create player');
          break;
        }
        fromPlayer.unit.unitSourceId = payload.unitId;
        // Update the player image
        fromPlayer.unit.defaultImagePath = userSource.info.image;
        Unit.returnToDefaultSprite(fromPlayer.unit);
      } else {
        console.error('Cannot change character, no fromPlayer found');
        // TODO: This should request a unit and player sync
      }
      break;
    }
    case MESSAGE_TYPES.REQUEST_SYNC_GAME_STATE: {
      // If host, send sync; if non-host, ignore 
      if (globalThis.isHost(overworld.pie)) {
        console.log('Host: Sending game state for REQUEST_SYNC_GAME_STATE')
        hostGiveClientGameState(fromClient, underworld, underworld.lastLevelCreated, MESSAGE_TYPES.LOAD_GAME_STATE);
      }
      break;
    }
    case MESSAGE_TYPES.SYNC_PLAYERS: {
      console.log('sync: SYNC_PLAYERS; syncs units and players')
      const { units, players, lastUnitId, currentLevelIndex } = payload as {
        // Note: When syncing players, must also sync units
        // because IPlayerSerialized doesn't container a full
        // unit serialized
        units: Unit.IUnitSerialized[],
        // Sync data for players
        players: Player.IPlayerSerialized[],
        lastUnitId: number,
        currentLevelIndex: number,
      }

      if (underworld.levelIndex !== currentLevelIndex) {
        console.log('Discarding SYNC_PLAYERS message from old level')
        break;
      }
      // Units must be synced before players so that the player's
      // associated unit is available for referencing
      underworld.syncUnits(units, true);
      // isClientPlayerSourceOfTruth: true; for regular syncs the client's own player object
      // is the source of truth so that the server's async player sync call doesn't overwrite
      // something that happened syncronously on the client
      underworld.syncPlayers(players, true);
      // Protect against old versions that didn't send lastUnitId with
      // this message
      if (exists(lastUnitId)) {
        underworld.lastUnitId = lastUnitId
      }
      break;
    }
    case MESSAGE_TYPES.SYNC_SOME_STATE: {
      if (globalThis.headless) {
        // SYNC_SOME_STATE is only ever sent from headless and doesn't need to be run on headless
        break;
      }
      console.log('sync: SYNC_SOME_STATE; syncs non-player units')
      const { timeOfLastSpellMessage, units, pickups, lastUnitId, lastPickupId, RNGState, currentLevelIndex } = payload as {
        // timeOfLastSpellMessage ensures that SYNC_SOME_STATE won't overwrite valid state with old state
        // if someone a second SPELL message is recieved between this message and it's corresponding SPELL message
        // Messages don't currently have a unique id so I'm storing d.time which should be good enough
        timeOfLastSpellMessage: number,
        // Sync data for units
        units?: Unit.IUnitSerialized[],
        // Sync data for pickups
        pickups?: Pickup.IPickupSerialized[],
        lastUnitId: number,
        lastPickupId: number,
        RNGState: SeedrandomState,
        currentLevelIndex: number,
      }
      if (timeOfLastSpellMessage !== lastSpellMessageTime) {
        // Do not sync, state has changed since this sync message was sent
        console.warn('Discarding SYNC_SOME_STATE message, it is no longer valid');
        break;
      }
      if (underworld.levelIndex !== currentLevelIndex) {
        console.log('Discarding SYNC_PLAYERS message from old level')
        break;
      }
      if (RNGState) {
        underworld.syncronizeRNG(RNGState);
      }

      if (units) {
        // Sync all non-player units.  If it syncs player units it will overwrite player movements
        // that occurred during the cast
        underworld.syncUnits(units, true);
      }

      if (pickups) {
        underworld.syncPickups(pickups);
      }

      // Syncronize the lastXId so that when a new unit or pickup is created
      // it will get the same id on both server and client
      underworld.lastUnitId = lastUnitId;
      underworld.lastPickupId = lastPickupId;
      break;
    }
    case MESSAGE_TYPES.SET_PHASE: {
      console.log('sync: SET_PHASE; syncs units and players');
      const { phase, units, players, pickups, lastUnitId, lastPickupId, RNGState, currentLevelIndex } = payload as {
        phase: turn_phase,
        // Sync data for players
        players?: Player.IPlayerSerialized[],
        // Sync data for units
        units?: Unit.IUnitSerialized[],
        // Sync data for pickups
        pickups?: Pickup.IPickupSerialized[],
        lastUnitId: number,
        lastPickupId: number,
        RNGState: SeedrandomState,
        currentLevelIndex: number,
      }
      if (underworld.levelIndex !== currentLevelIndex) {
        console.log('Discarding SET_PHASE message from old level')
        break;
      }
      if (RNGState) {
        underworld.syncronizeRNG(RNGState);
      }
      // Do not set the phase redundantly, this can occur due to tryRestartTurnPhaseLoop
      // being invoked multiple times before the first message is processed.  This is normal.
      if (underworld.turn_phase == phase) {
        console.log(`Phase is already set to ${turn_phase[phase]}; Aborting SET_PHASE.`);
        break;
      }
      if (units) {
        underworld.syncUnits(units);
      }
      // Note: Players should sync after units so
      // that the player.unit reference is synced
      // with up to date units
      if (players) {
        // isClientPlayerSourceOfTruth: true; for regular syncs the client's own player object
        // is the source of truth so that the server's async player sync call doesn't overwrite
        // something that happened syncronously on the client
        underworld.syncPlayers(players, true);
      }

      if (pickups) {
        underworld.syncPickups(pickups);
      }

      // Syncronize the lastXId so that when a new unit or pickup is created
      // it will get the same id on both server and client
      underworld.lastUnitId = lastUnitId;
      underworld.lastPickupId = lastPickupId;

      // Use the internal setTurnPhrase now that the desired phase has been sent
      // via the public setTurnPhase
      await underworld.initializeTurnPhase(phase);
      break;
    }
    case MESSAGE_TYPES.CREATE_LEVEL: {
      const { level, gameMode } = payload as {
        level: LevelData,
        gameMode?: GameMode
      }
      console.log('sync: CREATE_LEVEL: Syncing / Creating level');
      if (underworld) {
        // Only happens during CREATE_LEVEL message so that 
        // it isn't triggered during a game load
        underworld.giveStartOfLevelStatPoints(level);
        await underworld.createLevel(level, gameMode);
      } else {
        console.error('Cannot sync level, no underworld exists')
      }
      break;
    }
    case MESSAGE_TYPES.INIT_GAME_STATE: {
      await handleLoadGameState(payload, overworld);
      break;
    }
    case MESSAGE_TYPES.LOAD_GAME_STATE: {
      // Make everyone go back to the lobby
      for (let p of overworld.underworld?.players || []) {
        p.lobbyReady = false;
      }

      await handleLoadGameState(payload, overworld);
      if (!isSinglePlayer()) {
        setView(View.Menu);
        globalThis.setMenu?.('MULTIPLAYER_SERVER_CHOOSER');
      }
      break;
    }
    case MESSAGE_TYPES.ENTER_PORTAL: {
      if (fromPlayer) {
        Player.enterPortal(fromPlayer, underworld);
      } else {
        console.error('Recieved ENTER_PORTAL message but "caster" is undefined')
      }
      break;
    }
    case MESSAGE_TYPES.PLAYER_CARDS: {
      if (fromPlayer) {
        fromPlayer.cardsInToolbar = payload.cards;
      } else {
        console.error('No fromPlayer to set card order on')
      }
      break;
    }
    case MESSAGE_TYPES.PLAYER_CONFIG: {
      if (globalThis.numberOfHotseatPlayers > 1) {
        // Hotseat multiplayer has it's own player config management
        // because it needs to hold configs for multiple players on a single
        // computer
        break;
      }
      const { color, colorMagic, name, wizardType, lobbyReady, version } = payload;
      if (fromPlayer) {
        fromPlayer.gameVersion = version;
        if (exists(lobbyReady)) {
          fromPlayer.lobbyReady = lobbyReady;
          // If all connected players are also ready, start the game:
          const connectedPlayers = underworld.players.filter(p => p.clientConnected);
          if (connectedPlayers.length > 0 && connectedPlayers.every(p => p.lobbyReady)) {
            console.log('Lobby: All players are ready, start game.');
            setView(View.Game);
            // Sync player UI on game start (for loading into games)
            if (player == globalThis.player && overworld.underworld) {
              overworld.underworld.syncPlayerPredictionUnitOnly();
              Unit.syncPlayerHealthManaUI(overworld.underworld);
            }
            // Change end turn button from End Turn to Ready in multiplayer
            if (elEndTurnBtn && !globalThis.headless) {
              const elEndTurnSpan = elEndTurnBtn.querySelector('[data-localize-text]') as HTMLElement;
              elEndTurnSpan.dataset.localizeText = "ready"
              elEndTurnSpan.innerText = i18n(elEndTurnSpan.dataset.localizeText);
            }
          }
        }
        if (exists(name)) {
          fromPlayer.name = name;
        }
        setPlayerNameUI(fromPlayer);
        Player.setPlayerRobeColor(fromPlayer, color, colorMagic);
        Player.syncLobby(underworld);
        // Don't override wizardType if it's not being set
        if (exists(wizardType) && wizardType != fromPlayer.wizardType) {
          Player.setWizardType(fromPlayer, wizardType, overworld.underworld);
        }
        // Update the player image
        const sourceUnit = fromPlayer.wizardType == 'Goru' ? allUnits[GORU_UNIT_ID] : allUnits[spellmasonUnitId];
        if (sourceUnit) {
          visualPolymorphPlayerUnit(fromPlayer.unit, sourceUnit)
          Unit.returnToDefaultSprite(fromPlayer.unit);
        } else {
          console.error('Attempted to change player units sprite but found no sourceUnit');
        }

        // Improve joining games so that if there is an uncontrolled player with the same name, this client
        // takes over that player.  This allows clients to join saved games and reassume control of
        // a player with their same name automatically even if their cliendID has changed
        const takeControlOfPlayer = underworld.players.find(p => !p.clientConnected && p.name == name);
        if (takeControlOfPlayer) {
          joinGameAsPlayer(fromClient, takeControlOfPlayer.playerId, overworld);
        }
        underworld.tryRestartTurnPhaseLoop();
      } else {
        console.log('Players: ', underworld.players.map(p => p.playerId))
        console.error('Cannot PLAYER_CONFIG, fromPlayer is undefined.');
      }
      break;
    }
    case MESSAGE_TYPES.SPAWN_PLAYER: {
      if (fromPlayer) {
        // If the spawned player is the current client's player
        if (fromPlayer == globalThis.player) {
          // Screenshake when the current player spawns
          startScreenshake(10, false, 500);
          tutorialCompleteTask('spawn');
          autoExplain();
          // When player spawns, send their config from storage
          // to the server
          if (globalThis.numberOfHotseatPlayers > 1) {
            Player.setPlayerRobeColor(fromPlayer, fromPlayer.color, fromPlayer.colorMagic);
          } else {
            overworld.pie.sendData({
              type: MESSAGE_TYPES.PLAYER_CONFIG,
              color: storage.get(storage.STORAGE_ID_PLAYER_COLOR),
              name: storage.get(storage.STORAGE_ID_PLAYER_NAME),
              wizardType: storage.get(storage.STORAGE_ID_WIZARD_TYPE) || 'Spellmason',
              version: globalThis.SPELLMASONS_PACKAGE_VERSION
            });
          }
        }
        if (!(isNaN(payload.x) && isNaN(payload.y))) {
          fromPlayer.isSpawned = true;
          // Fail-safe: Ensure spawning player spawns alive
          fromPlayer.unit.alive = true;
          if (fromPlayer.clientId == globalThis.clientId) {
            globalThis.awaitingSpawn = false;
          }
          if (fromPlayer == globalThis.player) {
            if (elInstructions) {
              elInstructions.innerText = '';
            }
            cameraAutoFollow(true);
          }
          teleport(fromPlayer.unit, payload, underworld, false);

          // Trigger onSpawn events
          const events = [...fromPlayer.unit.events]
          for (let eventName of events) {
            if (eventName) {
              const fn = Events.onSpawnSource[eventName];
              if (fn) {
                fn(fromPlayer.unit, underworld, false);
              }
            }
          }
          // Detect if player spawns in liquid
          tryFallInOutOfLiquid(fromPlayer.unit, underworld, false);
          // Animate effect of unit spawning from the sky
          skyBeam(fromPlayer.unit);
          playSFXKey('summonDecoy');
          // Once a player spawns make sure to show their image as
          // their image may be hidden if they are the non-current user
          // player in multiplayer
          Image.show(fromPlayer.unit.image);
          underworld.syncTurnMessage();
          Unit.refillCharges(fromPlayer.unit, underworld);
        } else {
          console.error('Cannot spawn player at NaN')
        }
        // This check protects against potential bugs where the upgrade screen still hasn't come up
        // by the time the player spawns
        if (fromPlayer == globalThis.player && (underworld.upgradesLeftToChoose(globalThis.player) > 0 || globalThis.player.statPointsUnspent > 0)) {
          // This can happen if they die and then the ally npc finished the level for them and the unit killed by the ally npc triggers a level up
          // or the first time that they spawn
          underworld.showUpgrades();
        }

      } else {
        console.error('Cannot SPAWN_PLAYER, fromPlayer is undefined.')
      }
      Player.syncLobby(underworld);
      underworld.tryRestartTurnPhaseLoop();
      await underworld.progressGameState();
      underworld.assertDemoExit();
      break;
    }
    case MESSAGE_TYPES.SET_PLAYER_POSITION: {
      // This message is only for the host, it ensures that the player position
      // of the host matches exactly the player position on the player's client
      if (isHost(overworld.pie)) {
        if (fromPlayer && fromPlayer.unit && exists(payload.position.x) && exists(payload.position.y)) {
          Unit.setLocation(fromPlayer.unit, payload.position, underworld, false);
          fromPlayer.unit.stamina = payload.stamina;
        }
      }
      break;
    }
    case MESSAGE_TYPES.MOVE_PLAYER: {
      if (fromPlayer == globalThis.player) {
        // Do not do anything, own player movement is handled locally
        // so that it is smooth
        break;
      }
      if (underworld.turn_phase == turn_phase.Stalled) {
        // This check shouldn't have to be here but it protects against the game getting stuck in stalled phase
        console.error('Game was in Stalled turn_phase when a player sent MESSAGE_TYPES.MOVE_PLAYER.');
        underworld.tryRestartTurnPhaseLoop();
      }
      if (fromPlayer) {
        // Only allow spawned players to move
        if (fromPlayer.isSpawned) {
          if (!globalThis.headless) {
            // Network Sync: Make sure other players move a little slower so that the MOVE_PLAYER messages have time to set the
            // next move point on the client's screen.  This prevents jagged movement due to network latency
            fromPlayer.unit.moveSpeed = config.UNIT_MOVE_SPEED * 0.9;
            // Network Sync: Make sure the other player always has stamina to get where they're going, this is to ensure that
            // the local copies of other player's stay in sync with the server and aren't prematurely stopped due
            // to a stamina limitation
            fromPlayer.unit.stamina = fromPlayer.unit.staminaMax;
          }
          const moveTowardsPromise = Unit.moveTowards(fromPlayer.unit, payload, underworld).then(() => {
            if (fromPlayer.unit.path?.points.length && fromPlayer.unit.stamina == 0) {
              // If they do not reach their destination, notify that they are out of stamina
              floatingText({
                coords: fromPlayer.unit,
                text: 'Out of Stamina!'
              });
              explain(EXPLAIN_END_TURN);
              playSFXKey('deny_stamina');
            }
          });
          // Now that player movement has been set up, trigger the headless server to process it immediately
          underworld.triggerGameLoopHeadless();
          await moveTowardsPromise;

          // Trigger run predictions when the position of any player changes since
          // this could change prediction results
          runPredictions(underworld);
        }
      } else {
        console.error('Cannot move player, caster does not exist');
      }
      break;
    }
    case MESSAGE_TYPES.SPELL: {
      if (!globalThis.headless) {
        globalThis.spellCasting = true;
      }
      lastSpellMessageTime = d.time;
      if (fromPlayer) {
        // Add spell to battleLog
        underworld.battleLog(`${fromPlayer.name || 'Spellmason'}: ${(payload.cards as string[])
          // Pretty print spell
          .reduce<{ card: string, count: number }[]>((agg, cur) => {
            const lastIndex = agg.length - 1;
            const lastElement = agg[lastIndex];
            if (!lastElement) {
              agg.push({ card: cur, count: 1 });
              return agg;
            } else if (lastElement.card == cur) {
              lastElement.count++;
              return agg;
            } else {
              agg.push({ card: cur, count: 1 });
              return agg;
            }
          }, []).map(x => {
            const card = Cards.allCards[x.card];
            return `${x.count > 1 ? `${x.count}x` : ''} ${card && card.thumbnail ? `<img src="${getSpellThumbnailPath(card.thumbnail)}"></img>` : ''}` + i18n(x.card);
          }).join(', ')}`, false);

        if (underworld.turn_phase == turn_phase.Stalled) {
          // This check shouldn't have to be here but it protects against the game getting stuck in stalled phase
          console.error('Game was in Stalled turn_phase when a player sent MESSAGE_TYPES.SPELL.');
          underworld.tryRestartTurnPhaseLoop();
        }
        await handleSpell(fromPlayer, payload, underworld);
        // Await forcemoves in case the result of any spells caused a forceMove to be added to the array
        // such as Bloat's onDeath
        await underworld.awaitForceMoves();
        // Only send SYNC_SOME_STATE from the headless server
        if (globalThis.headless) {
          // Send a new SPELL message with the sync state attached
          underworld.pie.sendData({
            // Prevents an infinite loop since headless intercepts SPELL, calculates it fully
            // then sends it's own version with syncState attached and spoofs the fromClient
            // so the correct unit casts, it must not reprocess the message.
            // ---
            // Note: when intercepting and modifying a message be sure to use `doNotEcho`
            // in HeadlessServer.ts
            skipHostAppHandler: true,
            // Spoof the client so it knows which player cast
            asFromClient: d.fromClient,
            type: MESSAGE_TYPES.SPELL,
            ...payload,
            syncState: {
              timeOfLastSpellMessage: lastSpellMessageTime,
              units: underworld.units.filter(u => !u.flaggedForRemoval).map(Unit.serialize),
              pickups: underworld.pickups.filter(p => !p.flaggedForRemoval).map(Pickup.serialize),
              lastUnitId: underworld.lastUnitId,
              lastPickupId: underworld.lastPickupId,
              // the state of the Random Number Generator
              RNGState: underworld.random.state(),
              // Store the level index that this function was invoked on
              // so that it can be sent along with the message so that if
              // the level index changes, 
              // the old SYNC_SOME_STATE state won't overwrite the newer state
              currentLevelIndex: underworld.levelIndex,
            }
          });
        }
        globalThis.spellCasting = false;
      } else {
        console.error('Cannot cast, caster does not exist');
      }
      break;
    }
    case MESSAGE_TYPES.END_TURN: {
      if (fromPlayer) {
        if (!fromPlayer.clientConnected) {
          fromPlayer.clientConnected = true;
          console.error('Unexpected: Player ended turn while not connected.');
        }
        await underworld.endPlayerTurn(fromPlayer);
      } else {
        console.error('Unable to end turn because caster is undefined');
      }
      if (globalThis.headless) {
        // Add server's playersTurnEnded state so clients can update lobby
        underworld.pie.sendData({
          // Note: when intercepting and modifying a message be sure to use `doNotEcho`
          // in HeadlessServer.ts
          skipHostAppHandler: true,
          // Spoof the client so it knows which player cast
          asFromClient: d.fromClient,
          ...payload,
          playersTurnEnded: underworld.players.filter(p => p.endedTurn).map(p => p.clientId)
        });
      } else {
        if (payload.playersTurnEnded) {
          for (const player of underworld.players) {
            const isTurnEndedOnServer = payload.playersTurnEnded.find((clientId: string) => clientId == player.clientId);
            // Sync ended turn state
            if (player && player.endedTurn !== isTurnEndedOnServer) {
              if (isTurnEndedOnServer) {
                await underworld.endPlayerTurn(player);
              } else {
                player.endedTurn = false;
              }
            }

          }
          Player.syncLobby(underworld);
        } else {
          if (!underworld.pie.soloMode && !globalThis.peerLobbyId) {
            console.error('Unexpected: Client recieving END_TURN message should include playersTurnEnded from server.')
          }
        }
      }

      break;
    }
    case MESSAGE_TYPES.ADMIN_COMMAND: {
      const { label } = payload;
      triggerAdminCommand(label, fromClient, payload);
      // Recalculate attentionMarkers
      if (overworld.underworld) runPredictions(overworld.underworld);
      break;
    }
    case MESSAGE_TYPES.ADMIN_CHANGE_STAT: {
      const { unitId, stats } = payload;
      const unit = underworld.units.find(u => u.id == unitId);
      if (unit) {
        Object.assign(unit, stats);
        if (unit == globalThis.player?.unit) {
          underworld.syncPlayerPredictionUnitOnly();
          Unit.syncPlayerHealthManaUI(underworld);
        }
      } else {
        console.error('ADMIN_CHANGE_STAT failed', payload)
      }
      // Recalculate attentionMarkers
      if (overworld.underworld) runPredictions(overworld.underworld);
      break;
    }
  }
}
function getFromPlayerViaClientId(clientId: string, underworld: Underworld): Player.IPlayer | undefined {
  if (!clientId) {
    // This happens when the server sends a network message
    return undefined;
  }

  if (globalThis.player && globalThis.clientId == clientId) {
    //console.debug("Returning current player on this client:\n", clientId, "\n", globalThis.player.playerId);
    return globalThis.player;
  }

  const player = underworld.players.find(p => p.clientId == clientId);
  //console.debug("Finding player on different client:\n", clientId, "\n", player?.playerId);
  if (!player) {
    console.error("No fromPlayer found via clientId");
    console.log("No fromPlayer found for clientId: ", clientId);
  }
  return player;
}
function joinGameAsPlayer(fromClient: string, asClientId: string, overworld: Overworld) {
  const underworld = overworld.underworld;
  if (!underworld) return;

  const asPlayer = underworld.players.find(p => p.clientId == asClientId);
  const oldFromPlayer = getFromPlayerViaClientId(fromClient, underworld);
  if (fromClient && asPlayer) {
    if (asPlayer.clientConnected) {
      console.error('Cannot join as player that is controlled by another client')
      return;
    }
    console.log('JOIN_GAME_AS_PLAYER: Reassigning player', asPlayer.clientId, 'to', fromClient);
    const previousAsPlayerClientId = asPlayer.clientId;
    asPlayer.clientId = fromClient;
    asPlayer.playerId = asPlayer.clientId + "_" + 0;
    // Ensure their turn doesn't get skipped
    asPlayer.endedTurn = false;
    // Change the clientId of fromClient's old player now that they have inhabited the asPlayer
    if (oldFromPlayer) {
      oldFromPlayer.clientId = previousAsPlayerClientId;
      oldFromPlayer.playerId = oldFromPlayer.clientId + "_" + 0;
      // force update clientConnected due to client switching players
      const isConnected = overworld.clients.includes(oldFromPlayer.clientId);
      oldFromPlayer.clientConnected = isConnected;
      // Delete old player if just created
      if (!oldFromPlayer.clientConnected && oldFromPlayer.inventory.length == 0) {
        underworld.players = underworld.players.filter(p => p != oldFromPlayer);
        Unit.cleanup(oldFromPlayer.unit, false, true);
      } else {
        console.warn('JoinGameAsPlayer could not delete oldPlayer, this is expected if oldPlayer is part of the loaded game.')
      }
    } else {
      console.error('Unexpected, joinGameAsPlayer: oldFromPlayer does not exist')
    }

    const players = underworld.players.map(Player.serialize)
    // isClientPlayerSourceOfTruth: false; Overwrite client's own player object because the client is switching players
    underworld.syncPlayers(players, false);
  }
}
async function handleLoadGameState(payload: {
  underworld: IUnderworldSerialized,
  camera: Vec2 & { zoom: number }
}, overworld: Overworld) {
  console.log("Setup: Load game state", payload)
  const { underworld: payloadUnderworld, camera } = payload
  const { pickups, units, players, turn_phase } = payloadUnderworld;

  console.log('Setup: activeMods', payloadUnderworld.activeMods);
  // Sync underworld properties
  const loadedGameState: IUnderworldSerialized = { ...payloadUnderworld };
  const { underworld } = overworld;
  if (!underworld) {
    return console.error('Cannot handleLoadGameState, underworld is undefined');
  }

  // For future consideration: Why isn't Underworld.cleanup called here?
  // Might be dangerous since load game state might be used for syncronisation.
  // For now just clear the game over screen and later do a thorough check to see
  // if we can just Underworld.cleanup
  underworld.clearGameOverModal();

  const level = loadedGameState.lastLevelCreated;
  if (!level) {
    console.error('Cannot handleLoadGameState, level is undefined');
    return;
  }
  underworld.levelIndex = loadedGameState.levelIndex;
  // Update level tracker
  const elLevelTracker = document.getElementById('level-tracker');
  if (elLevelTracker) {
    elLevelTracker.innerHTML = i18n(['Level', underworld.getLevelText()]);
  }

  // Update the seed (this MUST come before syncronizeRNG)
  underworld.seed = loadedGameState.seed;
  // Now sync the seed-based RNG state
  if (loadedGameState.RNGState) {
    underworld.syncronizeRNG(loadedGameState.RNGState);
  }
  underworld.gameMode = loadedGameState.gameMode;
  underworld.turn_phase = loadedGameState.turn_phase;
  underworld.turn_number = loadedGameState.turn_number;
  underworld.processedMessageCount = loadedGameState.processedMessageCount;
  underworld.cardDropsDropped = loadedGameState.cardDropsDropped;
  underworld.enemiesKilled = loadedGameState.enemiesKilled;
  underworld.activeMods = loadedGameState.activeMods;
  underworld.events = loadedGameState.events;
  // simulatingMovePredictions should never be serialized, it is only for a running instance to keep track of if the simulateRunForceMovePredictions is running
  underworld.simulatingMovePredictions = false;
  // backwards compatible for save state that didn't have this:
  underworld.allyNPCAttemptWinKillSwitch = loadedGameState.allyNPCAttemptWinKillSwitch || 0;

  underworld.serverStabilityMaxUnits = loadedGameState.serverStabilityMaxUnits;
  underworld.serverStabilityMaxPickups = loadedGameState.serverStabilityMaxPickups;
  console.log('Server Stability: ', underworld.serverStabilityMaxUnits, underworld.serverStabilityMaxPickups);

  // sync difficulty.  This must occur before underworld.createLevel
  // because difficulty determines the health of mobs
  underworld.difficulty = loadedGameState.difficulty;

  // Sync Level.  Must await createLevel since it uses setTimeout to ensure that
  // the DOM can update with the "loading..." message before locking up the CPU with heavy processing.
  // This is important so that createLevel runs BEFORE loading units and syncing Players
  // Note: createLevel syncronizes a bunch of underworld properties; for example it invokes cache_walls.
  // Check it carefully before manually syncronizing properties
  await underworld.createLevel(level, underworld.gameMode);

  // Unlike turn_number, these variables are tracked per-level, 
  // they have to go after createLevel() as to not be overwritten by cleanUpLevel()
  underworld.wave = loadedGameState.wave;
  underworld.hasSpawnedBoss = loadedGameState.hasSpawnedBoss;

  // Since level data has pickups stored in it and since those pickups' locations
  // for existance may have changed between when the level was created and when
  // the gamestate was saved, remove all pickups and spawn pickups from the pickups array
  for (let p of underworld.pickups) {
    removePickup(p, underworld, false);
  }
  // Clear pickups array now that they have been removed in preparation for loading pickups
  underworld.pickups = [];
  if (pickups) {
    for (let p of pickups) {
      // Don't spawn pickups that are flagged to be removed
      if (p.flaggedForRemoval) {
        continue;
      }
      Pickup.load(p, underworld, false)
    }
  }

  // Clear upgrades UI when loading a new game
  if (elUpgradePickerContent) {
    elUpgradePickerContent.innerHTML = '';
  }
  document.body?.classList.toggle(showUpgradesClassName, false);

  // Load units
  if (units) {
    // Clean up previous units:
    underworld.units.forEach(u => Unit.cleanup(u, false, true));
    underworld.units = units.filter(u => !u.flaggedForRemoval).map(u => Unit.load(u, underworld, false));
    recalculateGameDifficulty(underworld);
  }
  // Note: Players should sync after units are loaded so
  // that the player.unit reference is synced
  // with up to date units
  if (players) {
    // isClientPlayerSourceOfTruth: false; loading a new game means the player should be 
    // fully overwritten
    // Since this is a LOAD it should fully overwrite and LOAD the serialized players rather than
    // syncing
    underworld.players = players.flatMap((p, i) => {
      const loadedPlayer = Player.load(p, i, underworld, false);
      if (loadedPlayer) {
        return [loadedPlayer];
      } else {
        console.error('Failed to load player during handleLoadGameState')
        return [];
      }
    })
  }
  // After loading players, remove instructions if...
  if (globalThis.player?.isSpawned) {
    // If player is already spawned, clear spawn instructions
    if (elInstructions) {
      elInstructions.innerText = '';
    }
  }
  // After a load always start all players with endedTurn == false so that
  // it doesn't skip the player turn if players rejoin out of order
  for (let p of underworld.players) {
    p.endedTurn = false;
  }
  // lastUnitId must be synced AFTER all of the units are synced since the synced
  // units are id aware
  underworld.lastUnitId = loadedGameState.lastUnitId;
  underworld.lastPickupId = loadedGameState.lastPickupId;
  // Set the turn_phase; do not use initializeTurnPhase
  // because that function runs initialization logic that would
  // make the loaded underworld desync from the host's underworld
  underworld.setTurnPhase(turn_phase);

  underworld.syncTurnMessage();
  if (globalThis.headless) {
    ensureAllClientsHaveAssociatedPlayers(overworld, overworld.clients, []);
  }

  underworld.assertDemoExit();

  // Resyncronize RNG after level has been created
  // This is because createLevel uses a lot of RNG causing the seed state
  // to drift and some clients will get INIT_GAME_STATE at a different time
  // than others, and when INIT_GAME_STATE is received, it drops previous messages
  // in the queue. This means that some clients may sync their RNG after the level is
  // created (due to getting a SET_PHASE) and others may not (because SET_PHASE was dropped)
  // Syncing here ensures everyone starts the level with the same seeded rng.
  // ---
  // Update the seed (this MUST come before syncronizeRNG)
  underworld.seed = loadedGameState.seed;
  // Now sync the seed-based RNG state
  if (loadedGameState.RNGState) {
    underworld.syncronizeRNG(loadedGameState.RNGState);
  }

  // Must be called when difficulty (gameMode) changes to update summon spell stats
  // Must be called AFTER players array is synced
  Cards.refreshSummonCardDescriptions(underworld);

  if (globalThis.player) {
    // Ensures that when loading a hotseat multiplayer saved game,
    // that the inventory is filled with the spells it had when saved
    recalcPositionForCards(globalThis.player, underworld);
  }

  // Reset camera to where it was saved
  if (camera) {
    setCamera(camera, camera.zoom, underworld);
  }

  // Now that a new gamestate has loaded in, run predictions
  runPredictions(underworld);
}
async function handleSpell(caster: Player.IPlayer, payload: any, underworld: Underworld) {
  if (typeof payload.x !== 'number' || typeof payload.y !== 'number' || typeof payload.casterPositionAtTimeOfCast.x !== 'number' || typeof payload.casterPositionAtTimeOfCast.y !== 'number') {
    console.error('Spell is invalid, it must have target and casterPositionAtTimeOfCast', payload);
    return;
  }
  // Clear out player thought (and the line that points to it) once they cast
  delete underworld.playerThoughts[caster.clientId];

  console.log('Handle Spell:', payload?.cards.join(','));

  // Only allow casting during the PlayerTurns phase
  if (underworld.turn_phase === turn_phase.PlayerTurns) {
    globalThis.animatingSpells = true;
    let screenShakeAmount = 100;
    let animationKey = 'playerAttackEpic';
    if (payload.cards.length < 3) {
      screenShakeAmount = 0;
      animationKey = 'playerAttackSmall';
    } else if (payload.cards.length < 6) {
      screenShakeAmount = 0;
      animationKey = 'playerAttackMedium0';
    } else if (payload.cards.length < 10) {
      screenShakeAmount = 20;
      animationKey = 'playerAttackMedium1';
    }
    if (caster.wizardType == 'Goru') {
      animationKey = GORU_ATTACK_IMAGE_PATH;
    }
    await Player.setSpellmasonsToChannellingAnimationClose(caster);
    if (caster.colorMagic === null) {
      caster.colorMagic = caster.color !== colors.playerNoColor ? playerCastAnimationColor : caster.color;
    }
    // count cards:
    if (caster.spellState) {
      for (let cardId of payload.cards) {
        let record = caster.spellState[cardId];
        if (!record) {
          record = { count: 0 };
          caster.spellState[cardId] = record;
        }
        record.count++;
      }
    }
    const keyMoment = () => {
      // Screenshake when a player casts a spell
      if (globalThis.player) {
        // Intensity decreases based on distance
        const distanceFromExplosion = distance(globalThis.player.unit, caster.unit);
        const intensity = lerp(screenShakeAmount, 0, distanceFromExplosion / 500);
        startScreenshake(intensity, false, 700);
      }
      const castCardsPromise = underworld.castCards({
        casterCardUsage: caster.cardUsageCounts,
        casterUnit: caster.unit,
        casterPositionAtTimeOfCast: payload.casterPositionAtTimeOfCast,
        cardIds: payload.cards,
        castLocation: clone(payload),
        prediction: false,
        outOfRange: false,
        magicColor: caster.colorMagic,
        casterPlayer: caster,
        initialTargetedUnitId: payload.initialTargetedUnitId,
        initialTargetedPickupId: payload.initialTargetedPickupId,
      });
      if (globalThis.headless) {
        // Since each individual card has it's own timeout (see Underworld.ts castCards) even on clients,
        // this whole spell timeout will only apply on the server to prevent the server from getting stuck.
        // The server calculates spells very quickly and if it takes a whole 5 seconds, then we have
        // high confidence that it is hanging.
        // Experiments: https://github.com/jdoleary/Spellmasons/issues/683#issuecomment-2120797899
        return raceTimeout(5000, `handleSpell: ${payload.cards}`, castCardsPromise)
      } else {
        return castCardsPromise
      }
    };
    const colorMagicMedium = lightenColor(caster.colorMagic, 0.3);
    const colorMagicLight = lightenColor(caster.colorMagic, 0.6);

    const statsUnitDeadBeforeCast = underworld.enemiesKilled;

    const animationOptions: PixiSpriteOptions | undefined = caster.wizardType == 'Goru' ? undefined : {
      animationSpeed: 0.2, loop: false, colorReplace: {
        colors: [
          [playerCastAnimationGlow, caster.colorMagic],
          [playerCastAnimationColor, colorMagicMedium],
          [playerCastAnimationColorLighter, colorMagicLight],
        ],
        epsilon: 0.2
      }
    };

    await Unit.playComboAnimation(caster.unit, animationKey, keyMoment, animationOptions);

    // Record best spell stats
    const statsUnitsKilledFromCast = underworld.enemiesKilled - statsUnitDeadBeforeCast;
    if (globalThis.player == caster) {
      const { stats } = globalThis.player;
      if (stats) {
        if (stats.bestSpell.unitsKilled < statsUnitsKilledFromCast) {
          stats.bestSpell.unitsKilled = statsUnitsKilledFromCast;
          stats.bestSpell.spell = payload.cards;
        }
        if (stats.longestSpell.length < payload.cards.length) {
          stats.longestSpell = payload.cards;
        }
      } else {
        console.error('player.stats is undefined');
      }
      // Updates the game over modal in the event that this spell caused the game over modal to render
      // before the stats were updated
      underworld.updateGameOverModal();
    }

    // Optimize: Cache blood after every cast
    cacheBlood();

    globalThis.animatingSpells = false;

    await mergeExcessPickups(underworld);
    await mergeExcessUnits(underworld);

    // Now that the previous spell is over, rerun predictions because
    // the player may have queued up another spell while the previous spell was
    // executing and they'll need to see the prediction for that next spell
    // Note: This must be invoked AFTER animatingSpells is set to false or else
    // it will short-circuit
    runPredictions(underworld);
  } else {
    console.log('Someone is trying to cast out of turn');
  }
}

export function setupNetworkHandlerGlobalFunctions(overworld: Overworld) {
  globalThis.configPlayer = ({ color, colorMagic, name, wizardType, lobbyReady }: { color?: number, colorMagic?: number, name?: string, wizardType?: WizardType, lobbyReady?: boolean }) => {
    if (exists(color)) {
      storage.set(storage.STORAGE_ID_PLAYER_COLOR, color);
    }
    if (exists(color)) {
      storage.set(storage.STORAGE_ID_PLAYER_COLOR_MAGIC, colorMagic);
    }
    let capped_name = name;
    if (capped_name) {
      capped_name = capped_name.slice(0, 70);
      storage.set(storage.STORAGE_ID_PLAYER_NAME, capped_name || '');
    }
    if (exists(wizardType)) {
      // Booleans should not be stored in localStorage as booleans because they are converted to
      // strings which is confusing as hell
      storage.set(storage.STORAGE_ID_WIZARD_TYPE, wizardType);
    }
    const storedWizardType = storage.get(storage.STORAGE_ID_WIZARD_TYPE);
    if (overworld.underworld) {
      overworld.pie.sendData({
        type: MESSAGE_TYPES.PLAYER_CONFIG,
        color,
        colorMagic,
        wizardType: storedWizardType || 'Spellmason',
        name: capped_name,
        lobbyReady,
        version: globalThis.SPELLMASONS_PACKAGE_VERSION
      });
    }
  }


  globalThis.getAllSaveFiles = () => Object.keys(localStorage).filter(x => x.startsWith(globalThis.savePrefix)).map(x => x.substring(globalThis.savePrefix.length));

  // Also used in Spellmasons menu repo
  function parseSaveFile(saveFileName: string) {
    const [dateString, saveName] = saveFileName.split("-");
    const parsedDate = dateString ? parseInt(dateString) : 0;
    // New parsing
    const [_wholeMatch, isQuicksave, date, gameName, extraInfo] =
      /(quicksave-)?(\d+)?-?(\w+)-?([\w\s]+)?/.exec(saveFileName)!;

    return {
      saveFileName,
      date:
        // New date parsing
        (date && parseInt(date)) ||
        // old date parsing
        (isNaN(parsedDate) ? 0 : parsedDate),
      isQuicksave: !!isQuicksave,
      displayName: isNaN(parsedDate)
        ? `${gameName}${extraInfo ? `-${extraInfo}` : ""}`
        : saveName !== ""
          ? saveName
          : new Date(parsedDate).toString(),
    };
  }
  // Returns '' if save is successful,
  // otherwise returns error message
  globalThis.save = async (title: string, forceOverwrite?: boolean): Promise<string> => {
    const { underworld } = overworld;
    if (!underworld) {
      const err = 'Cannot save game, underworld does not exist';
      console.error(err);
      return err;
    }
    // Wait till existing forceMoves are complete to save
    await underworld.awaitForceMoves();
    if (underworld.turn_phase != turn_phase.PlayerTurns) {
      globalThis.saveASAP = title;
      return 'Game will be saved at the start of your next turn.';
    }

    // Prompt overwrite, don't allow for saving multiple saves with the same name
    if (getAllSaveFiles) {
      const allSaveFiles = getAllSaveFiles();
      const parsedNewSaveTitle = parseSaveFile(title);
      const conflictingSaveTitles = allSaveFiles.filter(otherSaveFileKey => {
        const parsedOtherSaveTitle = parseSaveFile(otherSaveFileKey);
        return parsedNewSaveTitle.displayName == parsedOtherSaveTitle.displayName;
      });
      if (conflictingSaveTitles.length) {
        const doOverwrite = forceOverwrite ? true : await Jprompt({ text: 'There is a previous save file with this name, are you sure you want to overwrite it?', yesText: 'Yes, Overwrite it', noBtnText: 'Cancel', noBtnKey: 'Escape', forceShow: true })
        if (doOverwrite) {
          conflictingSaveTitles.forEach(otherTitle => {
            storage.remove(globalThis.savePrefix + otherTitle);
          });
        } else {
          console.log('Save cancelled');
          return 'Save Cancelled';
        }

      }
    }

    if (underworld.forceMove.length) {
      console.error('Attempting to save before resolving all forceMoves');
    }
    const saveObject: SaveFile = {
      version: globalThis.SPELLMASONS_PACKAGE_VERSION,
      underworld: underworld.serializeForSaving(),
      numberOfHotseatPlayers,
      camera: { ...getCameraCenterInGameSpace(), zoom: getZoom() },
    };
    try {
      storage.set(
        globalThis.savePrefix + title,
        JSON.stringify(saveObject),
      );
      // Successful save should clear saveASAP
      globalThis.saveASAP = undefined;
      // Empty string means "No error, save successful"
      return '';
    } catch (e) {
      // @ts-ignore
      if (e.message && e.message.includes('exceeded the quota')) {
        return i18n('failed to save') + '\n' + i18n('too many save files');
      }
      console.error('Failed to save', e);
      return i18n('failed to save');
    }
  };
  globalThis.deleteSave = async (title: string, force: boolean = false) => {
    const doDelete = force || await Jprompt({ text: 'Are you sure you want to delete this save file?', yesText: 'Yes', noBtnText: 'No', noBtnKey: 'Escape', forceShow: true })
    if (doDelete) {
      storage.remove(globalThis.savePrefix + title);
    }
  }
  globalThis.load = async (title: string) => {
    const savedGameString = storage.get(globalThis.savePrefix + title);
    if (savedGameString) {
      let fileSaveObj = undefined;
      try {
        fileSaveObj = JSON.parse(savedGameString);
      } catch (e) {
        // Log, not error because some users modify save files
        console.log(e);
        Jprompt({
          text: `The save file appears to be corrupted.`,
          yesText: 'Okay',
          forceShow: true
        });
        return;
      }
      if (isNullOrUndef(globalThis.player)) {
        console.log('LOAD: connectToSingleplayer in preparation for load');
        if (globalThis.connectToSingleplayer) {
          await globalThis.connectToSingleplayer();
        } else {
          console.error('Unexpected: Attempting to load but globalThis.connectToSingleplayer is undefined');
        }
      }

      const { underworld: savedUnderworld, version, numberOfHotseatPlayers, camera } = fileSaveObj as SaveFile;
      const { players } = savedUnderworld;
      if (exists(numberOfHotseatPlayers) || players.length > 1) {
        // Allow loading multiplayer games as a singleplayer hotseat game.
        globalThis.numberOfHotseatPlayers = players.length;
        if (overworld.pie.soloMode) {
          console.log('Loading a hotseat multiplayer game into a singleplayer underworld: reassinging cliendIds and playerIds');
          // Reassign playerId's and client ids so that single player can load a hotseat multiplayer game
          for (let i = 0; i < players.length; i++) {
            const player = players[i];
            // Reset all player clientId's so they are the same
            // and set playerId's as different so that a singleplayer
            // game can load a hotseat game
            if (globalThis.clientId) {
              if (player) {
                player.clientId = globalThis.clientId;
                player.playerId = `${player.clientId}_${i}`;
              }
            }
          }
        } else {
          console.log('Loading a hotseat multiplayer game into an online multiplayer server: so reset numberOfHotseatPlayers to 1 so that other players can assume control of hotseat players.');
          globalThis.numberOfHotseatPlayers = 1;
          for (let i = 1; i < players.length; i++) {
            const player = players[i];
            // Ensure players have different client ids when loading a hotseat game
            // in a multiplayer lobby so that multiple players can assume
            // control on different computers
            if (player && player.clientId == players[0]?.clientId) {
              player.clientId += `_${i}`;
            }
          }
        }
      }
      if (version !== globalThis.SPELLMASONS_PACKAGE_VERSION) {
        Jprompt({
          text: `This save file is from a previous version of the game and may not run as expected.
Save file version: ${version}.
Current game version: ${globalThis.SPELLMASONS_PACKAGE_VERSION}`,
          yesText: 'Okay',
          forceShow: true
        });
      }
      // If connected to a multiplayer server
      if (globalThis.player && !isSinglePlayer() && overworld.underworld) {
        // Cannot load a game if a player is already playing, can only load games if the game has not started yet
        if (overworld.underworld.players.some(p => p.isSpawned)) {
          console.log('Cannot load multiplayer game over a game that is ongoing.')
          Jprompt({
            text: 'You cannot overwrite an ongoing game with a saved game - if you wish to load a multiplayer game, do so from a new lobby.',
            yesText: 'Okay',
            forceShow: true
          });
          return;
        }
      }
      if (globalThis.player && isSinglePlayer()) {
        if (!globalThis.clientId) {
          console.error('Attempted to load a game with no globalThis.clientId')
          Jprompt({
            text: 'Error: Failed to load game, try restarting.',
            yesText: 'Okay',
            forceShow: true
          });
          return;
        }
        const firstPlayer = players[0];
        if (firstPlayer) {
          // Assume control of the existing single player in the load file
          firstPlayer.clientId = globalThis.clientId;
        } else {
          console.error('Attempted to load a game with no players in it.')
          Jprompt({
            text: 'Error: Attempted to load a game with no players in it.',
            yesText: 'Okay',
            forceShow: true
          });
          return;

        }
      }
      console.log('LOAD: send LOAD_GAME_STATE');
      overworld.pie.sendData({
        type: MESSAGE_TYPES.LOAD_GAME_STATE,
        underworld: savedUnderworld,
        camera
      });
      setView(View.Game);

    } else {
      console.error('no save game found with title', title);
    }
  };

  globalThis.exitCurrentGame = function exitCurrentGame(): Promise<void> {
    // Go back to the main PLAY menu
    globalThis.setMenu?.('PLAY');
    if (overworld.underworld) {
      overworld.underworld.cleanup();
    }


    // This prevents 'esc' key from going "back" to viewGame after the underworld is cleaned up
    clearLastNonMenuView();
    // Ensure the menu is open
    setView(View.Menu);
    intentionalDisconnect = true;
    return typeGuardHostApp(overworld.pie) ? Promise.resolve() : overworld.pie.disconnect('Exited game from menu');
  }
}
export interface SaveFile {
  version: string;
  underworld: IUnderworldSerialized;
  numberOfHotseatPlayers: number;
  camera: Vec2 & { zoom: number };
}