import { processNextInQueue } from "./wsPieHandler";

const readyState = {
    wsPieConnection: false,
    pixiAssets: false,
    wsPieRoomJoined: false,
    // content: Cards, Units, etc
    content: false,
    // player and underworld ready states occur in a second stage of setup.
    // once the above is all setup, then the game initialization begins where
    // either the host creates an underworld OR non-hosts wait for underworld
    // state from the host.
    // Once that occurs they can choose their player and enter the game.
    player: false,
    underworld: false,
}
let is_fully_ready = false;
const elReadyState = document.getElementById('ready-state');
export function set(key: keyof typeof readyState, value: boolean) {
    readyState[key] = value;
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
    if (is_fully_ready) {
        // When the game is ready to process wsPie messages, begin
        // processing them
        processNextInQueue();
    }
}
export function get(key: keyof typeof readyState) {
    return readyState[key];
}
// isReady is true if game is ready to recieve wsPie messages
export function isReady(): boolean {
    return is_fully_ready;
}