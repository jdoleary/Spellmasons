import Underworld from "./Underworld";
import * as config from './config';

export function calculateGameDifficulty(underworld: Underworld) {
    const loopDifficultyModifier = 0.2 * Math.max(0, (underworld.levelIndex - config.LAST_LEVEL_INDEX));
    return Math.min(config.NUMBER_OF_PLAYERS_BEFORE_BUDGET_INCREASES, underworld.players.filter(p => p.clientConnected).length) + loopDifficultyModifier;
}