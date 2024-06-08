import * as GameStatistics from "./GameStatistics";
import { allStats, StatDepth } from "./GameStatistics";
import Underworld from "./Underworld";
import { LAST_LEVEL_INDEX } from "./config";

//

export const allAchievements: { [key: string]: IAchievement } = {};

interface IAchievement {
  id: string,
  description: string,
  unlocked: boolean,
}

//

const achievement_CompleteTheGame: IAchievement = {
  id: "Complete the game",
  description: "Complete the first 12 levels",
  unlocked: false,
}
const achievement_CompleteGameNoDamageTaken: IAchievement = {
  id: "Untouchable",
  description: "Complete the first 12 levels without taking any damage",
  unlocked: false,
}
const achievement_BrinkOfDeath: IAchievement = {
  id: "Brink Of Death",
  description: "Complete a level with less than 10 health remaining",
  unlocked: false,
}
const achievement_ArrowRain: IAchievement = {
  id: "Arrow Rain",
  description: "Shoot 100 or more arrows with one spell",
  unlocked: false,
}

//

// ID's and registry maybe not needed?
function registerAchievement(achievement: IAchievement) {
  allAchievements[achievement.id] = achievement;
}

// ID's and registry maybe not needed?
export function registerAllAchievements() {
  registerAchievement(achievement_CompleteTheGame);
  registerAchievement(achievement_CompleteGameNoDamageTaken);
  registerAchievement(achievement_BrinkOfDeath);
  registerAchievement(achievement_ArrowRain);
  console.log("[ACHIEVEMENT] - Registered achievements!", allAchievements);
}

// ID's and registry maybe not needed?
export function getAchievementById(id: string) {
  const achievement = allAchievements[id];
  return achievement;
}

//

export function UnlockAchievement(achievement: IAchievement) {
  if (!achievement.unlocked) {
    achievement.unlocked = true;
    console.log("[ACHIEVEMENT] - Achievement unlocked!", achievement)
  } else {
    console.log("[ACHIEVEMENT] - Achievement is already unlocked.", achievement)
  }
}

export function UnlockEvent_CastCards() {
  if (allStats[StatDepth.SPELL] && allStats[StatDepth.SPELL].myPlayerArrowsFired >= 100) {
    UnlockAchievement(achievement_ArrowRain);
  }
}

export function UnlockEvent_EndOfLevel(underworld: Underworld) {
  if (globalThis.player && globalThis.player.unit.health < 10) {
    UnlockAchievement(achievement_BrinkOfDeath);
  }

  if (underworld.levelIndex == LAST_LEVEL_INDEX) {
    UnlockAchievement(achievement_CompleteTheGame)
    if (allStats[StatDepth.RUN] && allStats[StatDepth.RUN].myPlayerDamageTaken == 0) {
      UnlockAchievement(achievement_CompleteGameNoDamageTaken);
    }
  }
}

function LoadAchievementData() {
  // TODO - Save system stuff
}
