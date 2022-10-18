export enum UnitType {
  PLAYER_CONTROLLED,
  AI,
}
export enum UnitSubType {
  MELEE,
  RANGED_LOS,
  RANGED_RADIUS,
  SUPPORT_CLASS,
  PLAYER_CONTROLLED,
}

export enum Faction {
  ALLY,
  ENEMY,
}

export enum CardCategory {
  Movement,
  Targeting,
  Mana,
  Curses,
  Blessings,
  Primary
}
export enum CardRarity {
  COMMON = 'COMMON',
  SPECIAL = 'SPECIAL',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  FORBIDDEN = 'FORBIDDEN'
}
export const probabilityMap: Record<CardRarity, number> = {
  [CardRarity.COMMON]: 50,
  [CardRarity.SPECIAL]: 20,
  [CardRarity.UNCOMMON]: 10,
  [CardRarity.RARE]: 5,
  [CardRarity.FORBIDDEN]: 1

}