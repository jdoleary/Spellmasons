// @ts-ignore: Import is fine
import * as storage from '../storage';
import { v4 as uuidv4 } from 'uuid';
import * as msgpack from "@msgpack/msgpack";
import { MESSAGE_TYPES } from '../types/MessageTypes';
import { lastContact } from './lastConnected';

export interface SteamPeer {
    id: bigint;
    connected: boolean;
}

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
let defaultIdForSolomode = uuidv4();
function changeDefaultClientId(newClientId: string, logSource?: string) {
    defaultIdForSolomode = newClientId;
    storage.set(storage.STORAGE_PIE_CLIENTID_KEY, newClientId);
    if (globalThis.pie) {
        globalThis.pie.clientId = newClientId;
    }
    console.log(`${logSource ? logSource : ''} - Overridding default clientId and storing in local storage: ${newClientId}`);

}

if (globalThis.steamworks) {
    globalThis.electronSettings?.mySteamId().then(steamId => {
        changeDefaultClientId(steamId, 'PiePeer: top level');
    });
    globalThis.p2pSend = (message: any, peerId?: bigint) => {
        if (globalThis.electronSettings) {
            if (exists(peerId)) {
                globalThis.electronSettings.p2pSend(peerId, msgpack.encode(message));
            } else {
                globalThis.electronSettings.p2pSendMany(msgpack.encode(message), Array.from(globalThis.peers).map(id => BigInt(id)));
            }

        } else {

            console.error('Unexpected, no globalThis.electronSettings, cannot p2pSend')
        }
    }
    console.log('Subscribe to p2p messages beta 5');
    globalThis.steamworks?.subscribeToLobbyJoinRequested(() => {
        console.log('Lobby join requested, setting Pie to P2P mode');
        globalThis.pieLeaveRoom?.();
        globalThis.setPieToP2PMode(true);
    })
    globalThis.steamworks?.subscribeToLobbyDataUpdate(({ lobby, member, success }: { lobby: string, member: string, success: string }) => {
        console.log('P2P Lobby data changed', lobby, member, success);
        window.syncConnectedWithPieState?.(true);
        if (success) {
            window.setPieToP2PMode?.(true);
            window.setMenu?.('MULTIPLAYER_SERVER_CHOOSER');
        }
    });
    globalThis.steamworks?.subscribeToP2PMessages(data => {
        try {

            const text = msgpack.decode(data);
            if (!piePeerSingleton) {
                if (globalThis.pie && globalThis.pie.currentRoomInfo) {
                    console.warn('Recieved a p2p message but already in a non p2p room. aborting..')
                } else {
                    setPieToP2PMode(true)
                }
            }
            if (!(piePeerSingleton && piePeerSingleton.onData)) {
                console.error('Failsafe, set pie to P2P mode last minute. This should not be necessary');
                globalThis.setPieToP2PMode(true);
            }
            if (piePeerSingleton && piePeerSingleton.onData) {
                piePeerSingleton.handleMessage(text);
                // Echo disabled: Not needed because all peers for connections to each other
                // // Host echos message to all clients
                // if (globalThis.isHost(piePeerSingleton)) {
                //     console.log("Host echo message to all clients", text);
                //     // Send to all connections
                //     if (globalThis.electronSettings)
                //         globalThis.p2pSend(text);
                // }
            } else {
                console.error('PiePeerSingleton missing or onData not defined', piePeerSingleton, piePeerSingleton?.onData);
            }
        } catch (e) {
            console.error('subscribeToP2PMessages callback error:', e);
        }
    })
} else {
    console.log('Steamp2p setup error globalThis.steamworks is undefined');
}

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
let lastRoomInfo: Room | undefined;

let didSubscribeToLobbyChanges = false;

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
        console.log('PiePeer: Setting globalThis.clientId = ', newId);
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
        if (globalThis.steamworks) {
            globalThis.electronSettings?.mySteamId().then(steamId => {
                if (steamId != this.clientId) {
                    this.clientId = steamId;
                    changeDefaultClientId(steamId, 'PiePeer: constructor');
                }
            })
        }
        this.stats = {
            latency: {
                min: Number.MAX_SAFE_INTEGER,
                max: 0,
                averageDataPoints: [],
                average: NaN,
            },
        };
        this.cancelNextReconnectAttempt = false;

        globalThis.kickPeer = (steamId: string, name?: string) => {
            Jprompt({ text: globalThis.i18n(['kick-conf', name || 'player']), noBtnText: 'Cancel', noBtnKey: 'Escape', yesText: 'kick-player', forceShow: true }).then(confirm => {
                if (confirm) {
                    this.sendData({
                        type: MESSAGE_TYPES.KICKED_FROM_PEER_LOBBY,
                        peerLobbyId: globalThis.peerLobbyId,
                        peerSteamId: steamId
                    });
                }
            });

        };

    }
    isConnected(): boolean {
        return this.soloMode || !!globalThis.peerLobbyId;
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
        await this.disconnect('Left lobby to play singleplayer');
        this.soloMode = true;
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
    async disconnect(disconnectReason: string): Promise<void> {
        if (disconnectReason) {
            console.warn(disconnectReason);
            if (remoteLog) {
                remoteLog(`Disconnect (PiePeer): ${disconnectReason}`);
            }
        }
        this.sendData({
            type: MESSAGE_TYPES.PEER_VOLUNTARY_DISCONNECT,
            hostDisconnected: globalThis.isHost(this),
            disconnectReason
        });
        globalThis.peers.clear();
        globalThis.peerLobbyId = '';
        globalThis.electronSettings?.leaveLobby();
        // Note: This must occur **after** the PEER_VOLUNTARY_DISCONNECT message so that we know if it's
        // the host that's disconnecting.
        document.body.classList.remove('isPeerHost');
        // Stop attempt to auto reconnect if a manual disconnect occurs
        clearTimeout(this.reconnectTimeoutId);
        // If disconnect is invoked while a connect() is already in progress this will
        // prevent it from trying to reconnect again after it fails
        this.cancelNextReconnectAttempt = true;
        if (this.soloMode) {
            this.soloMode = false;
            log('"Disconnected" from soloMode');
        }
        this._updateDebugInfo();

    }
    handleMessage(message: any) {
        console.log('PiePeer handleMessage:', message);
        if (message.fromClient) {
            lastContact[message.fromClient] = Date.now();
        }
        if (!this.soloMode && peerLobbyId != '' && message.peerLobbyId != peerLobbyId) {
            console.warn('Ignoring message from wrong lobby', peerLobbyId, message);
            return;
        }
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
                if (globalThis.steamworks) {
                    globalThis.electronSettings?.mySteamId().then(steamId => {
                        if (steamId != this.clientId) {
                            console.log(`PiePeer: Overridding ServerAssigned clientId ${message.clientId} with steamId`, steamId)
                            defaultIdForSolomode = steamId;
                            this.clientId = steamId;
                        }
                    })
                }
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
                error(`Above message of type ${message.type
                    } not recognized!`);
        }
    }

    joinRoom(roomInfo: Room, isHosting: boolean = false): Promise<any> {
        if (!globalThis.electronSettings) {
            return Promise.reject('Steam not initialized');
        }
        // If in soloMode, you are always the host, if not in solomode, since this function is joinRoom,
        // you are not the host
        document.body.classList.toggle('isPeerHost', isHosting || this.soloMode);
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
            const playerName = storage.get(storage.STORAGE_ID_PLAYER_NAME);
            if (!playerName) {
                console.warn("Using id as name", this.clientId)
                storage.set(storage.STORAGE_ID_PLAYER_NAME, this.clientId)
            }
            if (isHosting) {
                document.body.classList.toggle('isPeerHost', true);
                globalThis.electronSettings.p2pCreateLobby();
                if (globalThis.peerLobbyId != '') {
                    Jprompt({ text: 'You cannot create a new lobby while you are in an existing lobby', yesText: 'Okay', forceShow: true })
                    return Promise.reject('You cannot create a new lobby while you are in an existing lobby');
                }
                globalThis.peerLobbyId = uuidv4();
                globalThis.syncConnectedWithPieState(true);

                if (!didSubscribeToLobbyChanges) {
                    didSubscribeToLobbyChanges = true;
                    globalThis.electronSettings.subscribeToLobbyChanges((x) => {
                        console.log('SteamP2P, lobby changes', x);
                        // Lobby members are ephemeral, if a member joins, add them to the set and then they will exit the lobby
                        globalThis.electronSettings?.getLobbyMembers().then(members => {
                            console.log('SteamP2P, sending updated members', members);
                            for (let m of members) {
                                const steamId = m.steamId64.toString();
                                console.debug('Adding peer', steamId, '; own id:', clientId);
                                globalThis.peers.add(steamId);
                            }
                            this.sendData({ type: MESSAGE_TYPES.GET_PLAYER_CONFIG });
                            peerHostBroadcastClientsPresenceChanged(this);

                        })
                    })
                }
                return Promise.resolve();
            }
            return Promise.reject('Joining client joins without spellmasons menu button.  Use steam overlay instead');
        }
    }
    leaveRoom() {
        // exitCurrentGame implicitly disconnects connection
        globalThis.exitCurrentGame?.();
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
        // console.log('P2P sendData:', payload);
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
            // Ensure that messages are only processed if in the same lobby
            peerLobbyId,
            time: Date.now(),
        });
        // If not connected, send all messages to self
        if (this.soloMode || !this.isConnected()) {
            // In soloMode there is no this.ws so just handle the message immediately as 
            // if it bounced back from PieServer
            this.handleMessage(message);
        } else {
            try {
                // If wisper only send to chosen peer:
                if (message.subType && message.subType == 'Whisper') {
                    if (globalThis.electronSettings)
                        if (!message.whisperClientIds || !message.whisperClientIds.length) {
                            console.error('Attempting to whisper to empty client list', message);
                            return;
                        }
                    for (let whisperTo of message.whisperClientIds) {
                        globalThis.p2pSend(message, BigInt(whisperTo));
                    }

                } else {
                    // Send to all connections
                    if (globalThis.electronSettings)
                        globalThis.p2pSend(message);
                    // Also "send" to self (handle immediately)
                    this.handleMessage(message);
                }
            } catch (e) {
                error('Err: Unable to stringify', message);
                error(e);
            }
        }
    }
    _updateDebugInfo(message?: { clients: object[] }) {
        debug('TODO: update debug info');
    }
}
globalThis.peerHostBroadcastClientsPresenceChanged = (pie: PiePeer) => {
    if (isHost(pie)) {
        const message = {
            type: MessageType.ClientPresenceChanged,
            clients: Array.from(globalThis.peers),
            // Tell all the peers which lobby they are in
            peerLobbyId: globalThis.peerLobbyId,
        };
        pie.sendMessage(message);
    }

}


export const piePeerSingleton: PiePeer = new PiePeer();