import type { OnDataArgs } from '@websocketpie/client';
import type * as PIXI from 'pixi.js';

import { MESSAGE_TYPES } from '../types/MessageTypes';
import * as Image from '../graphics/Image';
import floatingText from '../graphics/FloatingText';
import { getUpgradeByTitle } from '../Upgrade';
import Underworld, { elUpgradePickerContent, IUnderworldSerializedForSyncronize, LevelData, showUpgradesClassName, turn_phase } from '../Underworld';
import * as Player from '../entity/Player';
import * as Doodad from '../entity/Doodad';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import * as messageQueue from '../messageQueue';
import * as storage from '../storage';
import * as config from '../config';
import * as Cards from '../cards';
import * as colors from '../graphics/ui/colors';
import { allUnits } from '../entity/units';
import { hostGiveClientGameState, typeGuardHostApp } from './networkUtil';
import { skyBeam } from '../VisualEffects';
import { tryFallInOutOfLiquid } from '../entity/Obstacle';
import { IPickupSerialized, removePickup } from '../entity/Pickup';
import { triggerAdminCommand } from '../graphics/ui/eventListeners';
import { clone, Vec2 } from '../jmath/Vec';
import pingSprite from '../graphics/Ping';
import { clearLastNonMenuView, setView, View } from '../views';
import { autoExplain, explain, EXPLAIN_END_TURN, tutorialCompleteTask } from '../graphics/Explain';
import { cacheBlood, cameraAutoFollow, runCinematicLevelCamera } from '../graphics/PixiUtils';
import { ensureAllClientsHaveAssociatedPlayers, Overworld } from '../Overworld';
import { playerCastAnimationColor, playerCastAnimationColorLighter, playerCastAnimationGlow } from '../graphics/ui/colors';
import { lightenColor } from '../graphics/ui/colorUtil';
import { choosePerk, tryTriggerPerk } from '../Perk';
import { calculateCost } from '../cards/cardUtils';
import { runPredictions } from '../graphics/PlanningView';
import seedrandom from 'seedrandom';
import { getUniqueSeedString, SeedrandomState } from '../jmath/rand';
import { raceTimeout } from '../Promise';
import { createVisualLobbingProjectile } from '../entity/Projectile';
import { setPlayerNameUI } from '../PlayerUtils';
import { isSinglePlayer } from '../types/commonTypes';
import { recalcPositionForCards } from '../graphics/ui/CardUI';

export const NO_LOG_LIST = [MESSAGE_TYPES.PING, MESSAGE_TYPES.PLAYER_THINKING];
export const HANDLE_IMMEDIATELY = [MESSAGE_TYPES.PING, MESSAGE_TYPES.PLAYER_THINKING];
export const elInstructions = document.getElementById('instructions') as (HTMLElement | undefined);
export function onData(d: OnDataArgs, overworld: Overworld) {
  const { payload, fromClient } = d;
  if (!NO_LOG_LIST.includes(d.payload.type)) {
    // Don't clog up server logs with payloads, leave that for the client which can handle them better
    try {
      console.log("onData:", MESSAGE_TYPES[d.payload.type], globalThis.headless ? '' : JSON.stringify(d))
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
  switch (type) {
    case MESSAGE_TYPES.PLAYER_THINKING:
      const thinkingPlayer = underworld.players.find(p => p.clientId === fromClient)
      if (thinkingPlayer && thinkingPlayer != globalThis.player) {
        const thought = underworld.playerThoughts[thinkingPlayer.clientId];
        // Default the currentDrawLocation to target if it doesn't already exist
        // Clear currentDrawLocation if thought contains no cardIds
        const currentDrawLocation = thought && thought.cardIds.length == 0 ? undefined : thought?.currentDrawLocation || payload.target
        // When a new thought comes in, reset the lerp value so the currentDrawLocation will smoothly animate to the new target
        underworld.playerThoughts[thinkingPlayer.clientId] = { ...payload, currentDrawLocation, lerp: 0 };
      }
      break;
    case MESSAGE_TYPES.SET_MODS:
      const { activeMods } = payload;
      if (activeMods) {
        underworld.activeMods = activeMods;
      }
      break;
    case MESSAGE_TYPES.JOIN_GAME_AS_PLAYER:
      const { asPlayerClientId } = payload;
      const asPlayer = underworld.players.find(p => p.clientId == asPlayerClientId);
      const oldFromPlayer = underworld.players.find(p => p.clientId == fromClient);
      if (fromClient && asPlayer) {
        console.log('JOIN_GAME_AS_PLAYER: Reassigning player', asPlayer.clientId, 'to', fromClient);
        const oldAsPlayerClientId = asPlayer.clientId;
        asPlayer.clientId = fromClient;
        // Change the clientId of fromClient's old player now that they have inhabited the asPlayer
        if (oldFromPlayer) {
          oldFromPlayer.clientId = oldAsPlayerClientId;
        }

        const players = underworld.players.map(Player.serialize)
        underworld.syncPlayers(players);
      }
      break;
    case MESSAGE_TYPES.AQUIRE_PICKUP:
      const { pickupId, pickupName, unitId, playerClientId } = payload;
      let pickup = underworld.pickups.find(p => p.id == pickupId);
      const unit = underworld.units.find(u => u.id == unitId);
      const player = underworld.players.find(p => p.clientId == playerClientId);
      if (!pickup) {
        const pickupSource = Pickup.pickups.find(p => p.name == pickupName);
        if (pickupSource) {
          console.log('pickups:', underworld.pickups.map(p => `${p.id},${p.name}`), 'pickupId:', pickupId)
          console.error('Attempted to aquire pickup but could not find it in list, creating one to aquire');
          pickup = Pickup.create({ pos: { x: -1000, y: -1000 }, pickupSource }, underworld, false);
        } else {
          console.error(`Pickup source not found for name: ${pickupName}`)
        }
      }
      // note: player is optionally undefined, but pickup and unit are required
      if (pickup) {
        if (unit) {
          Pickup.triggerPickup(pickup, unit, player, underworld, false);
        } else {
          console.log('units:', underworld.units.map(u => u.id), 'UnitId:', unitId);
          console.error('Attempted to aquire pickup but could not find unit');
        }
      } else {
        console.log('pickups:', underworld.pickups.map(p => `${p.id},${p.name}`), 'pickupId:', pickupId)
        console.error('Attempted to aquire pickup but could not find it in list');
      }
      break;
    case MESSAGE_TYPES.PING:
      pingSprite({ coords: payload as Vec2, color: underworld.players.find(p => p.clientId == d.fromClient)?.color });
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
      if (underworld.allowForceInitGameState || underworld.lastLevelCreated === undefined) {
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
    case MESSAGE_TYPES.CHOOSE_PERK:
      {
        console.log('onData: CHOOSE_PERK', `${fromClient}: ${JSON.stringify(payload?.perk || {})}`);
        if (payload.curse) {
          const player = underworld.players.find(p => p.clientId == fromClient);
          if (player) {
            player.spellState[payload.curse] = { disabledUntilLevel: underworld.levelIndex + (payload.disableFor || 2) };
            player.cursesChosen++;
            // Reset last level card counts
            for (let spellStateInst of Object.values(player.spellState || {})) {
              spellStateInst.count = 0;
            }
            // If current player
            if (player == globalThis.player) {
              // Update disabled label
              recalcPositionForCards(player, underworld);
            }
          } else {
            console.error('Could not find player to give curse perk.')
          }
          // Clear upgrades
          document.body?.classList.toggle(showUpgradesClassName, false);
          // There may be upgrades left to choose
          underworld.showUpgrades();
        } else {
          // Get player of the client that sent the message 
          const fromPlayer = underworld.players.find((p) => p.clientId === fromClient);
          if (fromPlayer) {
            choosePerk(payload.perk, fromPlayer, underworld);
          } else {
            console.error('Cannot CHOOSE_PERK, fromPlayer is undefined', fromClient, fromPlayer)
          }
        }
      }
      break;
    case MESSAGE_TYPES.CHOOSE_UPGRADE:
      console.log('onData: CHOOSE_UPGRADE', `${fromClient}: ${payload?.upgrade?.title}`);
      // Get player of the client that sent the message 
      const fromPlayer = underworld.players.find((p) => p.clientId === fromClient);
      if (fromPlayer) {
        const upgrade = getUpgradeByTitle(payload.upgrade.title);
        if (upgrade) {
          underworld.chooseUpgrade(fromPlayer, upgrade);
        } else {
          console.error(
            'Cannot CHOOSE_UPGRADE, upgrade does not exist',
            upgrade,
          );
        }
      } else {
        console.error('Cannot CHOOSE_UPGRADE, fromPlayer is undefined', fromClient, fromPlayer)
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
        console.log("onData queue: growing unusually large", MESSAGE_TYPES[currentlyProcessingOnDataMessage.payload.type], JSON.stringify(currentlyProcessingOnDataMessage), '\nPayload Types:', onDataQueueContainer.queue.map(x => MESSAGE_TYPES[x.payload.type]));
        console.error("onData queue stuck on message");
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
    console.error('Handled: error in handleOnDataMessage:', e);
  }));
}
function logHandleOnDataMessage(type: MESSAGE_TYPES, payload: any, fromClient: string, underworld: Underworld) {
  try {
    if (!NO_LOG_LIST.includes(type)) {
      // Count processed messages (but only those that aren't in the NO_LOG_LIST)
      underworld.processedMessageCount++;
      let payloadForLogging = payload;
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
        }
      }
      // Don't clog up server logs with payloads, leave that for the client which can handle them better
      console.log("onData", underworld.processedMessageCount, ":", MESSAGE_TYPES[type], payloadForLogging)
    }
  } catch (e) {
    console.error('Error in logging', e);
  }

}
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
  // Get player of the client that sent the message 
  const fromPlayer = underworld.players.find((p) => p.clientId === fromClient);
  switch (type) {
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
    case MESSAGE_TYPES.REQUEST_SYNC_GAME_STATE:
      // If host, send sync; if non-host, ignore 
      if (globalThis.isHost(overworld.pie)) {
        console.log('Host: Sending game state for REQUEST_SYNC_GAME_STATE')
        hostGiveClientGameState(fromClient, underworld, underworld.lastLevelCreated, MESSAGE_TYPES.LOAD_GAME_STATE);
      }
      break;
    case MESSAGE_TYPES.SYNC_PLAYERS:
      {
        console.log('sync: SYNC_PLAYERS; syncs units and players')
        const { units, players, lastUnitId } = payload as {
          // Note: When syncing players, must also sync units
          // because IPlayerSerialized doesn't container a full
          // unit serialized
          units: Unit.IUnitSerialized[],
          // Sync data for players
          players: Player.IPlayerSerialized[],
          lastUnitId: number
        }
        // Units must be synced before players so that the player's
        // associated unit is available for referencing
        underworld.syncUnits(units);
        underworld.syncPlayers(players);
        // Protect against old versions that didn't send lastUnitId with
        // this message
        if (lastUnitId !== undefined) {
          underworld.lastUnitId = lastUnitId
        }
      }
      break;
    case MESSAGE_TYPES.SET_PHASE:
      console.log('sync: SET_PHASE; syncs units and players')
      const { phase, units, players, pickups, lastUnitId, lastPickupId, RNGState } = payload as {
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
      }
      if (RNGState) {
        underworld.syncronizeRNG(RNGState);
      }
      // Do not set the phase redundantly, this can occur due to tryRestartTurnPhaseLoop
      // being invoked multiple times before the first message is processed.  This is normal.
      if (underworld.turn_phase == phase) {
        console.debug(`Phase is already set to ${turn_phase[phase]}; Aborting SET_PHASE.`);
        return;
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
    case MESSAGE_TYPES.CREATE_LEVEL:
      const { level } = payload as {
        level: LevelData
      }
      console.log('sync: CREATE_LEVEL: Syncing / Creating level');
      if (underworld) {
        await underworld.createLevel(level);
      } else {
        console.error('Cannot sync level, no underworld exists')
      }

      break;
    case MESSAGE_TYPES.INIT_GAME_STATE:
      await handleLoadGameState(payload, overworld);
      break;
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      // Make everyone go back to the lobby
      for (let p of overworld.underworld?.players || []) {
        p.lobbyReady = false;
      }

      await handleLoadGameState(payload, overworld);
      if (!isSinglePlayer(globalThis.clientId)) {
        setView(View.Menu);
        globalThis.setMenu?.('MULTIPLAYER_SERVER_CHOOSER');
      }
      break;
    case MESSAGE_TYPES.ENTER_PORTAL:
      if (fromPlayer) {
        Player.enterPortal(fromPlayer, underworld);
      } else {
        console.error('Recieved ENTER_PORTAL message but "caster" is undefined')
      }
      break;
    case MESSAGE_TYPES.PLAYER_CARDS:
      if (fromPlayer) {
        fromPlayer.cards = payload.cards;
      } else {
        console.error('No fromPlayer to set card order on')
      }
      break;
    case MESSAGE_TYPES.PLAYER_CONFIG:
      if (globalThis.numberOfHotseatPlayers > 1) {
        // Hotseat multiplayer has it's own player config management
        // because it needs to hold configs for multiple players on a single
        // computer
        return;
      }
      const { color, colorMagic, name, lobbyReady } = payload;
      if (fromPlayer) {
        if (lobbyReady !== undefined) {
          fromPlayer.lobbyReady = lobbyReady;
          // If all connected players are also ready, start the game:
          const connectedPlayers = underworld.players.filter(p => p.clientConnected);
          if (connectedPlayers.length > 0 && connectedPlayers.every(p => p.lobbyReady)) {
            console.log('Lobby: All players are ready, start game.');
            // If loading into a game, tryGameOver so that if the game over modal is up, it will
            // be removed if there are acting players.
            underworld.tryGameOver();
            setView(View.Game);
            if (globalThis.player && fromPlayer.clientId == globalThis.player.clientId && !globalThis.player.isSpawned) {
              // Retrigger the cinematic camera since the first time
              // a user joins a game from the lobby, postLevelSetup will
              // already have completed before they enter View.Game, so now
              // that they have, run the cinematic again.
              runCinematicLevelCamera(underworld);
            }
          }
        }
        if (name !== undefined) {
          fromPlayer.name = name;
        }
        setPlayerNameUI(fromPlayer);
        Player.setPlayerRobeColor(fromPlayer, color, colorMagic);
        Player.syncLobby(underworld);
        underworld.tryRestartTurnPhaseLoop();
      } else {
        console.log('Players: ', underworld.players.map(p => p.clientId))
        console.error('Cannot PLAYER_CONFIG, fromPlayer is undefined.');
      }
      break;
    case MESSAGE_TYPES.SPAWN_PLAYER:
      if (fromPlayer) {
        // If the spawned player is the current client's player
        if (fromPlayer == globalThis.player) {
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
            });
          }
        }
        if (!(isNaN(payload.x) && isNaN(payload.y))) {
          fromPlayer.isSpawned = true;
          if (fromPlayer.clientId == globalThis.clientId) {
            globalThis.awaitingSpawn = false;
          }
          if (fromPlayer == globalThis.player) {
            if (elInstructions) {
              elInstructions.innerText = '';
            }
            cameraAutoFollow(true);
          }
          Unit.setLocation(fromPlayer.unit, payload);
          // Trigger 'everyLevel' attributePerks
          // now that the player has spawned in at the new level
          const perkRandomGenerator = seedrandom(getUniqueSeedString(underworld, fromPlayer));
          for (let i = 0; i < fromPlayer.attributePerks.length; i++) {
            const perk = fromPlayer.attributePerks[i];
            if (perk) {
              tryTriggerPerk(perk, fromPlayer, 'everyLevel', perkRandomGenerator, underworld, 700 * i);
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
          fromPlayer.endedTurn = false;
          underworld.syncTurnMessage();
          // Used for the tutorial but harmless if invoked under other circumstances.
          // Spawns the portal after the player choses a spawn point if there are no
          // enemies left
          underworld.checkIfShouldSpawnPortal();
        } else {
          console.error('Cannot spawn player at NaN')
        }
        // This check protects against potential bugs where the upgrade screen still hasn't come up
        // by the time the player spawns
        if (fromPlayer == globalThis.player && (underworld.upgradesLeftToChoose(globalThis.player) > 0 || underworld.perksLeftToChoose(globalThis.player) > 0)) {
          // This can happen if they die and then the ally npc finished the level for them and the unit killed by the ally npc drops a scroll
          console.error('Unexpected: player had unspent upgrade points when they spawned.');
          underworld.showUpgrades();
        }

      } else {
        console.error('Cannot SPAWN_PLAYER, fromPlayer is undefined.')
      }
      Player.syncLobby(underworld);
      underworld.tryRestartTurnPhaseLoop();
      underworld.assertDemoExit();
      break;
    case MESSAGE_TYPES.SET_PLAYER_POSITION:
      // This message is only for the host, it ensures that the player position
      // of the host matches exactly the player position on the player's client
      if (isHost(overworld.pie)) {
        if (fromPlayer && fromPlayer.unit && payload.x !== undefined && payload.y !== undefined) {
          Unit.setLocation(fromPlayer.unit, payload);
        }
      }
      break;
    case MESSAGE_TYPES.MOVE_PLAYER:
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
          // Network Sync: Make sure other players move a little slower so that the MOVE_PLAYER messages have time to set the
          // next move point on the client's screen.  This prevents jagged movement due to network latency
          fromPlayer.unit.moveSpeed = config.UNIT_MOVE_SPEED * 0.9;
          // Network Sync: Make sure the other player always has stamina to get where they're going, this is to ensure that
          // the local copies of other player's stay in sync with the server and aren't prematurely stopped due
          // to a stamina limitation
          fromPlayer.unit.stamina = 100;
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
            // Clear player unit path when they are done moving so they get
            // to choose a new path next turn
            fromPlayer.unit.path = undefined;
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
    case MESSAGE_TYPES.SPELL:
      if (fromPlayer) {
        if (underworld.turn_phase == turn_phase.Stalled) {
          // This check shouldn't have to be here but it protects against the game getting stuck in stalled phase
          console.error('Game was in Stalled turn_phase when a player sent MESSAGE_TYPES.SPELL.');
          underworld.tryRestartTurnPhaseLoop();
        }
        await handleSpell(fromPlayer, payload, underworld);
        // Trigger it again in case the result of any spells caused a forceMove to be added to the array
        // such as Bloat's onDeath
        underworld.triggerGameLoopHeadless();
      } else {
        console.error('Cannot cast, caster does not exist');
      }
      break;
    case MESSAGE_TYPES.END_TURN:
      if (fromPlayer) {
        underworld.endPlayerTurn(fromPlayer.clientId);
      } else {
        console.error('Unable to end turn because caster is undefined');
      }
      break;
    case MESSAGE_TYPES.ADMIN_COMMAND:
      const { label } = payload;
      triggerAdminCommand(label, fromClient, payload)
      break;
    case MESSAGE_TYPES.ADMIN_CHANGE_STAT:
      const { unitId, stats } = payload;
      const unit = underworld.units.find(u => u.id == unitId);
      if (unit) {
        Object.assign(unit, stats);
      } else {
        console.error('ADMIN_CHANGE_STAT failed', payload)
      }
      break;

  }
}
async function handleLoadGameState(payload: {
  underworld: IUnderworldSerializedForSyncronize,
  phase: turn_phase,
  pickups: IPickupSerialized[],
  units: Unit.IUnitSerialized[],
  players: Player.IPlayerSerialized[],
  doodads: Doodad.IDoodadSerialized[]
}, overworld: Overworld) {
  console.log("Setup: Load game state", payload)
  const { underworld: payloadUnderworld, phase, pickups, units, players, doodads } = payload
  console.log('Setup: activeMods', payloadUnderworld.activeMods);
  // Sync underworld properties
  const loadedGameState: IUnderworldSerializedForSyncronize = { ...payloadUnderworld };
  const { underworld } = overworld;
  if (!underworld) {
    return console.error('Cannot handleLoadGameState, underworld is undefined');
  }

  const level = loadedGameState.lastLevelCreated;
  if (!level) {
    console.error('Cannot handleLoadGameState, level is undefined');
    return;
  }
  underworld.levelIndex = loadedGameState.levelIndex;

  // Update the seed (this MUST come before syncronizeRNG)
  underworld.seed = loadedGameState.seed;
  // Now sync the seed-based RNG state
  if (loadedGameState.RNGState) {
    underworld.syncronizeRNG(loadedGameState.RNGState);
  }
  underworld.turn_phase = loadedGameState.turn_phase;
  underworld.turn_number = loadedGameState.turn_number;
  underworld.processedMessageCount = loadedGameState.processedMessageCount;
  underworld.cardDropsDropped = loadedGameState.cardDropsDropped;
  underworld.enemiesKilled = loadedGameState.enemiesKilled;
  underworld.activeMods = loadedGameState.activeMods;

  // Sync Level.  Must await createLevel since it uses setTimeout to ensure that
  // the DOM can update with the "loading..." message before locking up the CPU with heavy processing.
  // This is important so that createLevel runs BEFORE loading units and syncing Players
  // Note: createLevel syncronizes a bunch of underworld properties; for example it invokes cache_walls.
  // Check it carefully before manually syncronizing properties
  await underworld.createLevel(level);

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
      const pickup = Pickup.pickups.find(pickupSource => pickupSource.name == p.name);
      if (pickup) {
        const newPickup = Pickup.create({ pos: { x: p.x, y: p.y }, pickupSource: pickup, idOverride: p.id }, underworld, false);
        if (newPickup) {
          const { image, ...rest } = p;
          // Override pickup properties such as turnsLeftToGrab
          Object.assign(newPickup, rest);
        }
      } else {
        console.error('Could not spawn pickup, pickup source missing for imagePath', p.imagePath);
      }
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
    underworld.units.forEach(u => Unit.cleanup(u));
    underworld.units = units.filter(u => !u.flaggedForRemoval).map(u => Unit.load(u, underworld, false));
  }
  // Note: Players should sync after units are loaded so
  // that the player.unit reference is synced
  // with up to date units
  if (players) {
    underworld.syncPlayers(players);
  }
  underworld.doodads = doodads.map(d => Doodad.load(d, underworld, false)).flatMap(x => x !== undefined ? [x] : []);
  // lastUnitId must be synced AFTER all of the units are synced since the synced
  // units are id aware
  underworld.lastUnitId = loadedGameState.lastUnitId;
  underworld.lastPickupId = loadedGameState.lastPickupId;
  // Set the turn_phase; do not use initializeTurnPhase
  // because that function runs initialization logic that would
  // make the loaded underworld desync from the host's underworld
  underworld.setTurnPhase(phase);

  underworld.syncTurnMessage();
  if (globalThis.headless) {
    ensureAllClientsHaveAssociatedPlayers(overworld, overworld.clients);
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

}
async function handleSpell(caster: Player.IPlayer, payload: any, underworld: Underworld) {
  if (typeof payload.x !== 'number' || typeof payload.y !== 'number' || typeof payload.casterPositionAtTimeOfCast.x !== 'number' || typeof payload.casterPositionAtTimeOfCast.y !== 'number') {
    console.error('Spell is invalid, it must have target and casterPositionAtTimeOfCast', payload);
    return;
  }
  // Clear out player thought (and the line that points to it) once they cast
  delete underworld.playerThoughts[caster.clientId];

  // Prevent mana scamming
  // --
  // Note: There is already a check on click, but this additional check is necessary to
  // prevent players from queueing up a spell that would go beyond their eventual mana
  // while a current spell is still in the process of being cast and thus removing
  // their mana as it is cast
  if (caster) {
    const cards = Cards.getCardsFromIds(payload.cards);
    const cost = calculateCost(cards, caster.cardUsageCounts);
    if (cost.manaCost > caster.unit.mana) {
      if (globalThis.player == caster) {
        floatingText({
          coords: caster.unit,
          text: 'Insufficient Mana',
          style: { fill: colors.errorRed, fontSize: '50px', ...config.PIXI_TEXT_DROP_SHADOW }
        })
        console.log('Spell could not be cast, insufficient mana');
      }
      // Return to prevent player from mana scamming
      // Note: this return must come OUTSIDE of the globalThis.player == caster check
      // which is used only to show an error message for the player who attempted to cast,
      // the return needs to run on ALL clients including the server so that the player doesn't
      // cast when they have insufficient mana
      return;
    }
  }

  console.log('Handle Spell:', payload?.cards.join(','));

  // Only allow casting during the PlayerTurns phase
  if (underworld.turn_phase === turn_phase.PlayerTurns) {
    globalThis.animatingSpells = true;
    let animationKey = 'playerAttackEpic';
    if (payload.cards.length < 3) {
      animationKey = 'playerAttackSmall';
    } else if (payload.cards.length < 6) {
      animationKey = 'playerAttackMedium0';
    }
    if (['units/playerBookIn', 'units/playerBookIdle'].includes(caster.unit.image?.sprite.imagePath || '')) {
      await new Promise<void>((resolve) => {
        if (caster.unit.image) {
          Image.changeSprite(
            caster.unit.image,
            'units/playerBookReturn',
            caster.unit.image.sprite.parent,
            resolve,
            {
              loop: false,
              // Play the book close animation a little faster than usual so
              // the player can get on with casting
              animationSpeed: 0.2
            }
          );
          Image.addOneOffAnimation(caster.unit, 'units/playerBookReturnMagic', { doRemoveWhenPrimaryAnimationChanges: true }, {
            loop: false,
            // Play the book close animation a little faster than usual so
            // the player can get on with casting
            animationSpeed: 0.2
          });
        } else {
          resolve();
        }
      });
    }
    if (caster.colorMagic === null) {
      caster.colorMagic = caster.color !== colors.playerNoColor ? playerCastAnimationColor : caster.color;
    }
    // count cards:
    if (player?.spellState) {
      for (let cardId of payload.cards) {
        let record = player.spellState[cardId];
        if (!record) {
          record = { count: 0 };
          player.spellState[cardId] = record;
        }
        record.count++;
      }
    }
    const keyMoment = () => underworld.castCards({
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
    const colorMagicMedium = lightenColor(caster.colorMagic, 0.3);
    const colorMagicLight = lightenColor(caster.colorMagic, 0.6);

    const statsUnitDeadBeforeCast = underworld.enemiesKilled;

    await Unit.playComboAnimation(caster.unit, animationKey, keyMoment, {
      animationSpeed: 0.2, loop: false, colorReplace: {
        colors: [
          [playerCastAnimationGlow, caster.colorMagic],
          [playerCastAnimationColor, colorMagicMedium],
          [playerCastAnimationColorLighter, colorMagicLight],
        ],
        epsilon: 0.2
      }
    });

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
  globalThis.configPlayer = ({ color, colorMagic, name, lobbyReady }: { color?: number, colorMagic?: number, name?: string, lobbyReady?: boolean }) => {
    if (color !== undefined) {
      storage.set(storage.STORAGE_ID_PLAYER_COLOR, color);
    }
    if (color !== undefined) {
      storage.set(storage.STORAGE_ID_PLAYER_COLOR_MAGIC, colorMagic);
    }
    let capped_name = name;
    if (capped_name !== undefined) {
      capped_name = capped_name.slice(0, 70);
      storage.set(storage.STORAGE_ID_PLAYER_NAME, capped_name || '');
    }
    overworld.pie.sendData({
      type: MESSAGE_TYPES.PLAYER_CONFIG,
      color,
      colorMagic,
      name: capped_name,
      lobbyReady
    });
  }


  globalThis.getAllSaveFiles = () => Object.keys(localStorage).filter(x => x.startsWith(globalThis.savePrefix)).map(x => x.substring(globalThis.savePrefix.length));

  globalThis.save = async (title: string, forceOverwrite?: boolean) => {
    const { underworld } = overworld;
    if (!underworld) {
      console.error('Cannot save game, underworld does not exist');
      return;
    }
    // Prompt overwrite, don't allow for saving multiple saves with the same name
    if (getAllSaveFiles && !forceOverwrite) {

      const allSaveFiles = getAllSaveFiles();
      // A safe file key consists of a prefix, a timestamp and a wordTitle, find and compare the word titles
      // the timestamp exists to sort them by recency.
      const isolateWordsInTitle = (title: string) => title.split('-').slice(-1)?.[0] || '';
      const conflictingSaveTitles = allSaveFiles.filter(otherSaveFileKey => {
        const titleWords = isolateWordsInTitle(otherSaveFileKey);
        return titleWords == isolateWordsInTitle(title);
      });
      if (conflictingSaveTitles.length) {
        const doOverwrite = await Jprompt({ text: 'There is a previous save file with this name, are you sure you want to overwrite it?', yesText: 'Yes, Overwrite it', noBtnText: 'Cancel', noBtnKey: 'Escape', forceShow: true })
        if (doOverwrite) {
          conflictingSaveTitles.forEach(otherTitle => {
            storage.remove(globalThis.savePrefix + otherTitle);
          });
        } else {
          console.log('Save cancelled');
          return;
        }

      }
    }

    const saveObject = {
      version: globalThis.SPELLMASONS_PACKAGE_VERSION,
      underworld: underworld.serializeForSaving(),
      phase: underworld.turn_phase,
      pickups: underworld.pickups.filter(p => !p.flaggedForRemoval).map(Pickup.serialize),
      units: underworld.units.filter(u => !u.flaggedForRemoval).map(Unit.serialize),
      players: underworld.players.map(Player.serialize),
      doodads: underworld.doodads.map(Doodad.serialize),
      numberOfHotseatPlayers
    };
    try {
      storage.set(
        globalThis.savePrefix + title,
        JSON.stringify(saveObject),
      );
    } catch (e) {
      console.log('Failed to save', saveObject);
      console.error(e);
    }
  };
  globalThis.deleteSave = async (title: string) => {
    const doDelete = await Jprompt({ text: 'Are you sure you want to delete this save file?', yesText: 'Yes', noBtnText: 'No', noBtnKey: 'Escape', forceShow: true })
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
      if (globalThis.player == undefined) {
        console.log('LOAD: connectToSingleplayer in preparation for load');
        if (globalThis.connectToSingleplayer) {
          await globalThis.connectToSingleplayer();
        } else {
          console.error('Unexpected: Attempting to load but globalThis.connectToSingleplayer is undefined');
        }
      }

      const { underworld: savedUnderworld, phase, units, players, pickups, doodads, version, numberOfHotseatPlayers } = fileSaveObj;
      if (numberOfHotseatPlayers !== undefined) {
        globalThis.numberOfHotseatPlayers = numberOfHotseatPlayers;
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
      const SOLOMODE_CLIENT_ID = 'solomode_client_id';
      // If connected to a multiplayer server
      if (globalThis.player && !isSinglePlayer(globalThis.player.clientId) && overworld.underworld) {
        // Cannot load a game if a player is already playing, can only load games if the game has not started yet
        if (overworld.underworld.players.some(p => p.isSpawned)) {
          console.log('Cannot load multiplayer game over a game that is ongoing.')
          Jprompt({
            text: 'You may only load a multiplayer game in a lobby where no players have spawned in yetb.',
            yesText: 'Okay',
            forceShow: true
          });
          return;
        }
      }
      if (globalThis.player && isSinglePlayer(globalThis.player.clientId)) {
        const firstPlayer = players[0];
        if (firstPlayer) {
          // Assume control of the existing single player in the load file
          firstPlayer.clientId = SOLOMODE_CLIENT_ID;
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
        pickups,
        doodads,
        phase,
        units,
        players
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
    return typeGuardHostApp(overworld.pie) ? Promise.resolve() : overworld.pie.disconnect();
  }
}