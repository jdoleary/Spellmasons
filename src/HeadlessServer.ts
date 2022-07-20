import { version } from '../package.json';
import './Shims';
import * as Cards from './cards';
import * as Units from './entity/units';
import { getClients, hostGiveClientGameStateForInitialLoad, IHostApp, onClientPresenceChanged } from './network/networkUtil';
import Underworld from './Underworld';
import * as readyState from './readyState';
const pie = require('@websocketpie/server');
globalThis.SPELLMASONS_PACKAGE_VERSION = version;
// Init underworld so that when clients join they can use it as the canonical
// record of gamestate
headlessStartGame();
// Headless does not includee a player of it's own, it's just the host
globalThis.player = undefined;
// This file is the entrypoint for the headless server and must set globalThis.headless
// to true to denote that there is no graphics nor audio code
globalThis.headless = true;
// hostApp (headless server) is always the host
globalThis.isHost = () => true;
globalThis.forceMove = [];
globalThis.playerThoughts = {};
globalThis.forceMove = [];

function headlessStartGame() {
    console.log('jtest here')


    pie.startServer({
        port: 8081, makeHostAppInstance: () => {
            globalThis.pie = new HostApp();
            console.log('Start Game: Attempt to start the game')
            const gameAlreadyStarted = globalThis.underworld && globalThis.underworld.levelIndex >= 0;
            // if the game hasn't already been started
            if (!gameAlreadyStarted) {
                console.log('Host: Start game / Initialize Underworld');
                globalThis.underworld = new Underworld(Math.random().toString());
                // Mark the underworld as "ready"
                readyState.set('underworld', true);
                globalThis.lastLevelCreated = globalThis.underworld.syncronousInitLevel(0);
                console.log('Host: Send all clients game state for initial load');
                getClients().forEach(clientId => {
                    hostGiveClientGameStateForInitialLoad(clientId, globalThis.lastLevelCreated);
                });
            } else {
                console.log('Start Game: Won\'t, game has already been started');
            }
            return globalThis.pie;
        }
    });
}


// Copied from @websocketpie/client
// @websocketpie/client is only meant for the browser so it shall not be imported
// in the node-only HeadlessServer
interface OnDataArgs {
    type: string;
    subType: string;
    fromClient: string;
    payload: any;
    time: number;
}
class HostApp implements IHostApp {
    isHostApp: boolean = true;
    // Automatically overridden when passed into pie.startServer
    sendData: (msg: string) => void = () => { };
    constructor() {
        // Initialize content
        Cards.registerCards();
        Units.registerUnits();
    }
    onData(data: any) {
        console.log('onData', data);
    }
    // The host will receive all data that is send from a client
    // to the @websocketpie/server
    handleMessage(message: OnDataArgs) {
        console.log('HostApp received: ', message.type, message)
        switch (message.type) {
            case MessageType.Data:
                if (this.onData) {
                    this.onData(message);
                }
                break;
            case MessageType.ResolvePromise:
                // const funcNameForResolve = message.func as keyof typeof this.promiseCBs;
                // const promiseCbRes = this.promiseCBs[funcNameForResolve];
                // if (promiseCbRes) {
                //     promiseCbRes.resolve(message.data);
                // }
                break;
            case MessageType.RejectPromise:
                // const funcNameForReject = message.func as keyof typeof this.promiseCBs;
                // const promiseCbRej = this.promiseCBs[funcNameForReject];
                // if (promiseCbRej) {
                //     promiseCbRej.reject(message.err);
                // }
                break;
            case MessageType.ServerAssignedData:
                // this.clientId = message.clientId;
                // if (this.onServerAssignedData) {
                //     this.onServerAssignedData(message);
                // }
                break;
            case MessageType.ClientPresenceChanged:
                onClientPresenceChanged(message as any);
                // this._updateDebugInfo(message);
                // // If client is accepting the onClientPresenceChanged callback,
                // // send the message to it
                // if (this.onClientPresenceChanged) {
                //     this.onClientPresenceChanged(message);
                // }
                break;
            case MessageType.Rooms:
                // if (this.onRooms) {
                //     this.onRooms(message);
                // }
                break;
            case MessageType.Err:
                console.error(message);
                break;
            default:
                console.log(message);
                console.error(`Above message of type ${message.type} not recognized!`);
        }
    }
}
// Copied from PieClient
const MessageType = {
    // Both client and server:
    Data: 'Data',
    // Server to client:
    Rooms: 'Rooms',
    ClientPresenceChanged: 'ClientPresenceChanged',
    ServerAssignedData: 'ServerAssignedData',
    Err: 'Err',
    ResolvePromise: 'ResolvePromise',
    RejectPromise: 'RejectPromise',
    // Client to Server:
    JoinRoom: 'JoinRoom',
    LeaveRoom: 'LeaveRoom',
    GetRooms: 'GetRooms',
    // Unique to PieClient
    ConnectInfo: 'ConnectInfo',
};