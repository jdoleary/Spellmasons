// @ts-ignore: Import is fine
import SimplePeer from "simple-peer/simplepeer.min.js";
import { ensureConnectionToHub, sendToHub } from "./connector";
import { ACCEPT_REQUEST_SIGNAL, ERROR, JOIN_REQUEST, REGISTER_CLIENT, REQUEST_REJECTED } from "./messages";
import { RequestToJoin } from "../../types/commonTypes";
if (document && document.body && document.body.addEventListener) {
    document.body.addEventListener('click', (e) => {
        const el = e.target as HTMLElement;
        if (!el) {
            return;
        }
        try {
            switch (el.dataset['fn']) {
                case "openlobby": {
                    globalThis.openPeerLobby(!document.body.classList.contains('peer-hub-connected'), socket);
                }
                    break;
                case "kick": {
                    // clientid intentionally lowercase
                    globalThis.kickPeer({ name: el.dataset['name'], clientId: el.dataset['clientid'] });
                }
                    break;
                case "approve-p2p": {
                    const requestData = JSON.parse(decodeURIComponent(el.dataset['request'] || ''));
                    globalThis.responseRequestToJoinP2P(requestData, true);
                    document.querySelectorAll(`.invite[data-join-request-name="${requestData.senderClientId}"]`).forEach(invite => {
                        if (invite) {
                            invite.remove();
                        } else {
                            console.error('Invite not found for', requestData.sender);
                        }
                    });
                }
                    break;
                case "deny-p2p": {
                    const requestData = JSON.parse(decodeURIComponent(el.dataset['request'] || ''));
                    globalThis.responseRequestToJoinP2P(requestData, false);
                    document.querySelectorAll(`.invite[data-join-request-name="${requestData.senderClientId}"]`).forEach(invite => {
                        if (invite) {
                            invite.remove();
                        } else {
                            console.error('Invite not found for', requestData.sender);
                        }
                    });
                }
                    break;
                default:
                    break;

            }
        } catch (e) {
            console.error(e);
        }
    });
}
function requestToJoin(data: RequestToJoin) {
    const requestData = ` data-request="${encodeURIComponent(JSON.stringify(data))}" `;
    document.querySelectorAll('.request-to-join-p2p').forEach(el => {
        const d = document.createElement('div');
        d.innerHTML = `<div class="invite" data-join-request-name="${data.senderClientId}">
            ${data.sender}
            <button ${requestData} data-fn="approve-p2p">
                Approve
            </button>
            <button ${requestData} data-fn="deny-p2p">
                Deny 
            </button>
            </div>`;
        el.appendChild(d);
    });
}
let socket: WebSocket;
// This function is exposed to the consumer of this library to communicate to
// the hub that this host is available to receive join requests.
export async function host({ fromName, websocketHubUrl, onPeerConnected, onPeerDisconnected, onError, onData, onConnectionState }: { fromName: string, websocketHubUrl: string, onPeerConnected: (p: SimplePeer, name: string, clientId: string) => void, onPeerDisconnected: (p: SimplePeer) => void, onError: (error: any) => void, onData: (data: any) => void, onConnectionState: (connected: boolean) => void }) {
    function responseRequestToJoinP2P(request: RequestToJoin, approved: boolean) {
        if (approved) {
            console.log('Step: Accepted join request, creating own signal.');
            // Host generates one peer per JOIN_REQUEST
            const peer: SimplePeer = new SimplePeer({ initiator: false, tickle: false });
            peer.on('close', () => onPeerDisconnected(peer));
            peer.on('error', onError);
            peer.on('connect', () => {
                console.log('Connected!');
                // Step 4: Connection has been made!
                onPeerConnected(peer, request.sender, request.senderClientId);
            });
            peer.on('signal', (data: any) => {
                console.log('Step: Signal created, sending signals back to requester...');
                // Step 3: When own signal is generated, send back to client and await final connection
                sendToHub(socket, { type: ACCEPT_REQUEST_SIGNAL, fromName, signal: data, toName: request.sender })
            });
            peer.on('data', onData);
            // Step 2: When JOIN_REQUEST is accepted, generate own signal...
            peer.signal(request.signal);
        } else {
            sendToHub(socket, { type: REQUEST_REJECTED, fromName, toName: request.sender })
        }
    }

    globalThis.responseRequestToJoinP2P = responseRequestToJoinP2P;
    console.log('P2P host:', ...arguments)
    async function onHubData(data: any, socket: WebSocket) {
        const { type, fromName: sender, fromClientId: senderClientId, signal } = data;
        if (type === JOIN_REQUEST) {
            requestToJoin({ sender, senderClientId, signal });
        } else if (type === ERROR) {
            onError(data.error);
        }
    }
    socket = await ensureConnectionToHub(websocketHubUrl, { onData: onHubData, onError, onConnectionState });
    // Step 1: Register name with Hub
    sendToHub(socket, { type: REGISTER_CLIENT, fromName });

}