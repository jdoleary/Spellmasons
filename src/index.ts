import PieClient, { ClientPresenceChangedArgs } from 'pie-client';
import Game, { game_state } from './Game';
import Player from './Player';
import Image from './Image';
import type { Spell } from './Spell';
import AnimationManager from './AnimationManager';
import { BOARD_HEIGHT } from './config';

// Mount svelte app
// @ts-ignore
import App from './ui/App.svelte';
new App({
  target: document.getElementById('svelte'),
});
// End mount svelte app

let clients = [];

const wsUri = 'wss://websocket-pie-e4elx.ondigitalocean.app/';
let pie: PieClient;
let game: Game = new Game();
let maxClients = 2;
function connect(_room_info = {}) {
  const room_info = Object.assign(_room_info, {
    app: 'Golems',
    version: '0.1.0',
    maxClients,
  });
  maxClients = room_info.maxClients;
  window.pie = pie = new PieClient({
    env: import.meta.env.MODE,
    wsUri: wsUri,
  });
  pie.onServerAssignedData = (o) => {
    console.log('serverAssignedData', o);
    window.clientId = o.clientId;
  };
  pie.onData = onData;
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
// Keeps track of which players have ended their turn
let turn_finished = {};
export enum MESSAGE_TYPES {
  SPELL,
  END_TURN,
  LOAD_GAME_STATE,
}

function onData(d: { fromClient: string; payload: any }) {
  console.log('onData', d);
  const { payload, fromClient } = d;
  const { type, spell } = payload;
  // Get caster
  const caster = game.players.find((p) => p.client_id === fromClient);
  switch (type) {
    case MESSAGE_TYPES.LOAD_GAME_STATE:
      // Resume game
      const loadedGameState = { ...payload.game };
      const players = loadedGameState.players;
      const spells = loadedGameState.spells.map((s) => {
        return {
          caster: players.find((p) => p.client_id === s.caster.client_id),
          ...s,
        };
      });
      const units = loadedGameState.units.map((u) => {
        return {
          ...u,
          image: new Image(u.x, u.y, u.vx, u.vy, u.image.imageName),
        };
      });
      game.players = players;
      game.spells = spells;
      game.units = units;
      game.setGameState(game_state.Playing);
      break;
    case MESSAGE_TYPES.SPELL:
      // Set caster based on which client sent it
      spell.caster = caster;
      game.queueSpell(spell);
      break;
    case MESSAGE_TYPES.END_TURN:
      turn_finished[fromClient] = true;
      window.addToLog(`Player ${fromClient} ends turn.`);
      let all_players_ended_turn = true;
      for (let p of game.players) {
        if (!turn_finished[p.client_id]) {
          all_players_ended_turn = false;
          break;
        }
      }
      if (all_players_ended_turn) {
        turn_finished = {};
        game.nextTurn();
      }
      break;
  }
}
function onClientPresenceChanged(o: ClientPresenceChangedArgs) {
  console.log('clientPresenceChanged', o);
  clients = o.clients;
  // Client joined
  if (o.present) {
    // Start game when maxClients reached
    if (game.state == game_state.Lobby && clients.length === maxClients) {
      makeGame(clients);
    } else if (game.state == game_state.WaitingForPlayerReconnect) {
      // Send game state to other player so they can load:
      pie.sendData({
        type: MESSAGE_TYPES.LOAD_GAME_STATE,
        game: {
          ...game,
          units: game.units.map((u) => {
            // Remove circular ref and image.element
            const { element, ...rest } = u.image;
            return { ...u, game: null, image: rest };
          }),
        },
      });
    }
  } else {
    // Client left
    game.setGameState(game_state.WaitingForPlayerReconnect);
  }
}
function makeGame(clients: string[]) {
  console.log('Initialize game state');
  game.setGameState(game_state.Playing);
  for (let i = 0; i < clients.length; i++) {
    const c = clients[i];
    const p = new Player();
    if (i == 0) {
      p.heart_y = -1;
      window.addToLog(`You are at the top`, c);
    } else {
      p.heart_y = BOARD_HEIGHT;
      window.addToLog(`You are at the bottom`, c);
    }
    console.log('init', c, p);
    p.client_id = c;
    game.players.push(p);
  }

  // Test; TODO remove
  window.game = game;
}
window.connect = connect;

// Connect to PieServer
connect();
window.animationManager = new AnimationManager();

declare global {
  interface Window {
    connect: typeof connect;
    // Animation manager is globally accessable
    animationManager: AnimationManager;
    game: Game;
    pie: any;
    // A log of game happenings
    log: string[];
    addToLog: (message: string, ifOwnIdIs?: string) => void;
    // Current clients id
    clientId: string;
  }
}

window.log = [];
function addToLog(message: string, ifOwnIdIs?: string) {
  if (!ifOwnIdIs || ifOwnIdIs === window.clientId) {
    window.log.push(message);
    document.getElementById('log').innerText = window.log.join('\n');
  }
}
window.addToLog = addToLog;
