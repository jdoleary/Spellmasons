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
const achievement_AllPartOfThePlan: IAchievement = {
  id: "All Part of the Plan",
  description: "Complete a level in which you died",
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
export const achievement_PotionSeller: IAchievement = {
  id: "Potion Seller",
  description: "\"Hello Potion Seller. I'm going into battle, and I want your strongest potions.\" (Create a stronger potion)",
  unlocked: false,
}
const achievement_100Percent: IAchievement = {
  id: "100 Percent",
  description: "Earn all other achievements",
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
  registerAchievement(achievement_AllPartOfThePlan);
  registerAchievement(achievement_BrinkOfDeath);
  registerAchievement(achievement_ArrowRain);
  registerAchievement(achievement_PotionSeller);
  registerAchievement(achievement_100Percent);
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
    console.log("[ACHIEVEMENT] - New Achievement unlocked!", achievement.id, achievement)
  } else {
    console.log("[ACHIEVEMENT] - Already unlocked ", achievement.id, achievement)
  }

  // There is an achievement for earning all other achievements
  if (!achievement_100Percent.unlocked) {
    if (Object.entries(allAchievements).every(e => e[1].unlocked || e[1] == achievement_100Percent)) {
      UnlockAchievement(achievement_100Percent);
    }
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

  if (allStats[StatDepth.LEVEL] && allStats[StatDepth.LEVEL].myPlayerDeaths == 0) {
    UnlockAchievement(achievement_AllPartOfThePlan)
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
