import Underworld from "./Underworld";

export function calculateGameDifficulty(underworld: Underworld) {
    return Math.min(3, underworld.players.filter(p => p.clientConnected).length);
}