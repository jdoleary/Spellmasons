import { version } from '../package.json';
import './Shims';
import * as Cards from './cards';
import * as Units from './entity/units';
import { getClients, hostGiveClientGameStateForInitialLoad, IHostApp, onClientPresenceChanged } from './network/networkUtil';
import Underworld from './Underworld';
import * as readyState from './readyState';
import { onData } from './network/networkHandler';
const pie = require('@websocketpie/server');
globalThis.SPELLMASONS_PACKAGE_VERSION = version;
// Init underworld so that when clients join they can use it as the canonical
// record of gamestate
headlessStartGame();
// This file is the entrypoint for the headless server and must set globalThis.headless
// to true to denote that there is no graphics nor audio code
globalThis.headless = true;
// hostApp (headless server) is always the host
globalThis.isHost = () => true;
// Headless does not includee a player of it's own, it's just the host
globalThis.player = undefined;


// TODO: The following need to be specific to a host app
// globalThis.pie
// globalThis.lastLeveLCreated
// readyState.underworld

function headlessStartGame() {
    console.log('Headless Server Started')


    pie.startServer({
        port: 8081, makeHostAppInstance: () => {
            const hostAppInst = new HostApp();
            globalThis.pie = hostAppInst;
            console.log('Start Game: Attempt to start the game')
            console.log('Host: Start game / Initialize Underworld');
            hostAppInst.underworld = new Underworld(Math.random().toString());
            // Mark the underworld as "ready". This is important even for headless so that it doesn't
            // try to process it's own INIT_GAME_STATE messages
            readyState.set('underworld', true, hostAppInst.underworld);
            // Headless makes it's own wsPieConnection
            readyState.set('wsPieConnection', true, hostAppInst.underworld);
            // Headless makes it's own room
            readyState.set('wsPieRoomJoined', true, hostAppInst.underworld);
            // Headless does NOT use graphics so this can be set to true immediately
            readyState.set('pixiAssets', true, hostAppInst.underworld);
            // Initialize content
            Cards.registerCards();
            Units.registerUnits();
            readyState.set("content", true, hostAppInst.underworld);
            // Generate the level data
            hostAppInst.underworld.lastLevelCreated = hostAppInst.underworld.generateLevelDataSyncronous(0);
            // Actually create it
            hostAppInst.underworld.createLevelSyncronous(hostAppInst.underworld.lastLevelCreated);
            console.log('Host: Send all clients game state for initial load');
            getClients().forEach(clientId => {
                hostGiveClientGameStateForInitialLoad(clientId, hostAppInst.underworld, hostAppInst.underworld.lastLevelCreated);
            });
            return hostAppInst;
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
    underworld: Underworld = new Underworld(Math.random().toString());
    constructor() { }
    onData(data: any) {
        onData(data, this.underworld);
    }
    cleanup() {
        this.underworld.cleanup();
    }
    // The host will receive all data that is send from a client
    // to the @websocketpie/server
    handleMessage(message: OnDataArgs) {
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
                onClientPresenceChanged(message as any, this.underworld);
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