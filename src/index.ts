// @ts-ignore
import wsPie from 'pie-client';
import Game from './Game';
import Player from './Player';
import type { Spell } from './Spell';
import { CELL_SIZE } from './Image';
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
let pie: any;
let game: Game;
let max_clients = 2;
function connect(pieArgs = {}, _room_info = {}) {
  const room_info = Object.assign(_room_info, {
    app: 'Golems',
    version: '0.1.0',
    max_clients,
  });
  max_clients = room_info.max_clients;
  window.pie = pie = new wsPie(
    Object.assign(
      {
        env: import.meta.env.MODE,
        wsUri: wsUri,
        onServerAssignedData: (o: any) => {
          console.log('serverAssignedData', o);
          window.clientId = o.clientId;
        },
        onClientPresenceChanged,
        onConnectInfo: (o: any) => {
          console.log('onConnectInfo', o);
          // Make and join room
          if (o.connected) {
            pie
              .makeRoom(room_info)
              // Since the room_info is hard-coded,
              // if you can't make the room, it may be already made, so try to join it instead.
              .catch(() => pie.joinRoom(room_info))
              .then(() => console.log('You are now in the room'))
              .catch((err: string) =>
                console.error('Failed to join room', err),
              );
          }
        },
        onData,
      },
      pieArgs,
    ),
  );
}
// Keeps track of which players have ended their turn
let turn_finished = {};
export enum MESSAGE_TYPES {
  SPELL,
  END_TURN,
}

function onData(d: {
  fromClient: string;
  payload: {
    type: MESSAGE_TYPES;
    spell?: Spell;
  };
}) {
  console.log('onData', d);
  const { payload, fromClient } = d;
  const { type, spell } = payload;
  // Get caster
  const caster = game.players.find((p) => p.client_id === fromClient);
  switch (type) {
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
function onClientPresenceChanged(o: any) {
  console.log('clientPresenceChanged', o);
  clients = o.clients;
  // Start game when max_clients reached
  if (pie && clients.length === max_clients) {
    makeGame(clients);
  } else {
    console.error('Failed to make game');
  }
}
function makeGame(clients: string[]) {
  if (!game) {
    console.log('Initialize game state');
    game = new Game();
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
