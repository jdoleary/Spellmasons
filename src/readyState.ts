import { processNextInQueue } from "./wsPieHandler";

const readyState = {
    wsPieConnection: false,
    pixiAssets: false,
    wsPieRoomJoined: false,
    player: false,
    underworld: false,
}
let is_fully_ready = false;
export function set(key: keyof typeof readyState, value: boolean) {
    readyState[key] = value;
    // If all values in readyState are true, then everything is ready
    is_fully_ready = Object.values(readyState).every(x => !!x)
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