import { processNextInQueueIfReady } from "./network/networkHandler";
import Underworld from "./Underworld";

const readyState = {
    wsPieConnection: false,
    pixiAssets: false,
    wsPieRoomJoined: false,
    // content: Cards, Units, etc
    content: false,
    underworld: false,
}
let is_fully_ready = false;
const elReadyState = document.getElementById('ready-state');
let hasAutoJoined = false;
export function set(key: keyof typeof readyState, value: boolean, underworld?: Underworld) {
    console.log('Ready State: ', key, value);
    readyState[key] = value;
    if (!globalThis.headless && !hasAutoJoined && readyState.wsPieConnection && readyState.pixiAssets && readyState.content) {
        // Prevent autojoining more than once
        hasAutoJoined = true;
        // Auto join game if specified in url
        let urlSearchParams = new URLSearchParams(location.search);
        let gameName = urlSearchParams.get("game");
        if (gameName) {
            if (globalThis.joinRoom) {
                globalThis.joinRoom({ name: gameName })
            } else {
                console.error('globalThis.joinRoom is undefined')
            }
        } else {
            // It is common that gameName won't exist, it's totally option
            // so do nothing if it doesn't exist
        }
    }
    // If all values in readyState are true, then everything is ready
    is_fully_ready = Object.values(readyState).every(x => !!x)
    if (elReadyState) {
        elReadyState.innerHTML = JSON.stringify(readyState, null, 2);
        if (is_fully_ready) {
            // Don't show any debug information from readyState if it's
            // fully ready
            elReadyState.innerHTML = "";
        }
    }
    // When the game is ready to process wsPie messages, begin
    // processing them
    processNextInQueueIfReady(underworld);
}
export function get(key: keyof typeof readyState) {
    return readyState[key];
}
export function log() {
    return Object.keys(readyState).map(key => `${key}:${readyState[key as keyof typeof readyState]}`)
}
// isReady is true if game is ready to recieve wsPie messages
export function isReady(): boolean {
    return is_fully_ready;
}