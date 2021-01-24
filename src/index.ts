// @ts-ignore
import wsPie from 'pie-client';
import Game from './Game';
import Player from './Player';
let clientId = 0;
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
  pie = new wsPie(
    Object.assign(
      {
        env: import.meta.env.MODE,
        wsUri: wsUri,
        onServerAssignedData: (o: any) => {
          console.log('serverAssignedData', o);
          clientId = o.clientId;
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
        onData: console.log,
      },
      pieArgs,
    ),
  );
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
    for (let c of clients) {
      const p = new Player();
      p.client_id = c;
      game.players.push(p);
    }
    document.getElementById('test')?.addEventListener('click', () => {
      pie.sendData({ test: 1 });
    });
  }
}
// @ts-ignore
window.connect = connect;

connect();
