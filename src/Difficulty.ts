import Underworld from "./Underworld";
import * as config from './config';
export function calculateGameDifficulty(underworld: Underworld) {
    const loopDifficultyModifier = 0.2 * Math.max(0, (underworld.levelIndex - config.LAST_LEVEL_INDEX));
    let difficulty = underworld.players.filter(p => p.clientConnected).length + loopDifficultyModifier;
    if (underworld.gameMode == 'hard') {
        difficulty *= 1.2;
    }
    if (underworld.gameMode == 'impossible') {
        difficulty *= 1.5;
    }
    return difficulty;
}
export function unavailableUntilLevelIndexDifficultyModifier(underworld: Underworld): {
    budgetMultiplier: number,
    unitMinLevelIndexSubtractor: number
} {
    if (underworld.gameMode == 'tutorial') {
        return {
            budgetMultiplier: 0.8,
            unitMinLevelIndexSubtractor: 0
        }
    } else if (underworld.gameMode == 'hard') {
        return {
            budgetMultiplier: 1.5,
            unitMinLevelIndexSubtractor: 2
        }
    } else if (underworld.gameMode == 'impossible') {
        return {
            budgetMultiplier: 2,
            unitMinLevelIndexSubtractor: 4
        }

    }
    return {
        budgetMultiplier: 1,
        unitMinLevelIndexSubtractor: 0
    }
}