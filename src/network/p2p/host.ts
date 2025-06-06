import { RequestToJoin } from "../../types/commonTypes";
import { SteamPeer } from "../PiePeer";
if (document && document.body && document.body.addEventListener) {
    document.body.addEventListener('click', (e) => {
        const el = e.target as HTMLElement;
        if (!el) {
            return;
        }
        try {
            switch (el.dataset['fn']) {
                case "openlobby": {
                    // globalThis.openPeerLobby(!document.body.classList.contains('peer-hub-connected'), socket);
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
            <div>
                ${data.sender}
            </div>
            <div>
                <button class="p2p-lobby-respond-btn approve" ${requestData} data-fn="approve-p2p">
                    ✅ Approve
                </button>
                <button class="p2p-lobby-respond-btn deny" ${requestData} data-fn="deny-p2p">
                    ❌ Deny 
                </button>
            </div>
            </div>`;
        el.appendChild(d);
    });
}
// This function is exposed to the consumer of this library to communicate to
// the hub that this host is available to receive join requests.
export async function host({ fromName, websocketHubUrl, onError, onData, onConnectionState }: { fromName: string, websocketHubUrl: string, onError: (error: any) => void, onData: (data: any) => void, onConnectionState: (connected: boolean) => void }) {
    if (globalThis.remoteLog)
        globalThis.remoteLog(`Hosting P2P`);

    globalThis.responseRequestToJoinP2P = () => console.warn('TODO SteamP2P');

}