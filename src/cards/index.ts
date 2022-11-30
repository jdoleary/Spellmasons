import type * as Player from '../entity/Player';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import * as Doodad from '../entity/Doodad';
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
import slash, { UnitDamage } from './slash';
import rend from './rend';
import bleed from './bleed';
import suffocate from './suffocate';
import add_heal from './add_heal';
import target_circle from './target_circle';
import connect from './connect';
import contagious from './contagious';
import freeze from './freeze';
import raise_dead from './resurrect';
import shield from './shield';
import swap from './swap';
import displace from './displace';
import purify from './purify';
import poison from './poison';
import debilitate from './debilitate';
import * as protection from './protection';
import clone from './clone';
import mana_burn from './mana_burn';
import mana_steal from './mana_steal';
import vampire_bite from './blood_curse';
import push from './push';
import pull from './pull';
import vortex from './vortex';
import dash from './dash';
import repel from './repel';
import decoy from './summon_decoy';
import summon_generic from './summon_generic';
import explode from './bloat';
import corpse_explosion from './corpse_explosion';
import lastWill from './lastwill';
import split from './split';
import drown from './drown';
import target_similar from './target_similar';
import target_all from './target_all';
import target_cone from './target_cone';
import plus_radius from './plus_radius';
import shove from './shove';
import target_column from './target_column';
import burst from './burst';
import slow from './slow';
import death_wager from './death_wager';
import devRecordDelay from './devRecordDelay';
import registerSummoningSickness from '../modifierSummoningSickness';
import registerMaybeManaOverfill from '../modifieMaybeManaOverfill';

import { IUpgrade, upgradeCardsSource } from '../Upgrade';
import { _getCardsFromIds } from './cardUtils';
import { addCardToHand } from '../entity/Player';
import Underworld from '../Underworld';
import { CardCategory } from '../types/commonTypes';
import { HasSpace } from '../entity/Type';
import { Overworld } from '../Overworld';
import { allUnits } from '../entity/units';
export interface Modifiers {
  subsprite?: Subsprite;
  // run special init logic (usually for visuals) when a modifier is added or loaded
  // see 'poison' for example
  // init is inteded to be called within add.
  init?: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean) => void;
  add?: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number, extra?: object) => void;
  remove?: (unit: Unit.IUnit, underworld: Underworld) => void;
}
interface Events {
  onDamage?: onDamage;
  onDeath?: onDeath;
  onMove?: onMove;
  onAgro?: onAgro;
  onTurnStart?: onTurnStart;
  onTurnEnd?: onTurnEnd;

}
export interface Spell {
  card: ICard;
  // modifiers keep track of additional state on an individual unit basis
  modifiers?: Modifiers;
  // events trigger custom behavior when some event occurs
  events?: Events;
}
export function registerModifiers(id: string, modifiers: Modifiers) {

  allModifiers[id] = modifiers;
}
export function registerEvents(id: string, events: Events) {
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

function register(spell: Spell, overworld: Overworld) {
  const { modifiers, card, events } = spell;
  const { id } = card;
  // Add card to cards pool
  allCards[id] = card;
  // Add modifiers to allModifiers
  if (spell.modifiers) {
    registerModifiers(id, spell.modifiers);
  }
  // Add card as upgrade:
  upgradeCardsSource.push(cardToUpgrade(card, overworld));
  // Add subsprites
  if (modifiers && modifiers.subsprite) {
    Subsprites[modifiers.subsprite.imageName] = modifiers.subsprite;
  }
  // Add events
  if (events) {
    registerEvents(id, events);
  }
}
export function registerCards(overworld: Overworld) {
  if (location && location.href.includes('localhost')) {
    register(devRecordDelay, overworld);
  }
  register(slash, overworld);
  register(rend, overworld);
  register(bleed, overworld);
  register(suffocate, overworld);
  register(add_heal, overworld);
  register(target_circle, overworld);
  register(connect, overworld);
  register(contagious, overworld);
  register(freeze, overworld);
  register(raise_dead, overworld);
  register(shield, overworld);
  register(poison, overworld);
  register(purify, overworld);
  register(swap, overworld);
  register(displace, overworld);
  register(debilitate, overworld);
  register(protection.default, overworld);
  register(clone, overworld);
  register(mana_burn, overworld);
  register(mana_steal, overworld);
  register(vampire_bite, overworld);
  register(push, overworld);
  register(pull, overworld);
  register(vortex, overworld);
  register(dash, overworld);
  register(repel, overworld);
  register(decoy, overworld);
  register(explode, overworld);
  // Temporarily remove corpse_explosion until optimization
  // issues are solved
  // register(corpse_explosion, overworld);
  register(lastWill, overworld);
  register(split, overworld);
  register(drown, overworld);
  register(target_similar, overworld);
  register(target_all, overworld);
  register(target_cone, overworld);
  register(plus_radius, overworld);
  register(shove, overworld);
  register(target_column, overworld);
  register(burst, overworld);
  register(slow, overworld);
  register(death_wager, overworld);
  for (let unitId of Object.keys(allUnits)) {
    const spell = summon_generic(unitId);
    if (spell) {
      register(spell, overworld);
    }
  }

  // Register floating modifier (non-card);
  registerSummoningSickness();
  registerMaybeManaOverfill();

}
function cardToUpgrade(c: ICard, overworld: Overworld): IUpgrade {
  return {
    title: c.id,
    type: 'card',
    description: () => c.description.trim(),
    thumbnail: `images/spell/${c.thumbnail}`,
    // TODO: Feature creep: What if you could UPGRADE the effect of a spell!! 0.o
    maxCopies: 1,
    effect: (player) => {
      if (!overworld.underworld) {
        console.error('Cannot add card to hand, underworld is undefined');
        return;
      }
      addCardToHand(c, player, overworld.underworld);
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
  targetedDoodads: Doodad.IDoodad[];
  castLocation: Vec2;
  // aggregator carries extra information that can be passed
  // between card effects.
  aggregator: {
    unitDamage: UnitDamage[],
    radius: number;
    lastSpellCost: number;
  };
}
export function hasTargetAtPosition(position: Vec2, underworld: Underworld): boolean {
  const unitAtCastLocation = underworld.getUnitAt(position);
  const pickupAtCastLocation = underworld.getPickupAt(position);
  const doodadAtCastLocation = underworld.getDoodadAt(position);
  return !!unitAtCastLocation || !!pickupAtCastLocation || !!doodadAtCastLocation;
}
// Returns all current targets of an effect / spell
// See underworld.getPotentialTargets for the function that returns all targetable
// entities
export function getCurrentTargets(state: EffectState): HasSpace[] {
  return [...state.targetedUnits, ...state.targetedPickups, ...state.targetedDoodads];
}
export type EffectFn = {
  // Dry run is for displaying to the user what will happen if they cast
  (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, outOfRange?: boolean): Promise<EffectState>;
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

export function addTarget(target: any, effectState: EffectState) {
  if (Unit.isUnit(target)) {
    addUnitTarget(target, effectState);
  } else if (Pickup.isPickup(target)) {
    addPickupTarget(target, effectState);
  } else if (Doodad.isDoodad(target)) {
    addDoodadTarget(target, effectState);
  } else {
    console.error('addTarget unsupported for ', target);
  }
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
export function addDoodadTarget(doodad: Doodad.IDoodad, effectState: EffectState) {
  // Adds a doodad to effectState.targetedDoodads IF it is not already in targetedDoodads
  if (effectState.targetedDoodads.indexOf(doodad) === -1) {
    effectState.targetedDoodads.push(doodad);
  }
}