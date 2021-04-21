import type { ClientPresenceChangedArgs, OnDataArgs } from 'pie-client';
import { MESSAGE_TYPES } from './MessageTypes';
import { UnitType } from './commonTypes';
import floatingText from './FloatingText';
import { addSubSprite, removeSubSprite } from './Image';
import { getUpgradeByTitle } from './Upgrade';
import Game, { game_state, turn_phase } from './Game';
import * as Player from './Player';
import * as Unit from './Unit';
import * as Pickup from './Pickup';
import * as Obstacle from './Obstacle';
import * as Card from './CardUI';
import * as GameBoardInput from './ui/GameBoardInput';

const messageLog: any[] = [];
let clients = [];
let game: Game;
export function onData(d: OnDataArgs) {
  // Temporarily for development
  messageLog.push(d);

  const { payload } = d;
  const type: MESSAGE_TYPES = payload.type;
  switch (type) {
    case MESSAGE_TYPES.PING:
      floatingText({
        cell: payload,
        text: '🎈',
      });
      break;
    default:
      handleOnDataMessageSyncronously(d);
      break;
  }
}
let onDataQueue: OnDataArgs[] = [];
let currentMessagePromise: Promise<any> | null = null;
// Waits until a message is done before it will continue to process more messages that come through
// This ensures that players can't move in the middle of when spell effects are occurring for example.
function handleOnDataMessageSyncronously(d: OnDataArgs) {
  onDataQueue.push(d);
  // If no messages are currently being processed...
  if (!currentMessagePromise) {
    // process the "next" (the one that was just added) immediately
    processNextInQueue();
  }
}
function processNextInQueue() {
  if (onDataQueue.length) {
    currentMessagePromise = handleOnDataMessage(onDataQueue.splice(0, 1)[0]);
    currentMessagePromise.then(processNextInQueue);
  } else {
    currentMessagePromise = null;
  }
}
async function handleOnDataMessage(d: OnDataArgs): Promise<any> {
  const { payload, fromClient } = d;
  const type: MESSAGE_TYPES = payload.type;
  // Get caster
  const caster = game.players.find((p) => p.clientId === fromClient);
  switch (type) {
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      // Clean up old game state
      if (game) {
        game.cleanup();
      }
      // Resume game / load game / rejoin game
      const loadedGameState: Game = { ...payload.game };
      game = new Game(loadedGameState.seed);
      game.level = loadedGameState.level;
      game.secondsLeftForTurn = loadedGameState.secondsLeftForTurn;
      game.hostClientId = loadedGameState.hostClientId;
      // Load all units that are not player's, those will be loaded indepentently
      game.units = loadedGameState.units
        .filter((u) => u.unitType !== UnitType.PLAYER_CONTROLLED)
        .map(Unit.load);
      game.players = loadedGameState.players.map(Player.load);
      game.pickups = loadedGameState.pickups.map(Pickup.load);
      game.obstacles = loadedGameState.obstacles.map(Obstacle.load);
      game.setGameState(loadedGameState.state);
      break;
    case MESSAGE_TYPES.MOVE_PLAYER:
      if (caster) {
        // Move the player 1 magnitude on either or both axes towards the desired position
        await Unit.moveTo(caster.unit, payload).then(() => {
          checkEndPlayerTurn(caster);
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
        game.chooseUpgrade(caster, upgrade);
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
        game.endPlayerTurn(caster.clientId);
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
  if (game.turn_phase === turn_phase.PlayerTurns) {
    window.animatingSpells = true;
    await game.castCards(caster, payload.cards, payload, false);
    window.animatingSpells = false;
    // When spells are done animating but the mouse hasn't moved,
    // syncSpellEffectProjection needs to be called so that the icon ("footprints" for example)
    // will be shown in the tile that the mouse is hovering over
    GameBoardInput.syncSpellEffectProjection();
    checkEndPlayerTurn(caster);
  } else {
    console.log('Someone is trying to cast out of turn');
  }
}
export function onClientPresenceChanged(o: ClientPresenceChangedArgs) {
  console.log('clientPresenceChanged', o);
  clients = o.clients;
  const player = game.players.find((p) => p.clientId === o.clientThatChanged);
  // Client joined
  if (o.present) {
    if (clients.length === 1) {
      // if you are the only client, make the game
      makeGame(clients);
      game.hostClientId = window.clientId;
    } else if (game.hostClientId === window.clientId) {
      // If you are the host, send the game state to the other player
      // who just joined
      // --
      // If client that just joined doesn't have an associated player, create
      // that player and add them to the game before sending out the game state
      // for other clients to load:
      if (!player) {
        const newPlayer = Player.create(o.clientThatChanged);
        game.players.push(newPlayer);
      } else {
        player.clientConnected = true;
        removeSubSprite(player.unit.image, 'disconnected');
      }
      // Send game state to other player so they can load:
      window.pie.sendData({
        type: MESSAGE_TYPES.LOAD_GAME_STATE,
        game: game.sanitizeForSaving(),
      });
    }
  } else {
    // client left
    if (player) {
      player.clientConnected = false;
      addSubSprite(player.unit.image, 'disconnected');
      game.endPlayerTurn(player.clientId);
    } else {
      console.error('Cannot disconnect player that is undefined');
    }

    // if host left
    if (o.clientThatChanged === game.hostClientId) {
      console.log('host left');
      // Set host to the 0th client that is still connected
      const sortedClients = o.clients.sort();
      game.hostClientId = sortedClients[0];
    }
  }
}
function checkEndPlayerTurn(player: Player.IPlayer) {
  // Being dead ends your turn
  // Moving ends your turn
  if (!player.unit.alive || player.unit.thisTurnMoved) {
    game.endPlayerTurn(player.clientId);
  }
}

export function makeGame(clients: string[]) {
  game = new Game(Math.random().toString());
  // Initialize the first level
  game.initLevel();
  // Sort clients to make sure they're always in the same order, regardless of
  // what order they joined the game (client refreshes can change the order)
  const sortedClients = clients.sort();
  for (let i = 0; i < sortedClients.length; i++) {
    const c = clients[i];
    const p = Player.create(c);
    game.players.push(p);
  }
  game.setGameState(game_state.Playing);
}

window.save = (title) => {
  localStorage.setItem(
    'golems-save-' + title,
    JSON.stringify(window.game.sanitizeForSaving()),
  );
};
window.load = (title) => {
  const game = localStorage.getItem('golems-save-' + title);
  if (game) {
    window.pie.sendData({
      type: MESSAGE_TYPES.LOAD_GAME_STATE,
      game: JSON.parse(game),
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
    message.fromClient = game.players[0].clientId;
    onData(message);
  }
};
