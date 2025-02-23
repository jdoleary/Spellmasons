// @ts-ignore: Import is fine
import SimplePeer from "simple-peer/simplepeer.min.js";
import * as storage from '../storage';
import { v4 as uuidv4 } from 'uuid';
import { host } from "./p2p/host";
import { SERVER_HUB_URL } from "../config";
import { join } from "./p2p/client";
import { syncLobby } from "../entity/Player";

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

const hubURL = SERVER_HUB_URL + '/p2p'
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
let lastRoomInfo: Room;

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
    isP2PHost?: boolean;
    // promiseCBs is useful for storing promise callbacks (resolve, reject)
    // that need to be invoked in a different place than where they were created.
    // Since PieClient does a lot of asyncronous work through websockets, a 
    // promise that was created with the sending of one message
    // over a websocket must be able to be resolved by the reception of another
    // message over a websocket. promiseCBs fascilitates this pattern.
    promiseCBs: {
        joinRoom?: { resolve: (x: any) => void, reject: (x: any) => void };
    };
    // This is a main difference between piePeer and wsPieClient.  PiePeer has SimplePeer connections
    // whereas wsPieClient has a WebSocket connection
    peers: { peer: SimplePeer, name: string, clientId: string }[] = [];
    // Stores information of the current room to support automatic re-joining
    currentRoomInfo?: Room;
    stats: {
        latency: Latency;
    };
    // the server-assigned id of the current client
    #clientId: string = '';
    get clientId() {
        return this.#clientId
    }
    set clientId(newId) {
        this.#clientId = newId;
        // For PiePeer, update the globalThis.clientId because
        // there is no ServerAssignedData message
        globalThis.clientId = newId;
    }
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
        globalThis.kickPeer = ({ name, clientId }: { name?: string, clientId?: string }) => {
            const foundPeerIndex = this.peers.findIndex(p => clientId !== undefined ? p.clientId == clientId : p.name === name);
            if (foundPeerIndex !== -1) {
                const peer = this.peers[foundPeerIndex];
                if (peer) {
                    Jprompt({ text: `Are you sure you wish to kick ${name || clientId} from the game?`, noBtnText: 'Cancel', noBtnKey: 'Escape', yesText: 'Kick', forceShow: true }).then(doKick => {
                        if (doKick) {
                            peer.peer.destroy();
                            this.peers.splice(foundPeerIndex, 1);
                        }
                    });
                }
            }

        };
        globalThis.openPeerLobby = (open: boolean, socket: WebSocket) => {
            document.querySelectorAll('.openLobbyBtn').forEach(el => {
                el.innerHTML = open ? 'Allowing...' : 'Disallowing...';
            });
            if (open) {
                if (lastRoomInfo) {
                    console.log('reopening lobby with', lastRoomInfo);
                    this.makeRoom(lastRoomInfo);
                } else {
                    Jprompt({
                        text: `Something went wrong. Unable to reopen lobby`,
                        yesText: 'Okay',
                        forceShow: true
                    });
                }
            } else {
                if (socket)
                    socket.close();
            }

        }

    }
    isConnected(): boolean {
        return this.soloMode
            || window.navigator.onLine && this.peers.some(({ peer }) => peer.connected);
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
        this.peers = [];
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
        });
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
            if (this.peers.every(({ peer }) => !peer.connected)) {
                // Resolve immediately, client is already not connected 
                log('Attempted to disconnect but there was no preexisting connection to disconnect from.');
                this.peers = [];
                resolve();
                return
            } else {
                this.peers.forEach(({ peer }) => peer.destroy());
                this.peers = [];
                // Updates debug info to show that it is closing
                this._updateDebugInfo();
                log('Disconnected.');
            }
        }).then(() => {
            // Updates debug info to show that it is closed
            this._updateDebugInfo();
        });

    }
    handleMessage(message: any) {
        console.log('PiePeer handleMessage:', message);
        // Stats
        // if (message.time) {
        //     const currentMessageLatency = Date.now() - message.time;
        //     if (currentMessageLatency > this.stats.latency.max) {
        //         this.stats.latency.max = currentMessageLatency;
        //     }
        //     if (currentMessageLatency < this.stats.latency.min) {
        //         this.stats.latency.min = currentMessageLatency;
        //     }
        //     this.stats.latency.averageDataPoints.push(currentMessageLatency);

        //     if (this.stats.latency.averageDataPoints.length > maxLatencyDataPoints) {
        //         // Remove the oldest so the averageDataPoints array stays a fixed size
        //         this.stats.latency.averageDataPoints.shift();
        //         this.stats.latency.average =
        //             this.stats.latency.averageDataPoints.reduce((acc, cur) => acc + cur, 0) /
        //             this.stats.latency.averageDataPoints.length;
        //         // Broadcast latency information
        //         if (this.onLatency) {
        //             this.onLatency(this.stats.latency);
        //         }
        //     }
        // }
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
    hostBroadcastConnectedPeers() {
        if (this.isP2PHost) {
            if (!this.clientId) {
                this.clientId = defaultIdForSolomode;
            }
            this.sendMessage({
                type: MessageType.ClientPresenceChanged,
                clients: [this.clientId, ...this.peers.map(({ clientId }) => clientId)],
                names: [getMyPlayerName(), ...this.peers.map(({ name }) => name)]
            })
        }

    }
    // Remember to catch the rejected promise if used outside of this library
    makeRoom(roomInfo: Room) {
        this.isP2PHost = true;
        document.body.classList.toggle('isPeerHost', this.isP2PHost);
        lastRoomInfo = roomInfo;
        host({
            fromName: roomInfo.name,
            websocketHubUrl: hubURL,
            onError: console.error,
            onData: (msg) => {
                try {
                    const data = JSON.parse(msg);
                    this.handleMessage(data);
                    // host should echo any recieved data to all connections
                    // Send to all connections
                    this.peers.forEach(({ peer }: SimplePeer) => {
                        peer.send(msg);
                    });
                } catch (e) {
                    log('Err: Unable to parse data from msg', msg);
                    error(e);
                }
            },
            onPeerConnected: (peer, name, clientId) => {
                this.peers.push({ peer, name, clientId });
                this.hostBroadcastConnectedPeers();
            },
            onPeerDisconnected: (p) => {
                this.peers.splice(this.peers.findIndex(x => x.peer == p), 1);
                this.hostBroadcastConnectedPeers();
            },
            onConnectionState: (hubConnected) => {
                document.body.classList.toggle('peer-hub-connected', hubConnected);
                console.log('Hub connected:', hubConnected);
                // @ts-ignore: Exception: this code will only ever be run on client
                // It's not usually okay to use devUnderworld
                syncLobby(globalThis.devUnderworld);
            }
        });
    }
    joinRoom(roomInfo: Room, isHosting: boolean = false) {
        this.isP2PHost = false;
        document.body.classList.toggle('isPeerHost', this.isP2PHost);
        if (this.soloMode) {
            // Now that client has joined a room in soloMode, send a 
            // manufactured clientPresenceChanged as if it came from the server
            // because pieClient fakes all server messages when in soloMode
            this.handleMessage({
                clients: [this.clientId],
                time: Date.now(),
                type: MessageType.ClientPresenceChanged,
                present: true,
            });
            return Promise.resolve(roomInfo);
        } else {
            // TODO(p2p): Handle player name better, in wspie, it's already stored in an underworld
            const playerName = storage.get(storage.STORAGE_ID_PLAYER_NAME);
            if (!playerName) {
                alert('You must choose a name in settings before joining a game');
                return Promise.reject();
            }
            if (isHosting) {
                this.makeRoom(roomInfo);
                return Promise.resolve(roomInfo);
            }

            if (!this.clientId) {
                this.clientId = defaultIdForSolomode;
            }
            return join({
                toName: roomInfo.name,
                fromName: playerName,
                fromClientId: this.clientId,
                websocketHubUrl: hubURL,
                onError: console.error,
                onData: (msg) => {
                    try {
                        this.handleMessage(JSON.parse(msg));
                    } catch (e) {
                        log('Err: Unable to parse msg', msg);
                        error(e);
                    }
                },
                onPeerDisconnected: (p) => {
                    this.peers.splice(this.peers.findIndex(x => x.peer == p), 1);
                },
            }).then(({ peer, name }) => {
                // ClientId is only needed for host peers list
                this.peers.push({ peer, name, clientId: 'unknown' });
                return roomInfo;
            });
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
    // Sends a data message.  This is the most common type of message
    // that is sent to clients
    sendData(payload: any, extras?: any) {
        console.log('P2P sendData:', payload);
        const message = {
            type: MessageType.Data,
            payload,
            ...extras,
        };
        this.sendMessage(message);
    }
    // Send a message with a type.
    // This can be used to send any Pie-style message such as a
    // type: Data message or pie-internal messages such as
    // type: ClientPresenceChanged
    sendMessage(message: { type: string } & any) {
        Object.assign(message, {
            fromClient: this.clientId,
            time: Date.now(),
        });
        // If not connected, send all messages to self
        if (this.soloMode || !this.isConnected()) {
            // In soloMode there is no this.ws so just handle the message immediately as 
            // if it bounced back from PieServer
            this.handleMessage(message);
        } else if (this.peers.length) {
            try {
                const stringifiedMessage = JSON.stringify(message);
                // Send to all connections
                this.peers.forEach(({ peer }: SimplePeer) => {
                    peer.send(stringifiedMessage);
                });
                // If the host, also "send" to self (handle immediately)
                if (this.isP2PHost) {
                    this.handleMessage(message);
                }
            } catch (e) {
                error('Err: Unable to stringify', message);
                error(e);
            }
        } else {
            error('Unexpected: Attempted to send data but this.ws is undefined and not in soloMode');
        }
    }
    _updateDebugInfo(message?: { clients: object[] }) {
        debug('TODO: update debug info');
    }
}
function getMyPlayerName() {
    return globalThis.player?.name || storage.get(storage.STORAGE_ID_PLAYER_NAME);
}
