"use strict";
// @ts-ignore, instantiate window object so that node can use `window` as the global
global.window = {};
// This file is the entrypoint for the headless server and must set window.headless
// to true to denote that there is no graphics nor audio code
window.headless = true;
// hostApp (headless server) is always the host
window.isHost = () => true;
window.forceMove = [];
// Intentionally undefined because headless shouldn't consider prediction units
// Prediction units are only for UI
window.predictionUnits = undefined;

import './types/globalTypes';
import './Shims';

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
import * as Cards from './cards';
import * as Units from './entity/units';
import { IHostApp, onClientPresenceChanged } from './network/networkUtil';

const pie = require('@websocketpie/server');

pie.startServer({
    port: 8081, makeHostAppInstance: () => {
        window.pie = new HostApp();
        return window.pie;
    }
});
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