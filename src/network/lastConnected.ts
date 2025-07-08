import { Overworld } from "../Overworld";
import { MESSAGE_TYPES } from "../types/MessageTypes";
import * as Player from '../entity/Player';
import PiePeer from "./PiePeer";

// Check for disconnects
let lastConnectedIntervalId: NodeJS.Timeout;

// Check every X seconds
const LAST_CONTACT_INTERVAL = 3_000;
const PING_THRESHOLD = 6_900;
const DISCONNECT_THRESHOLD = 10_000;
// Time of last contact
export const lastContact: { [peerId: string]: number } = {};
export function checkLastConnectedOnInterval(overworld: Overworld) {
    // Last Contact - ping connection checking
    clearInterval(lastConnectedIntervalId);
    lastConnectedIntervalId = setInterval(() => {
        checkLastConnected(overworld);

    }, LAST_CONTACT_INTERVAL);
}
//@ts-ignore
window.t = checkLastConnected;
function checkLastConnected(overworld: Overworld) {
    if (!(globalThis.pie && globalThis.pie instanceof PiePeer)) {
        return;
    }
    if (!overworld.underworld) {
        return;
    }
    const now = Date.now();
    console.debug('Check last connected', Object.entries(lastContact).map(([id, time]) => ({ id, time: now - time })), now);
    for (let peer of globalThis.peers) {
        if (peer == globalThis.clientId) {
            // Do not ping self
            continue;
        }
        const player = overworld.underworld.players.find(p => p.clientId == peer);
        if (!player) {
            console.error('Last Connected: Peer missing associated player');
            continue;
        }
        const timeSinceLastContact = now - (lastContact[peer] || 0);
        if (timeSinceLastContact >= DISCONNECT_THRESHOLD) {
            console.log(`Last Connected: Unable to reach peer ${peer}.  Time since last contact ${timeSinceLastContact}`);
            Player.setClientConnected(player, false, overworld.underworld)
        }
        if (timeSinceLastContact >= PING_THRESHOLD) {
            console.debug(`Last Connected: pinging peer ${peer}`)
            //send ping
            globalThis.pie.sendData({
                type: MESSAGE_TYPES.PEER_PING,
                peerPingId: peer,
            }, {
                subType: "Whisper",
                whisperClientIds: [peer],
            });
        }

    }

}