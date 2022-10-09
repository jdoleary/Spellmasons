import Underworld from "./Underworld";

export function calculateGameDifficulty(underworld: Underworld) {
    return underworld.players.filter(p => p.clientConnected).length;
}