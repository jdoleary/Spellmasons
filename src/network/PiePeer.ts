// @ts-ignore: Import is fine
import SimplePeer from "simple-peer/simplepeer.min.js";
import { v4 as uuidv4 } from 'uuid';

export const MessageType = {
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
    GetStats: 'GetStats',
    // Unique to PieClient
    ConnectInfo: 'ConnectInfo',
};

// This will be different for every client
const defaultIdForSolomode = uuidv4();

export interface ConnectInfo {
    type: string;
    connected: boolean;
    msg: string;
}
export interface ServerAssignedData {
    type: string;
    clientId: string;
    // The @websocketpie/server version
    serverVersion: string;
    // The version of the hostApp software optionally running on websocketpie
    hostAppVersion: string;
}
export interface OnDataArgs {
    type: string;
    subType: string;
    fromClient: string;
    payload: any;
    time: number;
}
export interface ClientPresenceChangedArgs {
    type: string;
    clients: string[];
    time: number;
}
export interface Room {
    app: string;
    name: string;
    version: string;
    maxClients?: number;
    togetherTimeoutMs?: number;
    hidden?: boolean;
    password?: string;
}
export interface OnRoomsArgs {
    type: string;
    rooms: Room[];
}

export interface Latency {
    min: number;
    max: number;
    averageDataPoints: number[];
    average: number;
}
function debug(...args: any) {
    console.debug('PiePeer', ...args);
}
function log(...args: any) {
    console.log('PiePeer', ...args);
}
function error(...args: any) {
    console.error('PiePeer', ...args);
}
const maxLatencyDataPoints = 14;
export default class PiePeer {
    // onData: a callback that is invoked when data is recieved from PieServer
    onData?: (x: OnDataArgs) => void;
    onError?: ((x: { message: string }) => void);
    // onServerAssignedData: a callback that is invoked with the user's client data that is assigned when
    // connecting to a PieServer
    onServerAssignedData?: ((x: ServerAssignedData) => void);
    // onClientPresenceChanged: is invoked when a client joins or leaves a room that
    // the current client is connected to
    onClientPresenceChanged?: ((c: ClientPresenceChangedArgs) => void);
    onRooms?: ((x: OnRoomsArgs) => void);
    onConnectInfo?: ((c: ConnectInfo) => void);
    // onLatency receives latency information if useStats is
    // set to true
    onLatency?: (l: Latency) => void;
    // a flag to determine if latency stats should be recorded
    // Results are sent to the onLatency callback
    useStats: boolean;
    // soloMode fakes a connection so that the pieClient API can be used
    // with a single user that echos messages back to itself.
    soloMode: boolean;
    // promiseCBs is useful for storing promise callbacks (resolve, reject)
    // that need to be invoked in a different place than where they were created.
    // Since PieClient does a lot of asyncronous work through websockets, a 
    // promise that was created with the sending of one message
    // over a websocket must be able to be resolved by the reception of another
    // message over a websocket. promiseCBs fascilitates this pattern.
    promiseCBs: {
        joinRoom?: { resolve: (x: any) => void, reject: (x: any) => void };
    };
    // Stores information of the current room to support automatic re-joining
    currentRoomInfo?: Room;
    // This is a main difference between piePeer and wsPieClient.  PiePeer has a SimplePeer connection
    // whereas wsPieClient has a WebSocket connection
    peer?: SimplePeer;
    stats: {
        latency: Latency;
    };
    // the server-assigned id of the current client
    clientId: string;
    // a setTimeout id used to try to reconnect after accidental disconnection
    // with a built in falloff
    reconnectTimeoutId?: ReturnType<typeof setTimeout>;
    // a timeout to check if the server sends a 'ping' message
    heartbeatTimeout?: ReturnType<typeof setTimeout>;
    // The number of reconnect attempts since successful connection
    reconnectAttempts: number;
    cancelNextReconnectAttempt: boolean;

    constructor() {
        this.onError = error;
        this.soloMode = false;
        this.reconnectAttempts = 0;
        this.promiseCBs = {
            joinRoom: undefined,
        };
        this.useStats = false;
        this.clientId = defaultIdForSolomode;
        this.stats = {
            latency: {
                min: Number.MAX_SAFE_INTEGER,
                max: 0,
                averageDataPoints: [],
                average: NaN,
            },
        };
        this.cancelNextReconnectAttempt = false;

        window.addEventListener('online', () => {
            log('Network online');
            this._updateDebugInfo();
        });
        window.addEventListener('offline', () => {
            log('Network offline');
            this._updateDebugInfo();
        });

    }
    // See https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
    isConnected(): boolean {
        return this.soloMode
            || window.navigator.onLine && !!this.peer && this.peer.isConnected();
    }
    // heartbeat is used to determine on the client-side if the client is unaware that 
    // it is disconnected from the server.
    // When invoked, it will wait a specified amount of time and if the heartbeatTimeout
    // is not canceled it will report that latency is too high.
    heartbeat() {
        if (this.soloMode) {
            // Do not run heartbeat checks in soloMode because there is no server in
            // solomode and it would always cause the heartbeat error to log.
            return;
        }
        log('heartbeat not yet supported');
    }
    // Used to join a default room so you can connect and start passing
    // messages right away without having to join a room explicitly
    async quickConnect(wsUrl: string) {
        debug('quickConnect not needed');
    }
    async connect(wsUrl: string, useStats: boolean = false): Promise<void> {
        debug('connect not needed');
    }
    async connectSolo() {
        // Disconnect if currently connected so we can fake a singleplayer connection
        await this.disconnect();
        this.soloMode = true;
        this.peer = undefined;
        if (this.onConnectInfo) {
            this.onConnectInfo({
                type: MessageType.ConnectInfo,
                connected: this.isConnected(),
                msg: `"Connected" in solo mode`,
            });
        }
        this._updateDebugInfo();
        // Fake serverAssignedData
        this.handleMessage({
            type: MessageType.ServerAssignedData,
            clientId: this.clientId,
            serverVersion: `no server - client is in solomode`,
        }, false);
    }
    onClose = () => {
        log(`Connection closed.`);
        this._updateDebugInfo();
        // If client is accepting the onConnectInfo callback,
        // send the message to it
        if (this.onConnectInfo) {
            this.onConnectInfo({
                type: MessageType.ConnectInfo,
                connected: this.isConnected(),
                msg: `Connection closed.`,
            });
        }

    }
    tryReconnect = () => {
        debug('tryReconnect not yet supported.');
        // Try reconnect
        clearTimeout(this.reconnectTimeoutId);
    }
    async disconnect(): Promise<void> {
        // Stop attempt to auto reconnect if a manual disconnect occurs
        clearTimeout(this.reconnectTimeoutId);
        // If disconnect is invoked while a connect() is already in progress this will
        // prevent it from trying to reconnect again after it fails
        this.cancelNextReconnectAttempt = true;
        return new Promise<void>(resolve => {
            if (this.soloMode) {
                this.soloMode = false;
                resolve();
                log('"Disconnected" from soloMode');
                return
            }
            if (!this.peer || !this.peer.isConnected()) {
                // Resolve immediately, client is already not connected 
                log('Attempted to disconnect but there was no preexisting connection to disconnect from.');
                resolve();
                return
            } else {
                this.peer.destroy();
                this.peer = undefined;
                // Updates debug info to show that it is closing
                this._updateDebugInfo();
                log('Disconnected.');
            }
        }).then(() => {
            // Updates debug info to show that it is closed
            this._updateDebugInfo();
        });

    }
    handleMessage(message: any, useStats: boolean) {
        if (useStats && message.time) {
            const currentMessageLatency = Date.now() - message.time;
            if (currentMessageLatency > this.stats.latency.max) {
                this.stats.latency.max = currentMessageLatency;
            }
            if (currentMessageLatency < this.stats.latency.min) {
                this.stats.latency.min = currentMessageLatency;
            }
            this.stats.latency.averageDataPoints.push(currentMessageLatency);

            if (this.stats.latency.averageDataPoints.length > maxLatencyDataPoints) {
                // Remove the oldest so the averageDataPoints array stays a fixed size
                this.stats.latency.averageDataPoints.shift();
                this.stats.latency.average =
                    this.stats.latency.averageDataPoints.reduce((acc, cur) => acc + cur, 0) /
                    this.stats.latency.averageDataPoints.length;
                // Broadcast latency information
                if (this.onLatency) {
                    this.onLatency(this.stats.latency);
                }
            }
        }
        switch (message.type) {
            case MessageType.Data:
                if (this.onData) {
                    this.onData(message);
                }
                break;
            case MessageType.ResolvePromise:
                const funcNameForResolve = message.func as keyof typeof this.promiseCBs;
                const promiseCbRes = this.promiseCBs[funcNameForResolve];
                if (promiseCbRes) {
                    promiseCbRes.resolve(message.data);
                }
                break;
            case MessageType.RejectPromise:
                const funcNameForReject = message.func as keyof typeof this.promiseCBs;
                const promiseCbRej = this.promiseCBs[funcNameForReject];
                if (promiseCbRej) {
                    promiseCbRej.reject(message.err);
                }
                break;
            case MessageType.ServerAssignedData:
                this.clientId = message.clientId;
                if (this.onServerAssignedData) {
                    this.onServerAssignedData(message);
                }
                break;
            case MessageType.ClientPresenceChanged:
                this._updateDebugInfo(message);
                // If client is accepting the onClientPresenceChanged callback,
                // send the message to it
                if (this.onClientPresenceChanged) {
                    this.onClientPresenceChanged(message);
                }
                break;
            case MessageType.Rooms:
                if (this.onRooms) {
                    this.onRooms(message);
                }
                break;
            case MessageType.Err:
                error(message);
                if (this.onError) {
                    this.onError(message);
                }
                break;
            default:
                log(message);
                error(`Above message of type ${message.type} not recognized!`);
        }
    }
    // Remember to catch the rejected promise if used outside of this library
    makeRoom(roomInfo: Room) {
        // TODO(p2p): host
    }
    // Remember to catch the rejected promise if used outside of this library
    joinRoom(roomInfo: Room, makeRoomIfNonExistant: boolean = false) {
        // TODO(p2p): join
        if (this.isConnected()) {
            // Cancel previous makeRoom promise if it exists
            // @ts-ignore
            if (this.promiseCBs[MessageType.JoinRoom]) {
                // @ts-ignore
                this.promiseCBs[MessageType.JoinRoom].reject({ message: `Cancelled due to newer ${MessageType.JoinRoom} request` });
            }
            return new Promise((resolve, reject) => {
                // Assign callbacks so that the response from the server can
                // fulfill this promise
                // @ts-ignore
                this.promiseCBs[MessageType.JoinRoom] = { resolve, reject };
                if (this.soloMode) {
                    // Now that client has joined a room in soloMode, send a 
                    // manufactured clientPresenceChanged as if it came from the server
                    // because pieClient fakes all server messages when in soloMode
                    this.handleMessage({
                        clients: [this.clientId],
                        time: Date.now(),
                        type: MessageType.ClientPresenceChanged,
                        present: true,
                    }, false);
                    resolve(roomInfo)
                }

            }).then((currentRoomInfo: any) => {
                if (typeof currentRoomInfo.app === 'string' && typeof currentRoomInfo.name === 'string' && typeof currentRoomInfo.version === 'string') {
                    log(`${MessageType.JoinRoom} successful with`, currentRoomInfo);
                    // Save roomInfo to allow auto rejoining should the server restart
                    this.currentRoomInfo = currentRoomInfo;
                    // Readd password since it isn't serialized in @websocketpie/server@1.0.2
                    // This if statement can be safely removed after @websocketpie/server is updated
                    if (this.currentRoomInfo && !this.currentRoomInfo.password && roomInfo.password) {
                        this.currentRoomInfo.password = roomInfo.password
                    }
                } else {
                    error("joinRoom succeeded but currentRoomInfo is maleformed:", currentRoomInfo);
                }
            });
        } else {
            return Promise.reject({ message: `${MessageType.JoinRoom} failed, not currently connected to web socket server` });
        }
    }
    leaveRoom() {
        this.disconnect();
        // Clear currentRoomInfo even if pie is connected in soloMode
        this.currentRoomInfo = undefined;
        if (this.soloMode) {
            // Clear clientId if exiting a room in soloMode
            // Note: The clientId will be retained in actual multiplayer
            // so that a client can rejoin a server if they wish
            this.clientId = '';
        }
    }
    getRooms(roomInfo: any) {
        debug('getRooms not supported.');
    }
    sendData(payload: any, extras?: any) {
        if (this.isConnected()) {
            const message = {
                type: MessageType.Data,
                payload,
                ...extras,
            };
            if (this.peer !== undefined) {
                this.peer.send(JSON.stringify(message));
            } else if (this.soloMode) {
                // In soloMode there is no this.ws so just handle the message immediately as 
                // if it bounced back from PieServer
                this.handleMessage({
                    fromClient: this.clientId,
                    time: Date.now(),
                    ...message
                }, false);
            } else {
                error('Unexpected: Attempted to send data but this.ws is undefined and not in soloMode');
            }
        } else {
            if (this.onError) {
                this.onError({ message: `Cannot send data to room, not currently connected to web socket server` });
            }
        }
    }
    _updateDebugInfo(message?: { clients: object[] }) {
        debug('TODO: update debug info');
    }
}