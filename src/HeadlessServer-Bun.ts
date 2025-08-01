// This file is the entrypoint for the headless server and must set globalThis.headless
// to true to denote that there is no graphics nor audio code
globalThis.headless = true;
import { enableRemoteLogging } from "./RemoteLogging";
import { version } from '../package.json';
globalThis.SPELLMASONS_PACKAGE_VERSION = version;
enableRemoteLogging();
const release = `spellmasons@${version}`;

// Type guard that checks if a value is null or undefined
globalThis.isNullOrUndef = <T>(x: T): x is Extract<T, null | undefined> => {
    return x === undefined || x === null;
};

// Type guard that checks if a value exists (is not null or undefined)
globalThis.exists = <T>(x: T): x is NonNullable<T> => {
    return !globalThis.isNullOrUndef(x);
};
import './Shims';
// Setup mods
import SpellmasonsAPI from './api';
globalThis.SpellmasonsAPI = SpellmasonsAPI;
// @ts-expect-error
import('./SpellmasonsMods.cjs.js');

import { IHostApp, onClientPresenceChanged } from './network/networkUtil';
import { onData } from './network/networkHandler';
import makeOverworld, { Overworld } from "./Overworld";
import Underworld from "./Underworld";
import { SERVER_HUB_URL } from "./config";
import { MESSAGE_TYPES } from "./types/MessageTypes";
// @ts-ignore Bun will be defined if using bun
const isUsingBun = typeof Bun !== 'undefined';
const pie = isUsingBun ? require('@websocketpie/server-bun') : require('@websocketpie/server');
// Init underworld so that when clients join they can use it as the canonical
// record of gamestate
const PORT = process.env.PORT || 8080;
// Turn off wsPie logs
process.env.quiet = 'yes';
// hostApp (headless server) is always the host
globalThis.isHost = () => true;
// Headless does not includee a player of it's own, it's just the host
globalThis.player = undefined;
globalThis.isSuperMe = false;
globalThis.numberOfHotseatPlayers = 1;
globalThis.useEventLogger = false;

fetch(SERVER_HUB_URL, {
    method: "GET",
    headers: { 'Content-Type': 'application/json' },
}).then(x => x.json()).then(({ config }) => {
    if (config) {
        globalThis.useEventLogger = config.useEventLogger;
        // Get server stability config from spellmasons.com's json config
        // ---
        // Hack: Right now the serverRegion env is set on all digital ocean servers
        // If this is running on a digital ocean server, set serverStability limits
        // via spellmasons.com's feature flags so that community servers limit
        // the max number of units and pickups so they don't crash.
        // Non community servers may have any number of units or pickups since they
        // are not shared
        if (globalThis.headless && process.env.serverRegion) {
            let _serverStabilityMaxUnits = config.serverStabilityMaxUnits;
            let _serverStabilityMaxPickups = config.serverStabilityMaxPickups;
            let serverStabilityMaxUnits = _serverStabilityMaxUnits !== undefined ? parseInt(_serverStabilityMaxUnits) : undefined;
            let serverStabilityMaxPickups = _serverStabilityMaxPickups !== undefined ? parseInt(_serverStabilityMaxPickups) : undefined;
            globalThis.serverStabilityMaxUnits = serverStabilityMaxUnits;
            globalThis.serverStabilityMaxPickups = serverStabilityMaxPickups;
        }
    }

    console.log('Use event logger:', globalThis.useEventLogger);
}).catch(e => console.error('Could not fetch config from serverList', e))

function headlessStartGame() {
    console.log('Headless Server Started at port ', PORT);
    pie.startServer({
        port: PORT, allowStats: true, roomCleanupDelay: 0, makeHostAppInstance: () => {
            const hostAppInst = new HostApp();
            console.log('Start Game: Attempt to start the game')
            console.log('Host: Start game / Initialize Underworld');
            if (hostAppInst.overworld.underworld) {
                // Generate the level data
                hostAppInst.overworld.underworld.lastLevelCreated = hostAppInst.overworld.underworld.generateLevelDataSyncronous(0);
                // Actually create the level 
                hostAppInst.overworld.underworld.createLevelSyncronous(hostAppInst.overworld.underworld.lastLevelCreated);
            } else {
                console.error('hostApp overworld does not have an underworld to initialize.');
            }
            return hostAppInst;
        }
    });
    process.send?.({ running: true });
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
    // HostApp should have the Spellmasons version to ensure the clients and server are running the same version
    version = version;
    // Automatically overridden when passed into pie.startServer
    sendData: (msg: string) => void = () => { };
    overworld: Overworld;
    soloMode: boolean;
    constructor() {
        this.overworld = makeOverworld(this);
        // HostApp is run on a server for multiplayer and therefore is never in soloMode.
        this.soloMode = false;
        new Underworld(this.overworld, this.overworld.pie, Math.random().toString());
    }
    onData(data: any): any {
        onData(data, this.overworld);
    }
    cleanup() {
    }
    // The host will receive all data that is send from a client
    // to the @websocketpie/server
    handleMessage(message: OnDataArgs) {
        switch (message.type) {
            case MessageType.Data:
                if (this.onData) {
                    this.onData(message);
                    if (message.payload.type === MESSAGE_TYPES.SPELL && !message.payload.syncState) {
                        // Transform the message to prevent it from triggering,
                        // headless will send it's own SPELL message
                        // that will add the sync state onto it
                        return {
                            doNotEcho: true
                        }

                    } else if (message.payload.type === MESSAGE_TYPES.END_TURN && !message.payload.playersTurnEnded) {
                        // END_TURN messages are intercepted by server and have playerTurnEded appended
                        // so the original message should not be echo'd, only the transformed message
                        return {
                            doNotEcho: true
                        }
                    }
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
                onClientPresenceChanged(message as any, this.overworld);
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
        return undefined;
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


headlessStartGame();