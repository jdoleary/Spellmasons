import Underworld from "./Underworld";
import * as config from './config';

export function calculateGameDifficulty(underworld: Underworld) {
    const loopDifficultyModifier = 0.2 * Math.max(0, (underworld.levelIndex - config.LAST_LEVEL_INDEX));
    let difficulty = Math.min(config.NUMBER_OF_PLAYERS_BEFORE_BUDGET_INCREASES, underworld.players.filter(p => p.clientConnected).length) + loopDifficultyModifier;
    if (underworld.gameMode == 'hard') {
        difficulty *= 1.5;
    }
    if (underworld.gameMode == 'impossible') {
        difficulty *= 2;
    }
    return difficulty;
}