import type * as Player from '../entity/Player';
import type * as Unit from '../entity/Unit';
import type * as Pickup from '../entity/Pickup';
import type { Vec2 } from '../jmath/Vec';
import Events, {
  onDamage,
  onDeath,
  onMove,
  onAgro,
  onTurnStart,
  onTurnEnd,
} from '../Events';
import Subsprites, { Subsprite } from '../Subsprites';
// Register spells:
import add_damage, { UnitDamage } from './hurt';
import add_heal from './add_heal';
import area_of_effect from './area_of_effect';
import chain from './chain';
import contagious from './contagious';
import freeze from './freeze';
import raise_dead from './raise_dead';
import shield from './shield';
import swap from './swap';
import purify from './purify';
import poison from './poison';
import vulnerable from './vulnerable';
// import protection from './protection';
import clone from './clone';
import mana_burn from './mana_burn';
import mana_steal from './mana_steal';
import vampire_bite from './blood_curse';
import push from './push';
import pull from './pull';
import decoy from './summon_decoy';
import trap from './trap';
import explode from './explode_on_death';
import { IUpgrade, upgradeCardsSource } from '../Upgrade';
import { _getCardsFromIds } from './cardUtils';
import { addCardToHand } from '../entity/Player';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
export interface Modifiers {
  subsprite?: Subsprite;
  add?: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number) => void;
  remove?: (unit: Unit.IUnit, underworld: Underworld) => void;
}
export interface Spell {
  card: ICard;
  // modifiers keep track of additional state on an individual unit basis
  modifiers?: Modifiers;
  // events trigger custom behavior when some event occurs
  events?: {
    onDamage?: onDamage;
    onDeath?: onDeath;
    onMove?: onMove;
    onAgro?: onAgro;
    onTurnStart?: onTurnStart;
    onTurnEnd?: onTurnEnd;
  };
}

function register(spell: Spell, underworld: Underworld) {
  const { modifiers, card, events } = spell;
  const { id } = card;
  // Add card to cards pool
  allCards[id] = card;
  // Add modifiers to allModifiers
  if (spell.modifiers) {
    allModifiers[id] = spell.modifiers;
  }
  // Add card as upgrade:
  upgradeCardsSource.push(cardToUpgrade(card, underworld));
  // Add subsprites
  if (modifiers && modifiers.subsprite) {
    Subsprites[id] = modifiers.subsprite;
  }
  // Add events
  if (events) {
    if (events.onAgro) {
      Events.onAgroSource[id] = events.onAgro;
    }
    if (events.onDamage) {
      Events.onDamageSource[id] = events.onDamage;
    }
    if (events.onDeath) {
      Events.onDeathSource[id] = events.onDeath;
    }
    if (events.onMove) {
      Events.onMoveSource[id] = events.onMove;
    }
    if (events.onTurnStart) {
      Events.onTurnStartSource[id] = events.onTurnStart;
    }
    if (events.onTurnEnd) {
      Events.onTurnEndSource[id] = events.onTurnEnd;
    }
  }
}
export function registerCards(underworld: Underworld) {
  register(add_damage, underworld);
  register(add_heal, underworld);
  register(area_of_effect, underworld);
  register(chain, underworld);
  register(contagious, underworld);
  register(freeze, underworld);
  register(raise_dead, underworld);
  register(shield, underworld);
  register(poison, underworld);
  register(purify, underworld);
  register(swap, underworld);
  register(vulnerable, underworld);
  // register(lance, underworld);
  // register(protection, underworld);
  // register(charge, underworld);
  register(clone, underworld);
  register(mana_burn, underworld);
  register(mana_steal, underworld);
  register(vampire_bite, underworld);
  register(push, underworld);
  register(pull, underworld);
  register(decoy, underworld);
  register(trap, underworld);
  register(explode, underworld);
}
function cardToUpgrade(c: ICard, underworld: Underworld): IUpgrade {
  return {
    title: c.id,
    description: () => c.description,
    thumbnail: `images/spell/${c.thumbnail}`,
    // TODO: Feature creep: What if you could UPGRADE the effect of a spell!! 0.o
    maxCopies: 1,
    effect: (player) => {
      addCardToHand(c, player, underworld);
    },
    probability: c.probability,
    cost: { healthCost: c.healthCost, manaCost: c.manaCost }
  };
}

// Guiding rules for designing spells:
// Follow the Priciple of Least Surpise
// Every spell effect should be designed to respond well to potentially more than one target
// Note: spells can be found in their own files in src/cards/*
// Make sure each spell's effect returns the state at the very end

export interface EffectState {
  cardIds: string[];
  casterCardUsage?: Player.CardUsage;
  casterUnit: Unit.IUnit;
  targetedUnits: Unit.IUnit[];
  targetedPickups: Pickup.IPickup[];
  castLocation: Vec2;
  // aggregator carries extra information that can be passed
  // between card effects.
  aggregator: {
    unitDamage: UnitDamage[],
  };
}
export type EffectFn = {
  // Dry run is for displaying to the user what will happen if they cast
  (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean): Promise<EffectState>;
};
export interface ICard {
  id: string;
  category: CardCategory;
  manaCost: number;
  // Used in trap to reduce the cost of the spell by a percentage
  manaCostMultiplier?: number;
  healthCost: number;
  probability: number;
  thumbnail: string;
  // The path for the animation effect when the spell is cast
  animationPath?: string;
  effect: EffectFn;
  description: string;
  // requiresFollowingCard is for cards like chain or AOE that need another
  // card to follow them in order to have an effect
  requiresFollowingCard?: boolean;
  // The number of turns it takes after use to return to it's original cost
  // Default is 1
  expenseScaling: number;
  // This flag allows casting on the ground and is necessary
  // for spells like AOE, Trap, etc
  allowNonUnitTarget?: boolean;
  // supportQuantity, if true, makes multiple sequential invokations of a card combine
  // into only 1 invokation with a quantity arg passed to the effect function.
  // If false, it will just invoke card.effect for the number of times that the card
  // is in the spell
  supportQuantity?: boolean;
  sfx?: string;
}

export const allCards: { [cardId: string]: ICard } = {};
export const allModifiers: { [id: string]: Modifiers } = {};

export function getCardsFromIds(cardIds: string[]): ICard[] {
  return _getCardsFromIds(cardIds, allCards);
}

export function addUnitTarget(unit: Unit.IUnit, effectState: EffectState) {
  // Adds a unit to effectState.targetedUnits IF it is not already in unitTargets
  if (effectState.targetedUnits.indexOf(unit) === -1) {
    effectState.targetedUnits.push(unit);
  }
}
export function addPickupTarget(pickup: Pickup.IPickup, effectState: EffectState) {
  // Adds a pickup to effectState.targetedPickups IF it is not already in targetedPickups
  if (effectState.targetedPickups.indexOf(pickup) === -1) {
    effectState.targetedPickups.push(pickup);
  }
}