import Underworld from "./Underworld";
import * as config from './config';

export function calculateGameDifficulty(underworld: Underworld) {
    return Math.min(config.NUMBER_OF_PLAYERS_BEFORE_BUDGET_INCREASES, underworld.players.filter(p => p.clientConnected).length);
}