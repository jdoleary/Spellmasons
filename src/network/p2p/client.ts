// @ts-ignore: Import is fine
import SimplePeer from "simple-peer/simplepeer.min.js";
import { ensureConnectionToHub, sendToHub } from "./connector";
import { ACCEPT_REQUEST_SIGNAL, ERROR, JOIN_REQUEST, REQUEST_REJECTED } from "./messages";

/* Desired Flow:
1. Host: Register name with Hub
2. Client: Ask hub to join host by toName and send initiated signal
3. Hub: Send invite to host via toName
4. Host: Accept invite, respond with own signal
5. Client recieve signal and form connection
*/

// This function is exposed for the consumer of this library 
// to initiate a join request to a host for a p2p connection
export async function join({ toName, fromName, fromClientId, websocketHubUrl, onError, onData }: { toName: string, fromName: string, fromClientId: string, websocketHubUrl: string, onError: (error: any) => void, onData: (data: any) => void }): Promise<{ peer: SimplePeer, name: string }> {
    console.log('P2P join:', ...arguments)
    // Note: it is up to the caller to
    // subscribe to peer.on('data', message => {});
    return new Promise(async (resolvePeerConnection) => {
        const { signal, peer } = await new Promise<{ signal: string, peer: SimplePeer }>((res, _rej) => {
            // Step 1: Initiate the peer with a signal
            const peer = new SimplePeer({ initiator: true, tickle: false });
            peer.on('error', onError);

            peer.on('signal', (data: any) => {
                console.debug('Generated signal', data);
                res({ signal: data, peer });
            });

            peer.on('connect', () => {
                console.log('Step: Connected!');
                resolvePeerConnection({ peer, name: toName });
            });
            peer.on('data', (data: any) => {
                onData(JSON.parse(data));
            });
        });
        function onHubData(data: any) {
            const { type, signal } = data;
            if (type === ACCEPT_REQUEST_SIGNAL) {
                console.log('Step: Request accepted, processing return signal...', data);
                // Step 4: When the host accepts the request, it will generate
                // it's own signal to send back, this client processes the signal
                // and forms the final connection.
                peer.signal(signal);
            } else if (type === REQUEST_REJECTED) {
                alert('Join request rejected from ' + toName);
            } else if (type === ERROR) {
                onError(data.error);
            }
        }

        // Step 2: Connect to hub
        const socket = await ensureConnectionToHub(websocketHubUrl, { onData: onHubData, onError });
        console.log('Step: Connected to hub and sending join request with signal.');
        // Step 3: Now that we're connected to hub and have a signal,
        // send a join request with the signal to the host through
        // the hub.  The toName identifies which host to send the signal to
        sendToHub(socket, { type: JOIN_REQUEST, signal, fromName, fromClientId, toName });

    });
}
