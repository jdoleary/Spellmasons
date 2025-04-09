// @ts-ignore: Import is fine
import SimplePeer from "simple-peer/simplepeer.min.js";
import { ensureConnectionToHub, sendToHub } from "./connector";
import { ACCEPT_REQUEST_SIGNAL, ERROR, JOIN_REQUEST, REQUEST_REJECTED } from "./messages";
import { simplePeerConf } from "./peerConf";

/* Desired Flow:
1. Host: Register name with Hub
2. Client: Ask hub to join host by toName and send initiated signal
3. Hub: Send invite to host via toName
4. Host: Accept invite, respond with own signal
5. Client recieve signal and form connection
*/

const handlers: { onData: (data: any, socket: WebSocket) => void, onError: (data: any, socket: WebSocket) => void } = {
    onData: () => console.error('No onData handler set up'),
    onError: () => console.error('No onError handler set up')
};
// This function is exposed for the consumer of this library 
// to initiate a join request to a host for a p2p connection
export async function join({ toName, fromName, fromClientId, websocketHubUrl, onError, onData, onPeerDisconnected }: { toName: string, fromName: string, fromClientId: string, websocketHubUrl: string, onError: (error: any) => void, onData: (data: any) => void, onPeerDisconnected: (p: SimplePeer) => void }): Promise<{ peer: SimplePeer, name: string }> {
    console.log('P2P join:', ...arguments);
    // Note: it is up to the caller to
    // subscribe to peer.on('data', message => {});
    return new Promise(async (resolvePeerConnection, rejectPeerConnection) => {
        const { signal, peer } = await new Promise<{ signal: string, peer: SimplePeer }>((res, _rej) => {
            // Step 1: Initiate the peer with a signal
            const peer = new SimplePeer(Object.assign(simplePeerConf, { initiator: true, tickle: false }));
            peer.on('close', () => {
                console.error('Lost peer connection.');
                onPeerDisconnected(peer);
                const backupSaveName = `backup ${toName || ''}`;
                // Backups are unique to the current date and the save name
                // so multiple backups in the same day and same game name will overwrite each other
                const todayDate = new Date().setHours(0, 0, 0, 0);
                if (globalThis.save) {
                    globalThis.save(`${todayDate}-${backupSaveName}`, true).then(errMsg => {
                        if (!errMsg) {
                            Jprompt({
                                text: `Lost connection, ${globalThis.i18n(['auto save notice', backupSaveName])}`, yesText: 'Okay', forceShow: true
                            });
                        }
                        globalThis.exitCurrentGame?.();
                    });
                } else {
                    globalThis.exitCurrentGame?.();

                }
            });
            peer.on('error', onError);

            peer.on('signal', (data: any) => {
                console.debug('Generated signal', data);
                res({ signal: data, peer });
            });

            peer.on('connect', () => {
                console.log('Step: Connected!');
                resolvePeerConnection({ peer, name: toName });
            });
            peer.on('data', onData);
        });
        function onHubData(data: any) {
            const { type, signal, reason } = data;
            if (type === ACCEPT_REQUEST_SIGNAL) {
                console.log('Step: Request accepted, processing return signal...', data);
                // Step 4: When the host accepts the request, it will generate
                // it's own signal to send back, this client processes the signal
                // and forms the final connection.
                try {
                    peer.signal(signal);
                } catch (e) {
                    onError(e);
                    // TODO: this doesn't stop the loading spinners for some reason
                    rejectPeerConnection(e);
                }
            } else if (type === REQUEST_REJECTED) {
                let text = `Join request rejected from ${toName}`;
                if (reason) {
                    text = `Unable to join ${toName}. ${reason}`;
                }
                Jprompt({ text, yesText: 'Okay', forceShow: true });
                rejectPeerConnection(text);
            } else if (type === ERROR) {
                onError(data.error);
                rejectPeerConnection(data.error);
            }
        }

        // Important: we must use the same `handlers` object
        // and just reassign the properties so that if the 
        // socket already exists, it will invoke the new
        // callbacks instead of the old ones that have
        // closure'd over the old peer connection
        handlers.onData = onHubData;
        handlers.onError = onError;

        // Step 2: Connect to hub
        const socket = await ensureConnectionToHub(websocketHubUrl, handlers);
        console.log('Step: Connected to hub and sending join request with signal.');
        // Step 3: Now that we're connected to hub and have a signal,
        // send a join request with the signal to the host through
        // the hub.  The toName identifies which host to send the signal to
        sendToHub(socket, { type: JOIN_REQUEST, signal, fromName, fromClientId, toName, version: globalThis.SPELLMASONS_PACKAGE_VERSION });

    });
}
