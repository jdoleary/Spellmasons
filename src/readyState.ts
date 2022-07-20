import { processNextInQueueIfReady } from "./network/networkHandler";

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
export function set(key: keyof typeof readyState, value: boolean) {
    console.log('Ready State: ', key, value);
    readyState[key] = value;
    if (!hasAutoJoined && readyState.wsPieConnection && readyState.pixiAssets && readyState.content) {
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
            console.error('Cannot join room, "gameName" is falsey');
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
    processNextInQueueIfReady();
}
export function get(key: keyof typeof readyState) {
    return readyState[key];
}
// isReady is true if game is ready to recieve wsPie messages
export function isReady(): boolean {
    return is_fully_ready;
}