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
import * as Card from './CardUI';
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
  // Mark the underworld as "ready"
  readyState.set('underworld', true);
}
export function onData(d: OnDataArgs) {
  // Temporarily for development
  messageLog.push(d);

  const { payload, fromClient } = d;
  const type: MESSAGE_TYPES = payload.type;
  switch (type) {
    case MESSAGE_TYPES.PING:
      floatingText({
        cell: payload,
        text: '🎈',
      });
      break;
    case MESSAGE_TYPES.VOTE_FOR_LEVEL:
      voteForLevel(fromClient, payload.levelIndex);
      break;
    case MESSAGE_TYPES.SELECT_CHARACTER:
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
      break;
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      // If a client loads a full game state, they should be fully synced
      // so clear the onDataQueue to prevent old messages from being processed
      onDataQueue = [d];
      // The LOAD_GAME_STATE message is tricky, it is an 
      // exception to the normal pattern used
      // with the queue, but it should still be processed sequentially to prevent
      // weird race conditions.
      // Since it is a fully copy of the latest
      // game state, it should empty the queue (except for itself).
      // And rather than calling handleOnDataMessageSyncronously(d) here,
      // we just skip right to calling processNextInQueue since this message
      // can execute regardless of whether readyState.isReady() is true or not
      processNextInQueue();
      break;
    default:
      // All other messages should be handled one at a time to prevent desync
      handleOnDataMessageSyncronously(d);
      break;
  }
}
let onDataQueue: OnDataArgs[] = [];
// Waits until a message is done before it will continue to process more messages that come through
// This ensures that players can't move in the middle of when spell effects are occurring for example.
function handleOnDataMessageSyncronously(d: OnDataArgs) {
  // Queue message for processing one at a time
  onDataQueue.push(d);
  // If game is ready to process messages, begin processing
  // (if not, they will remain in the queue until the game is ready)
  if (readyState.isReady()) {
    // process the "next" (the one that was just added) immediately
    processNextInQueue();
  }
}
export function processNextInQueue() {
  messageQueue.processNextInQueue(onDataQueue, handleOnDataMessage);
}
async function handleOnDataMessage(d: OnDataArgs): Promise<any> {
  const { payload, fromClient } = d;
  const type: MESSAGE_TYPES = payload.type;
  console.log("Handle ONDATA", type, payload)
  // Get caster
  const caster = underworld.players.find((p) => p.clientId === fromClient);
  switch (type) {
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      // Clean up old game state
      if (underworld) {
        underworld.cleanup();
      }
      // Resume game / load game / rejoin game
      const loadedGameState: Underworld = { ...payload.underworld };
      underworld = new Underworld(loadedGameState.seed, loadedGameState.RNGState);
      underworld.playerTurnIndex = loadedGameState.playerTurnIndex;
      underworld.level = loadedGameState.level;
      underworld.secondsLeftForTurn = loadedGameState.secondsLeftForTurn;
      underworld.hostClientId = loadedGameState.hostClientId;
      // Load all units that are not player's, those will be loaded indepentently
      underworld.units = loadedGameState.units
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
      break;
    case MESSAGE_TYPES.MOVE_PLAYER:
      if (caster) {
        await Unit.moveTo(caster.unit, payload).then(() => {
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
async function handleSpell(caster: Player.IPlayer, payload: any) {
  if (typeof payload.x !== 'number' || typeof payload.y !== 'number') {
    console.error('Spell is invalid, it must have coordinates');
    return;
  }
  Card.removeCardsFromHand(caster, payload.cards);
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

export function onClientPresenceChanged(o: ClientPresenceChangedArgs) {
  console.log('clientPresenceChanged', o);
  clients = o.clients;
  const player = underworld.players.find(
    (p) => p.clientId === o.clientThatChanged,
  );
  // Client joined
  if (o.present) {
    if (clients.length === 1) {
      // if you are the only client, set yourself as the host
      underworld.hostClientId = window.clientId;
      // Since the game was just created,
      // move the game to the Overworld
      setRoute(Route.Overworld);
      setView(View.CharacterSelect);
    } else if (underworld.hostClientId === window.clientId) {
      // If you are the host, send the game state to the other player
      // who just joined
      // Send game state to other player so they can load:
      window.pie.sendData({
        type: MESSAGE_TYPES.LOAD_GAME_STATE,
        route: window.route,
        underworld: underworld.sanitizeForSaving(),
      });
    }
  } else {
    // client left
    if (player) {
      Player.setClientConnected(player, false);
      underworld.endPlayerTurn(player.clientId);
    } else {
      console.error('Cannot disconnect player that is undefined');
    }

    // if host left
    if (o.clientThatChanged === underworld.hostClientId) {
      console.log('host left');
      // Set host to the 0th client that is still connected
      const sortedClients = o.clients.sort();
      underworld.hostClientId = sortedClients[0];
    }
  }
}

window.save = (title) => {
  localStorage.setItem(
    'golems-save-' + title,
    JSON.stringify({
      underworld: window.underworld.sanitizeForSaving(),
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
window.replay = (title: string) => {
  const messages = JSON.parse(localStorage.getItem('golems-' + title) || '');
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    message.fromClient = underworld.players[0].clientId;
    onData(message);
  }
};
