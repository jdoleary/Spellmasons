export interface Vec2 {
  x: number;
  y: number;
}

export enum UnitType {
  PLAYER_CONTROLLED,
  AI,
}
export enum UnitSubType {
  AI_melee,
  AI_bishop,
  AI_rook,
  AI_reach,
  AI_summoner,
  AI_demon,
  AI_priest,
  AI_poisoner,
  PLAYER_CONTROLLED,
}

export enum Faction {
  PLAYER,
  ENEMY,
}
