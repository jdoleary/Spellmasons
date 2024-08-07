import type * as Player from '../entity/Player';
import * as Unit from '../entity/Unit';
import * as Pickup from '../entity/Pickup';
import type { Vec2 } from '../jmath/Vec';
import Events, {
  onDealDamage,
  onTakeDamage,
  onKill,
  onTooltip,
  onDeath,
  onMove,
  onAgro,
  onTurnStart,
  onTurnEnd,
  onDrawSelected,
  onProjectileCollision,
  onTeleport,
  onSpawn,
  onPickup,
} from '../Events';
import Subsprites, { Subsprite } from '../Subsprites';
// Register spells:
import slash from './slash';
import heavySlash from './heavy_slash';
import megaSlash from './mega_slash';
import rend from './rend';
import bleed from './bleed';
import execute from './execute';
import heal from './heal';
import heal_greater from './heal_greater';
import heal_mass from './heal_mass';
import send_mana from './send_mana';
import contaminate from './contaminate';
import freeze from './freeze';
import resurrect from './resurrect';
import resurrect_weak from './resurrect_weak';
import resurrect_toxic from './resurrect_toxic';
import empower from './empower';
import shield from './shield';
import fortify from './fortify';
import alchemize from './alchemize';
import last_Will from './lastwill';
import potion_shatter from './potion_shatter';
import swap from './swap';
import teleport from './teleport';
import recall from './recall';
import displace from './displace';
import purify from './purify';
import enfeeble from './enfeeble';
import poison from './poison';
import suffocate from './suffocate';
import debilitate from './debilitate';
import soul_bind from './soul_bind';
import soul_shard from './soul_shard';
import * as protection from './protection';
import merge from './merge';
import clone from './clone';
import clone2 from './clone2';
import capture_soul from './capture_soul';
import mana_burn from './mana_burn';
import mana_steal from './mana_steal';
import conserve from './conserve';
import blood_curse from './blood_curse';
import push from './push';
import repel from './repel';
import pull from './pull';
import vortex from './vortex';
import dash from './dash';
import fling from './fling';
import decoy from './summon_decoy';
import summon_generic from './summon_generic';
import bloat from './bloat';
import bone_shrapnel from './bone_shrapnel';
import shatter from './shatter';
import meteor from './meteor';
import split from './split';
import polymorph from './polymorph';
import drown from './drown';
import blood_bath from './blood_bath';
import dark_tide from './dark_tide';
import target_arrow from './target_arrow';
import target_disk from './target_disk';
import target_column from './target_column';
import target_cone from './target_cone';
import target_circle from './target_circle';
import connect from './connect';
import target_similar from './target_similar';
import target_similar_2 from './target_similar_2';
import target_injured from './target_injured';
import target_all from './target_all';
import target_curse from './target_curse';
import add_pierce from './add_pierce';
import add_bounce from './add_bounce';
import plus_radius from './plus_radius';
import shove from './shove';
import stomp from './stomp';
import burst from './burst';
import slow from './slow';
import death_wager from './death_wager';
import sacrifice from './sacrifice';
import devRecordDelay from './devRecordDelay';
import devCauseDesync from './devCauseDesync';
import arrow from './arrow';
import arrow2 from './arrow2';
import arrow3 from './arrow3';
import arrowFork from './arrow_fork';
import arrowTriple from './arrow_triple';
import arrowMulti from './arrow_multi';
import arrowFar from './arrow_far';
import explosive_arrow from './explosive_arrow';
import phantom_arrow from './phantom_arrow';
import bolt from './bolt';
import cursify from './cursify';
// Not used as a card, for making half of looped enemies immune
// on first turn
import registerSummoningSickness from '../modifierSummoningSickness';
import registerCorpseDecay from '../modifierCorpseDecay';
import registerImmune, * as immune from './immune';
import registerImpendingDoom from '../modifierImpendingDoom';
import registerSoulShardOwner from '../modifierSoulShardOwner';
import registerUndying from '../modifierUndying';
import { registerUrnIceExplode } from '../entity/units/urn_ice';
import { registerUrnPoisonExplode } from '../entity/units/urn_poison';
import { registerUrnExplosiveExplode } from '../entity/units/urn_explosive';
import { registerDeathmasonEvents } from '../entity/units/deathmason';
// import trap from './trap';

import * as config from '../config';

import { IUpgrade, upgradeCardsSource } from '../Upgrade';
import { _getCardsFromIds } from './cardUtils';
import { addCardToHand } from '../entity/Player';
import Underworld from '../Underworld';
import { CardCategory, CardRarity, probabilityMap, UnitSubType, UnitType } from '../types/commonTypes';
import { HasSpace } from '../entity/Type';
import { Overworld } from '../Overworld';
import { allUnits } from '../entity/units';
import floatingText from '../graphics/FloatingText';
import { Localizable } from '../localization';
import { distance } from '../jmath/math';
import { getSpellThumbnailPath } from '../graphics/ui/CardUI';
import { calculateGameDifficulty } from '../Difficulty';
import registerPrimedCorpse from '../modifierPrimedCorpse';
import registerSlime from '../modifierSlime';
import registerConfidence from '../modifierConfidence';
import registerDefiance from '../modifierDefiance';
import registerDamageLimiter from '../modifierDamageLimiter';
import registerTargetImmune, { targetImmuneId } from '../modifierTargetImmune';
import registerGrowth from '../modifierGrowth';
import registerModifierStatUpgrades from '../modifierStatUpgrades';
import registerDareDevil from '../modifierDareDevil';
import registerEndlessQuiver from '../modifierEndlessQuiver';
import registerInexhaustible from '../modifierInexhaustible';
import registerAffinityBlessing from '../modifierAffinityBlessing';
import registerAffinityCurse from '../modifierAffinityCurse';
import registerAffinityDamage from '../modifierAffinityDamage';
import registerAffinityMovement from '../modifierAffinityMovement';
import registerAffinitySoul from '../modifierAffinitySoul';
import registerAffinityTargeting from '../modifierAffinityTargeting';
import registerFarGazerRune from '../modifierFarGazer';
import registerGamblerRune from '../modifierGambler';
import registerNecromancerRune from '../modifierNecromancer';
import registerTimemasonRune from '../modifierTimemason';
import registerWitchRune from '../modifierWitch';
import registerArmor from '../modifierArmor';
import registerHealthRegen from '../modifierHealthRegen';
import registerManaBarrier from '../modifierManaBarrier';
import registerOnHitHealing from '../modifierOnHitHealing';
import registerOnHitPoison from '../modifierOnHitPoison';
import registerOverheal from '../modifierOverheal';
import registerRevitalize from '../modifierRevitalize';
import registerSelfInvulnerability from '../modifierSelfImmunity';
import registerShieldRegen from '../modifierShieldRegen';
import registerThorns from '../modifierThorns';
import registerBasePierce from '../modifierBasePierce';
import registerBaseRadiusBoost from '../modifierBaseRadiusBoost';
import registerContaminateSelfOnTeleport from '../modifierContaminateSelfOnTeleport';
import registerCloneOnSpawn from '../modifierCloneOnSpawn';
import registerShieldBash from '../modifierShieldBash';
import registerOnKillMana from '../modifierOnKillMana';
import registerBounty from '../modifierBounty';
import registerBountyHunter from '../modifierBountyHunter';
import registerBountyRestoreHealth from '../modifierBountyRestoreHealth';
import registerBountyRestoreStamina from '../modifierBountyRestoreStamina';
import registerBountyRestoreMana from '../modifierBountyRestoreMana';
import registerBountyDamage from '../modifierBountyDamage';
import registerLiquidmancer from '../modifierLiquidmancer';
import registerHeavyImpacts from '../modifierHeavyImpact';
import registerPotionEffectiveness from '../modifierPotionEffectiveness';
import registerPotionBarrier from '../modifierPotionBarrier';


export interface Modifiers {
  // modifier sthat are not attached to a spell need an explicit id set
  id?: string;
  subsprite?: Subsprite;
  // Denotes a rune that is on the left side of the runes menu
  // cannot be locked, and does not change 
  constant?: boolean;
  // Controls the order in which a modifier's events trigger
  // relative to other events
  stage?: MODIFIER_STAGE;
  // run special init logic (usually for visuals) when a modifier is added or loaded
  // see 'poison' for example
  // init is inteded to be called within add.
  // Anything that is not governed by the unit's state should be set in addModifierVisuals
  addModifierVisuals?: (unit: Unit.IUnit, underworld: Underworld) => void;
  add?: (unit: Unit.IUnit, underworld: Underworld, prediction: boolean, quantity: number, extra?: object) => void;
  remove?: (unit: Unit.IUnit, underworld: Underworld) => void;
  /* Quantity must be overridden special in the description so that it can change based on hover / current / next
  state in the Rune purchasing menu */
  unitOfMeasure?: string;
  description?: string;
  // If the modifier may be automatically added to minibosses
  // when the spawn, then the modifier gets a probability
  probability?: number;
  // Specifying a cost allows the modifier to be upgradable via the runes menu.
  costPerUpgrade?: number;
  // Adds X quantity per purchase of the rune
  quantityPerUpgrade?: number;
  // Upgrade can be purchased X times
  // IMPORTANT NOTE: The modifier MUST be added to the unit's modifiers array
  // with `getOrInitModifier` in order for it's quantity to be tracked
  // and to prevent it being upgraded more than maxUpgradeCount
  maxUpgradeCount?: number;
  // Allows certain non-rune modifiers to persist between levels
  keepBetweenLevels?: boolean;
}
export interface Events {
  // events that are not attached to a spell need an explicit id set
  id?: string;
  onDealDamage?: onDealDamage;
  onTakeDamage?: onTakeDamage;
  onKill?: onKill;
  onTooltip?: onTooltip;
  onDeath?: onDeath;
  onMove?: onMove;
  onTeleport?: onTeleport;
  onSpawn?: onSpawn;
  onPickup?: onPickup;
  onAgro?: onAgro;
  onTurnStart?: onTurnStart;
  onTurnEnd?: onTurnEnd;
  onDrawSelected?: onDrawSelected;
  onProjectileCollision?: onProjectileCollision;
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
  // @ts-ignore: For dev debug viewing modifiers.
  // ts-ignored because it's not declared in global
  // types and meant to be used as debug only
  // (Also used for codex to display modifiers)
  globalThis.allModifiers = allModifiers;

  // Add subsprites
  if (modifiers && modifiers.subsprite) {
    Subsprites[modifiers.subsprite.imageName] = modifiers.subsprite;
  }
}
export function registerEvents(id: string, events: Events) {
  if (events.onAgro) {
    Events.onAgroSource[id] = events.onAgro;
  }
  if (events.onDealDamage) {
    Events.onDealDamageSource[id] = events.onDealDamage;
  }
  if (events.onTakeDamage) {
    Events.onTakeDamageSource[id] = events.onTakeDamage;
  }
  if (events.onKill) {
    Events.onKillSource[id] = events.onKill;
  }
  if (events.onTooltip) {
    Events.onTooltipSource[id] = events.onTooltip;
  }
  if (events.onDeath) {
    Events.onDeathSource[id] = events.onDeath;
  }
  if (events.onMove) {
    Events.onMoveSource[id] = events.onMove;
  }
  if (events.onTeleport) {
    Events.onTeleportSource[id] = events.onTeleport;
  }
  if (events.onSpawn) {
    Events.onSpawnSource[id] = events.onSpawn;
  }
  if (events.onPickup) {
    Events.onPickupSource[id] = events.onPickup;
  }
  if (events.onTurnStart) {
    Events.onTurnStartSource[id] = events.onTurnStart;
  }
  if (events.onTurnEnd) {
    Events.onTurnEndSource[id] = events.onTurnEnd;
  }
  if (events.onDrawSelected) {
    Events.onDrawSelectedSource[id] = events.onDrawSelected;
  }
  if (events.onProjectileCollision) {
    Events.onProjectileCollisionSource[id] = events.onProjectileCollision;
  }
}

export function registerSpell(spell: Spell, overworld: Overworld) {
  const { modifiers, card, events } = spell;
  const { id } = card;
  // Add card to cards pool
  allCards[id] = card;
  // Add modifiers to allModifiers
  if (spell.modifiers) {
    registerModifiers(id, spell.modifiers);
  }
  // Add card as upgrade:
  if (!upgradeCardsSource.find(u => u.title == card.id)) {
    upgradeCardsSource.push(cardToUpgrade(card, overworld));
  }
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
    registerSpell(devRecordDelay, overworld);
    registerSpell(devCauseDesync, overworld);
  }
  // Damage Spells
  registerSpell(slash, overworld);
  registerSpell(heavySlash, overworld);
  registerSpell(megaSlash, overworld);
  registerSpell(rend, overworld);
  registerSpell(bleed, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT && registerSpell(execute, overworld);
  registerSpell(drown, overworld);
  registerSpell(blood_bath, overworld);
  registerSpell(dark_tide, overworld);
  registerSpell(burst, overworld);
  registerSpell(bone_shrapnel, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT &&
    registerSpell(shatter, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT &&
    registerSpell(meteor, overworld);
  registerSpell(arrow, overworld);
  registerSpell(arrow2, overworld);
  registerSpell(arrow3, overworld);
  registerSpell(arrowFork, overworld);
  registerSpell(arrowTriple, overworld);
  registerSpell(arrowMulti, overworld);
  registerSpell(arrowFar, overworld);
  registerSpell(explosive_arrow, overworld);
  registerSpell(phantom_arrow, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT &&
    registerSpell(bolt, overworld);
  registerSpell(cursify, overworld);

  // Blessings
  registerSpell(heal, overworld);
  registerSpell(heal_greater, overworld);
  registerSpell(heal_mass, overworld);
  registerSpell(send_mana, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT && registerSpell(empower, overworld);
  registerSpell(shield, overworld);
  registerSpell(fortify, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT && registerSpell(alchemize, overworld);
  registerSpell(last_Will, overworld);
  registerSpell(potion_shatter, overworld);

  // Curses
  config.IS_ANNIVERSARY_UPDATE_OUT &&
    registerSpell(enfeeble, overworld);
  registerSpell(poison, overworld);
  registerSpell(suffocate, overworld);
  registerSpell(freeze, overworld);
  registerSpell(purify, overworld);
  registerSpell(debilitate, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT &&
    registerSpell(soul_bind, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT &&
    registerSpell(soul_shard, overworld);
  registerSpell(bloat, overworld);
  registerSpell(slow, overworld);
  registerSpell(blood_curse, overworld);
  registerSpell(split, overworld);
  registerSpell(polymorph, overworld);
  registerSpell(contaminate, overworld);

  // Mana
  registerSpell(mana_burn, overworld);
  registerSpell(mana_steal, overworld);
  registerSpell(conserve, overworld);
  registerSpell(death_wager, overworld);

  // Soul
  registerSpell(resurrect_weak, overworld);
  registerSpell(resurrect_toxic, overworld);
  registerSpell(resurrect, overworld);
  registerSpell(merge, overworld);
  registerSpell(clone, overworld);
  registerSpell(clone2, overworld);
  registerSpell(sacrifice, overworld);
  registerSpell(capture_soul, overworld);
  registerSpell(decoy, overworld);

  // Nullify / "protection" is too powerful, remove for now
  // - **bug** nullify bug: it doesn't leave after it cancels a spell so if you cast it on an enemy you cant kill it
  // register(protection.default, overworld);

  // Movement
  registerSpell(dash, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT &&
    registerSpell(fling, overworld);
  registerSpell(push, overworld);
  registerSpell(repel, overworld);
  registerSpell(pull, overworld);
  registerSpell(vortex, overworld);
  registerSpell(shove, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT &&
    registerSpell(stomp, overworld);
  registerSpell(displace, overworld);
  registerSpell(swap, overworld);
  registerSpell(teleport, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT &&
    registerSpell(recall, overworld);


  // Targeting Spells
  registerSpell(target_arrow, overworld);
  registerSpell(target_disk, overworld);
  registerSpell(target_column, overworld);
  registerSpell(target_cone, overworld);
  registerSpell(target_circle, overworld);
  registerSpell(connect, overworld);
  registerSpell(target_similar, overworld);
  registerSpell(target_similar_2, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT &&
    registerSpell(target_injured, overworld);
  registerSpell(target_all, overworld);
  config.IS_ANNIVERSARY_UPDATE_OUT &&
    registerSpell(target_curse, overworld);
  registerSpell(add_pierce, overworld);
  registerSpell(add_bounce, overworld);
  registerSpell(plus_radius, overworld);
  // registerSpell(trap, overworld);
  for (let unitId of Object.keys(allUnits)) {
    const spell = summon_generic(unitId, false);
    if (spell) {
      registerSpell(spell, overworld);
    }

    if (!allUnits[unitId]?.spawnParams?.excludeMiniboss) {
      const spellMiniboss = summon_generic(unitId, true);
      if (spellMiniboss) {
        registerSpell(spellMiniboss, overworld);
      }
    }
  }

  // Register floating modifier (non-card);
  registerSummoningSickness();
  registerCorpseDecay();
  registerPrimedCorpse();
  registerSlime();
  registerConfidence();
  registerDefiance();
  registerDamageLimiter();
  registerTargetImmune();
  registerGrowth();

  registerModifierStatUpgrades();
  registerDareDevil();

  registerNecromancerRune();
  registerWitchRune();
  registerEndlessQuiver();
  registerInexhaustible();
  registerTimemasonRune();
  registerFarGazerRune();
  registerGamblerRune();
  registerLiquidmancer();
  registerHeavyImpacts();

  registerAffinityBlessing();
  registerAffinityCurse();
  registerAffinityDamage();
  registerAffinityMovement();
  registerAffinitySoul();
  registerAffinityTargeting();

  registerSelfInvulnerability();
  registerArmor();
  registerThorns();
  registerHealthRegen();
  registerShieldRegen();
  registerRevitalize();
  registerOverheal();
  registerManaBarrier();
  registerOnHitHealing();
  registerOnHitPoison();
  registerBasePierce();
  registerBaseRadiusBoost();
  registerContaminateSelfOnTeleport();
  registerCloneOnSpawn();
  registerShieldBash();
  registerOnKillMana();

  registerBounty();
  registerBountyHunter();
  registerBountyRestoreHealth();
  registerBountyRestoreStamina();
  registerBountyRestoreMana();
  registerBountyDamage();

  registerPotionEffectiveness();
  registerPotionBarrier();

  registerImmune();
  registerImpendingDoom();
  registerSoulShardOwner();
  registerUndying();

  registerUrnIceExplode();
  registerUrnPoisonExplode();
  registerUrnExplosiveExplode();
  registerDeathmasonEvents();
}

// This is necessary because unit stats change with difficulty.
// Also since the stats are dynamic, I process the localization when the spell is registered
// for summon cards specifically unlike other cards, so their description must be refreshed if the language changes
export function refreshSummonCardDescriptions(underworld: Underworld) {
  const difficulty = calculateGameDifficulty(underworld);
  for (let unitId of Object.keys(allUnits)) {
    const spell = summon_generic(unitId, false, difficulty);
    if (spell) {
      const { card } = spell;
      const { id } = card;
      const allCardsCardOb = allCards[id];
      if (allCardsCardOb) {
        allCardsCardOb.description = card.description;
      }
    }
    const spellMiniboss = summon_generic(unitId, true, difficulty);
    if (spellMiniboss) {
      const { card } = spellMiniboss;
      const { id } = card;
      const allCardsCardOb = allCards[id];
      if (allCardsCardOb) {
        allCardsCardOb.description = card.description;
      }
    }
  }

}
// made global to prevent import loop in localize.ts
globalThis.refreshSummonCardDescriptions = refreshSummonCardDescriptions;

function cardToUpgrade(c: ICard, overworld: Overworld): IUpgrade {
  // Make forbidden cards unavailable in demo
  const probability = globalThis.isDemo && c.probability == probabilityMap[CardRarity.FORBIDDEN] ? 0 : c.probability;
  const thumbnail = getSpellThumbnailPath(c.thumbnail);
  return {
    title: c.id,
    replaces: c.replaces,
    // All `replaces` are also required for the upgrade to show up
    requires: [...c.replaces || [], ...c.requires || []],
    modName: c.modName,
    type: 'card',
    cardCategory: c.category,
    description: () => i18n(c.description).trim(),
    thumbnail,
    effect: (player) => {
      if (!overworld.underworld) {
        console.error('Cannot add card to hand, underworld is undefined');
        return;
      }
      addCardToHand(c, player, overworld.underworld);
    },
    probability: probability,
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
  shouldRefundLastSpell: boolean;
  casterCardUsage?: Player.CardUsage;
  casterUnit: Unit.IUnit;
  casterPositionAtTimeOfCast: Vec2;
  casterPlayer?: Player.IPlayer;
  targetedUnits: Unit.IUnit[];
  targetedPickups: Pickup.IPickup[];
  castLocation: Vec2;
  // aggregator carries extra information that can be passed
  // between card effects.
  aggregator: {
    // Used for radius effects like Target Circle
    radiusBoost: number;
    // Used for arrow effects
    additionalPierce: number;
    // Used for arrow effects
    additionalBounce: number;
  };
  // initialTargetedUnitId and initialTargetedPickupId:
  // Used to ensure the castCards targets the right starting
  // target when executed via a network message
  // Overriddes castLocation if exists.
  initialTargetedUnitId: number | undefined;
  initialTargetedPickupId: number | undefined;
}
export function refundLastSpell(state: EffectState, prediction: boolean, floatingMessage: string = 'No valid targets. Cost refunded.') {
  // Only refund the spell when it's not a prediction so that
  // it will show the mana cost in the UI of "remaining mana" even if
  // they are not currently hovering a valid target.
  // ---
  // Only allow refunding player units' mana. For example, if a priest casts resurrect
  // on a dead enemy that has "protection" on it (so the resurrect fails), it should not refund
  // priests mana.
  // Refund is exclusively for the benefit of players so they don't get frusterated by fizzle spells.
  if (!prediction && state.casterUnit.unitType == UnitType.PLAYER_CONTROLLED) {
    state.shouldRefundLastSpell = true;
    if (floatingMessage) {
      floatingText({ coords: state.casterUnit, text: globalThis.getChosenLanguageCode() == 'en' ? floatingMessage : i18n('refunded') });
    }
  }

}
export function hasTargetAtPosition(position: Vec2, underworld: Underworld): boolean {
  const unitAtCastLocation = underworld.getUnitAt(position);
  const pickupAtCastLocation = underworld.getPickupAt(position);
  return !!unitAtCastLocation || !!pickupAtCastLocation;
}
export function defaultTargetsForAllowNonUnitTargetTargetingSpell(targets: Vec2[], castLocation: Vec2, card: ICard): Vec2[] {
  if (card.allowNonUnitTarget && card.category === CardCategory.Targeting) {
    // Defaulting targets for a allowNonUnitTarget Targeting spell is handled specially:
    // For most (other) spells, you want the spell to snap to the target for convenience,
    // but for targeting spells you're often trying to pick a specific spot to target as many
    // as possible, therefore we do not want any snaping.
    // Returning just the castLocation when only one target (or less) is targeted
    // means that the spell will cast on the castLocation rather than the center of 
    // targets[0], which is some entity's (unit, pickup, doodad) center.
    const firstTarget = targets[0];
    return (
      // If there are no targets, return the cast location so players can cast a targeting spell anywhere on the ground
      targets.length == 0
      ||
      // If there is only 1 target, return the cast location (e.g. disable snapping) so long as the target isn't moving due to the spell.  If the distance from the target to the cast location
      // is less than what would be a selectable distance then disable snapping to the target; however, if not, DO SNAP (this allows Push + Targeting Spell to make the targeting spell appear at the final position
      // that the unit was pushed to) 
      firstTarget && targets.length == 1 && distance(firstTarget, castLocation) <= ((Unit.isUnit(firstTarget) && firstTarget.isMiniboss) ? config.SELECTABLE_RADIUS * config.UNIT_MINIBOSS_SCALE_MULTIPLIER : config.SELECTABLE_RADIUS)
    ) ? [castLocation] : targets;
  } else {
    console.error('defaultTargetsForAllowNonUnitTargetTargetingSpell was invoked on a card that it wasn\'t designed for:', card.id);
    return targets;
  }

}
// Returns all current targets of an effect / spell
// See underworld.getPotentialTargets for the function that returns all targetable
// entities
export function getCurrentTargets(state: EffectState): HasSpace[] {
  return [...state.targetedUnits, ...state.targetedPickups];
}
export type EffectFn = {
  // Dry run is for displaying to the user what will happen if they cast
  (state: EffectState, card: ICard, quantity: number, underworld: Underworld, prediction: boolean, outOfRange?: boolean): Promise<EffectState>;
};
export interface ICard {
  id: string;
  // array of other card ids that this card replaces when you pick it
  replaces?: string[];
  // array of other card ids that the player needs to have in order to be offered
  // this card as an upgrade.  Similar to `replaces`
  requires?: string[];
  // If a spell belongs to a mod, it's modName will be automatically assigned
  // This is used to dictate wether or not the modded spell is used
  modName?: string;
  category: CardCategory;
  manaCost: number;
  healthCost: number;
  probability: number;
  thumbnail: string;
  // The path for the animation effect when the spell is cast
  animationPath?: string;
  effect: EffectFn;
  description: Localizable;
  // requiresFollowingCard is for cards like chain or AOE that need another
  // card to follow them in order to have an effect
  requiresFollowingCard?: boolean;
  // The number of turns it takes after use to return to it's original cost
  // Default is 1
  expenseScaling: number;
  // This flag allows casting on the ground and is necessary
  // for spells like AOE, Trap, etc
  allowNonUnitTarget?: boolean;
  // Prevents the spell from targeting an initial unit or pickup.  Useful for spells
  // that don't make any use of targets
  noInitialTarget?: boolean;
  // supportQuantity, if true, makes multiple sequential invokations of a card combine
  // into only 1 invokation with a quantity arg passed to the effect function.
  // If false, it will just invoke card.effect for the number of times that the card
  // is in the spell
  supportQuantity?: boolean;
  // used to assist with targeting for spells that only affect dead units
  onlySelectDeadUnits?: boolean;
  // if true, character range will be ignored for this spell
  ignoreRange?: boolean;
  sfx?: string;
  // if a card should be triggered at the front of the spell list.
  // rare, but useful for spells like add radius so you can use them at the
  // end of your spell chain
  frontload?: boolean;
}

export const allCards: { [cardId: string]: ICard } = {};
globalThis.allCards = allCards;
export const allModifiers: { [id: string]: Modifiers } = {};

export function getCardsFromIds(cardIds: string[]): ICard[] {
  return _getCardsFromIds(cardIds, allCards);
}

export function addTarget(target: any, effectState: EffectState, underworld: Underworld, prediction: boolean) {
  if (Unit.isUnit(target)) {
    if (underworld.players.filter(p => !p.isSpawned).map(p => p.unit.id).includes(target.id)) {
      // Do not allow targeting unspawned players
      console.warn("Tried to add an unspawned player to the targets list: ", target);
      return;
    }
    addUnitTarget(target, effectState, prediction);
  } else if (Pickup.isPickup(target)) {
    addPickupTarget(target, effectState);
  } else {
    console.error('addTarget unsupported for ', target);
  }
}

// Note: See related `addTarget` function above which should be used for all
// targeting spells
export function addUnitTarget(unit: Unit.IUnit, effectState: EffectState, prediction: boolean) {
  // Exception: modifierTargetImmune prevents targeting unless targeted directly
  if (unit.modifiers[targetImmuneId] && unit.id !== effectState.initialTargetedUnitId) {
    floatingText({ coords: unit, text: targetImmuneId, prediction });
    return;
  }
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

// IMPORTANT NOTE: The modifier MUST be added to the unit's modifiers array
// with `getOrInitModifier` in order for it's quantity to be tracked
// and to prevent it being upgraded more than maxUpgradeCount
export function getMaxRuneQuantity(modifier: Modifiers) {
  if (modifier.maxUpgradeCount) {
    return (modifier.maxUpgradeCount * (modifier.quantityPerUpgrade || 1));
  }
  return Infinity
}

// Modifiers should not be in the same stage if 
// swapping their order changes the outcome of the event.
// I.E. Debilitate and Armor can't be in the same stage,
// but Debilitate and Fortify are mostly interchangeable
export type MODIFIER_STAGE = 'Soul Shard' | 'Soul Bind' | 'Amount Multiplier' | 'Amount Flat' | 'Amount Override'
  | 'Blood Curse' | 'Reactive Effects' | 'Unstaged Events';
export const MODIFIER_ORDER: MODIFIER_STAGE[] = [
  'Soul Shard',
  'Soul Bind',
  'Amount Multiplier',
  'Amount Flat',
  'Amount Override',
  'Blood Curse',
  'Reactive Effects',
  'Unstaged Events'
]

// Returns a sorting function to be used in .sort
// Pass in allModifiers as lookup for real use.  Injectable for testing.
export function eventsSorter(lookup: typeof allModifiers): (eventA: string, eventB: string) => number {
  return (eventA: string, eventB: string): number => {
    // Unstaged events trigger last so they are easier to debug
    const DEFAULT_STAGE = 'Unstaged Events';
    const lookupA = lookup[eventA];
    const eventAStage: MODIFIER_STAGE = lookupA?.stage !== undefined ? lookupA.stage : DEFAULT_STAGE;
    const lookupB = lookup[eventB];
    const eventBStage: MODIFIER_STAGE = lookupB?.stage !== undefined ? lookupB.stage : DEFAULT_STAGE;
    const indexA = MODIFIER_ORDER.indexOf(eventAStage);
    const indexB = MODIFIER_ORDER.indexOf(eventBStage);
    const orderA = indexA === -1 ? MODIFIER_ORDER.indexOf(DEFAULT_STAGE) : indexA;
    const orderB = indexB === -1 ? MODIFIER_ORDER.indexOf(DEFAULT_STAGE) : indexB;
    if (orderA === orderB) {
      // Sort alphabetically by event title if they are in the same stage
      return eventA.localeCompare(eventB);
    } else {
      return orderA - orderB;
    }
  }
}