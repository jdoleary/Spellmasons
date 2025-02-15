// @ts-ignore: Import is fine
import SimplePeer from "simple-peer/simplepeer.min.js";
import { ensureConnectionToHub, sendToHub } from "./connector";
import { ACCEPT_REQUEST_SIGNAL, ERROR, JOIN_REQUEST, REGISTER_CLIENT, REQUEST_REJECTED } from "./messages";


// This function is exposed to the consumer of this library to communicate to
// the hub that this host is available to receive join requests.
export async function host({ fromName, websocketHubUrl, onPeerConnected, onPeerDisconnected, onError, onData }: { fromName: string, websocketHubUrl: string, onPeerConnected: (p: SimplePeer) => void, onPeerDisconnected: (p: SimplePeer) => void, onError: (error: any) => void, onData: (data: any) => void }) {
    console.log('P2P host:', ...arguments)
    function onHubData(data: any, socket: WebSocket) {
        const { type, fromName: sender, signal } = data;
        if (type === JOIN_REQUEST) {
            const accept = confirm('Request to connect from ' + sender)
            if (accept) {
                console.log('Step: Accepted join request, creating own signal.');
                // Host generates one peer per JOIN_REQUEST
                const peer: SimplePeer = new SimplePeer({ initiator: false, tickle: false });
                peer.on('close', () => onPeerDisconnected(peer));
                peer.on('error', onError);
                peer.on('connect', () => {
                    console.log('Connected!');
                    // Step 4: Connection has been made!
                    onPeerConnected(peer);
                });
                peer.on('signal', (data: any) => {
                    console.log('Step: Signal created, sending signals back to requester...');
                    // Step 3: When own signal is generated, send back to client and await final connection
                    sendToHub(socket, { type: ACCEPT_REQUEST_SIGNAL, fromName, signal: data, toName: sender })
                });
                peer.on('data', (data: any) => {
                    onData(JSON.parse(data));
                });
                // Step 2: When JOIN_REQUEST is accepted, generate own signal...
                peer.signal(signal);
            } else {
                sendToHub(socket, { type: REQUEST_REJECTED, fromName, toName: sender })
            }
        } else if (type === ERROR) {
            onError(data.error);
        }
    }
    const socket = await ensureConnectionToHub(websocketHubUrl, { onData: onHubData, onError });
    // Step 1: Register name with Hub
    sendToHub(socket, { type: REGISTER_CLIENT, fromName });

}