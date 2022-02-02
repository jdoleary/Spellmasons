import { processNextInQueue } from "./wsPieHandler";

const readyState = {
    wsPieConnection: false,
    pixiAssets: false,
    wsPieRoomJoined: false,
    // Maybe player will be needed in the ready state, but for now
    // I had to disable it so that clients that join can start
    // processing messages before they pick their character
    // (which is what creates their player entity) because
    // LOAD_GAME_STATE is now processed syncronously. So the
    // order needs to be:
    // 1. UI Chooses player which queues SELECT_CHARACTER
    // 2. Message queue starts processing
    // 3. LOAD_GAME_STATE (which should be already in the queue is processed)
    // TODO is it possible that a player could be chosen BEFORE the LOAD_GAME_STATE is there? YES, fix this
    // 4. SELECT_CHARACTER message is processed
    // player: false,
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
// isReady is true if game is ready to recieve wsPie messages
export function isReady(): boolean {
    return is_fully_ready;
}