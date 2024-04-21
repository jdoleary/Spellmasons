import type * as particles from '@pixi/particle-emitter'
import { Spell } from '../cards';
import { IPickupSource } from '../entity/Pickup';
import { UnitSource } from '../entity/units';
export type GameMode = 'tutorial' | 'hard' | 'impossible'
export enum UnitType {
  PLAYER_CONTROLLED,
  AI,
}
export enum UnitSubType {
  MELEE,
  RANGED_LOS,
  RANGED_RADIUS,
  SUPPORT_CLASS,
  SPECIAL_LOS,
  DOODAD,
  GORU_BOSS,
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
// @ts-ignore: for menu
globalThis.CardCategory = CardCategory;
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
export type JEmitter = particles.Emitter & { cleanAfterTurn?: boolean };

export interface Mod {
  modName: string;
  author: string;
  description: string;
  screenshot: string;
  sfx?: { [key: string]: string[] };
  spritesheet?: string;
  units?: UnitSource[];
  pickups?: IPickupSource[];
  spells?: Spell[];
}