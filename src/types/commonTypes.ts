export enum UnitType {
  PLAYER_CONTROLLED,
  AI,
}
export enum UnitSubType {
  MELEE,
  RANGED_LOS,
  RANGED_RADIUS,
  SUPPORT_CLASS,
}

export enum Faction {
  ALLY,
  ENEMY,
}

export enum CardCategory {
  Damage,
  Movement,
  Targeting,
  Mana,
  Curses,
  Blessings,
  Soul
}
export enum CardRarity {
  COMMON = 'COMMON',
  SPECIAL = 'SPECIAL',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  FORBIDDEN = 'FORBIDDEN'
}
export const probabilityMap: Record<CardRarity, number> = {
  [CardRarity.COMMON]: 80,
  [CardRarity.SPECIAL]: 50,
  [CardRarity.UNCOMMON]: 30,
  [CardRarity.RARE]: 10,
  [CardRarity.FORBIDDEN]: 5

}