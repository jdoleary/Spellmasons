import PieClient, { ClientPresenceChangedArgs } from 'pie-client';
import Game, { game_state, turn_phase } from './Game';
import * as Player from './Player';
import * as Unit from './Unit';
import * as Pickup from './Pickup';
import AnimationManager from './AnimationManager';
import type { Spell } from './Spell';
import * as UI from './ui/UserInterface';
import { MESSAGE_TYPES } from './MessageTypes';

import { setupPixi } from './PixiUtils';
setupPixi().then(() => {
  UI.setup();
  // Connect to PieServer
  connect();
  // See makeGame function for where setup truly happens
  // This instantiation just spins up the instance of game
  game = new Game(Math.random().toString());
});

window.animationManager = new AnimationManager();

let clients = [];

// const wsUri = 'ws://localhost:8000';
const wsUri = 'ws://192.168.0.21:8000';
// const wsUri = 'wss://websocket-pie-e4elx.ondigitalocean.app/';
let pie: PieClient;
let game: Game;
let maxClients = 8;
function connect(_room_info = {}) {
  const room_info = Object.assign(_room_info, {
    app: 'Golems',
    version: '0.1.0',
    maxClients,
  });
  maxClients = room_info.maxClients;
  const storedClientId = sessionStorage.getItem('pie-clientId');
  window.pie = pie = new PieClient({
    env: import.meta.env.MODE,
    wsUri: wsUri + (storedClientId ? `?clientId=${storedClientId}` : ''),
  });
  pie.onServerAssignedData = (o) => {
    console.log('serverAssignedData', o);
    window.clientId = o.clientId;
    sessionStorage.setItem('pie-clientId', o.clientId);
  };
  pie.onData = onData;
  pie.onError = ({ message }) => window.alert(message);
  pie.onClientPresenceChanged = onClientPresenceChanged;
  pie.onConnectInfo = (o) => {
    console.log('onConnectInfo', o);
    // Make and join room
    if (o.connected) {
      pie
        .makeRoom(room_info)
        // Since the room_info is hard-coded,
        // if you can't make the room, it may be already made, so try to join it instead.
        .catch(() => pie.joinRoom(room_info))
        .then(() => console.log('You are now in the room'))
        .catch((err: string) => console.error('Failed to join room', err));
    }
  };
}

const messageLog = [];
window.saveReplay = (title) => {
  localStorage.setItem('golems-' + title, JSON.stringify(messageLog));
};
window.replay = (title) => {
  const messages = JSON.parse(localStorage.getItem('golems-' + title));
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    message.fromClient = game.players[0].clientId;
    onData(message);
  }
};
let onDataQueue = [];
function onData(d: { fromClient: string; payload: any }) {
  // Keep data messages in a queue until they are ready to be processed
  if (window.animationManager.animating) {
    onDataQueue.push(d);
    return;
  }
  console.log('onData', d);
  // Temporarily for development
  messageLog.push(d);

  const { payload, fromClient } = d;
  const { type, spell }: { type: MESSAGE_TYPES; spell: Spell } = payload;
  // Get caster
  const caster = game.players.find((p) => p.clientId === fromClient);
  switch (type) {
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      console.log('LOAD GAME STATE');
      // Clean up old game state
      if (game) {
        game.cleanup();
      }
      // Resume game / load game / rejoin game
      const loadedGameState: Game = { ...payload.game };
      game = new Game(loadedGameState.seed);
      game.level = loadedGameState.level;
      game.playerTurnIndex = loadedGameState.playerTurnIndex;
      game.secondsLeftForTurn = loadedGameState.secondsLeftForTurn;
      game.hostClientId = loadedGameState.hostClientId;
      // Load all units that are not player's, those will be loaded indepentently
      game.units = loadedGameState.units
        .filter((u) => u.unitType !== 'PlayerControlled')
        .map((u) => Unit.load(u));
      game.players = loadedGameState.players.map((p) => {
        return {
          ...p,
          unit: Unit.load(p.unit),
        };
      });
      game.pickups = loadedGameState.pickups.map((p) => Pickup.load(p));
      game.restorePlayerCardsInHand();
      game.syncYourTurnState();
      game.setGameState(game_state.Playing);
      // Animate in restored game state
      window.animationManager.startAnimate();
      break;
    case MESSAGE_TYPES.MOVE_PLAYER:
      // Move the player 1 magnitude on either or both axes towards the desired position
      window.animationManager.startGroup('Move player');
      Unit.moveTo(caster.unit, payload.x, payload.y);
      window.animationManager.endGroup('Move player');
      window.animationManager.startAnimate().then(() => {
        // When animations are done, check if the player collided with any pickups
        window.game.checkPickupCollisions(caster);
        // Moving the player unit ends your turn
        endPlayerTurn(caster.clientId);
      });
      break;
    case MESSAGE_TYPES.SPELL:
      // Set caster based on which client sent it
      spell.caster = caster;
      if (
        // Only allow casting during the PlayerTurns phase
        (game.turn_phase === turn_phase.PlayerTurns &&
          // If your turn and you are casting, allow
          game.yourTurn &&
          spell.caster.clientId === window.clientId) ||
        // or if not your turn and opponent is casting, allow
        (!game.yourTurn && spell.caster.clientId !== window.clientId)
      ) {
        game.cast(spell);
        // Animate the spells
        window.animationManager.startAnimate().then(() => {
          // Casting a spell ends your turn
          endPlayerTurn(caster.clientId);
        });
      } else {
        console.log('Someone is trying to cast out of turn');
      }
      break;
    case MESSAGE_TYPES.END_TURN:
      endPlayerTurn(caster.clientId);
      // TODO
      // if (all_players_ended_turn) {
      // game.nextTurn().then(() => {
      // Animations complete
      // const queue = [...onDataQueue];
      // Clear the queue
      // onDataQueue = [];
      // Allow new messages
      // for (let d of queue) {
      // onData(d);
      // }
      // });
      // }
      break;
  }
}
function endPlayerTurn(clientId) {
  const currentTurnPlayer = game.players[game.playerTurnIndex];
  // Ensure players can only end the turn when it IS their turn
  if (currentTurnPlayer.clientId === clientId) {
    game.endedTurn.add(clientId);
    game.incrementPlayerTurn();
  }
}
function onClientPresenceChanged(o: ClientPresenceChangedArgs) {
  console.log('clientPresenceChanged', o);
  clients = o.clients;
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
      if (!game.players.find((p) => p.clientId === o.clientThatChanged)) {
        game.players.push(Player.create(o.clientThatChanged));
      }
      // Send game state to other player so they can load:
      pie.sendData({
        type: MESSAGE_TYPES.LOAD_GAME_STATE,
        game: {
          ...game,
          players: game.players.map((p) => ({
            ...p,
            unit: {
              ...p.unit,
              image: {
                ...p.unit.image,
                sprite: null,
              },
            },
          })),
          units: game.units.map((u) => ({
            ...u,
            image: {
              ...u.image,
              sprite: null,
            },
          })),
          pickups: game.pickups.map((p) => ({
            ...p,
            image: {
              ...p.image,
              sprite: null,
            },
          })),
        },
      });
    }
  } else {
    // client left

    // if host left
    if (o.clientThatChanged === game.hostClientId) {
      console.log('host left');
      // Set host to the 0th client that is still connected
      const sortedClients = o.clients.sort();
      game.hostClientId = sortedClients[0];
    }
  }
}
function makeGame(clients: string[]) {
  // Sort clients to make sure they're always in the same order, regardless of
  // what order they joined the game (client refreshes can change the order)
  const sortedClients = clients.sort();
  for (let i = 0; i < sortedClients.length; i++) {
    const c = clients[i];
    const p = Player.create(c);
    game.players.push(p);
  }
  game.setGameState(game_state.Playing);
  // Initialize the first level
  game.initLevel();
}
window.connect = connect;

declare global {
  interface Window {
    connect: typeof connect;
    // Animation manager is globally accessable
    animationManager: AnimationManager;
    game: Game;
    pie: any;
    // Save pie messages for later replay
    saveReplay: (title: string) => void;
    // Used to replay onData messages for development
    replay: (messages: string[]) => void;
    // Current clients id
    clientId: string;
    // Debug on screen:
    setDebug: (json: object) => void;
  }
}
