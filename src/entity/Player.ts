import { PLAYER_BASE_HEALTH } from '../config';
import * as Unit from './Unit';
import * as Image from '../graphics/Image';
import * as Upgrade from '../Upgrade';
import * as CardUI from '../graphics/ui/CardUI';
import * as Cards from '../cards';
import * as config from '../config';
import { CardCategory, Faction, UnitType } from '../types/commonTypes';
import { clearTooltipSelection } from '../graphics/PlanningView';
import defaultPlayerUnit from './units/playerUnit';
import { MESSAGE_TYPES } from '../types/MessageTypes';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { playerCastAnimationColor, playerCoatPrimary, playerCoatSecondary } from '../graphics/ui/colors';
import Underworld, { turn_phase } from '../Underworld';
import { lerp } from "../jmath/math"
import * as inLiquid from '../inLiquid';
import * as slash from '../cards/slash';
import { explain, EXPLAIN_BLESSINGS, isTutorialComplete } from '../graphics/Explain';
import { lightenColor } from '../graphics/ui/colorUtil';

const elInGameLobby = document.getElementById('in-game-lobby') as (HTMLElement | undefined);
const elInstructions = document.getElementById('instructions') as (HTMLElement | undefined);
// The serialized version of the interface changes the interface to allow only the data
// that can be serialized in JSON.  It may exclude data that is not neccessary to
// rehydrate the JSON into an entity
export type IPlayerSerialized = Omit<IPlayer, "unit"> & { unit: { id: number } };
export interface CardUsage {
  [cardId: string]: number
}
export interface IPlayer {
  // Multiplayer "gamer handle"
  name: string;
  // color of robe
  color: number;
  // color of the player's magic
  colorMagic: number;
  endedTurn: boolean;
  // wsPie id
  clientId: string;
  clientConnected: boolean;
  unit: Unit.IUnit;
  isSpawned: boolean;
  // The spells that the player has on their toolbar
  cards: string[];
  // The spells that the player has in their inventory
  inventory: string[];
  // The spells and perks that a player has chosen
  upgrades: Upgrade.IUpgrade[];
  upgradesLeftToChoose: number;
  perksLeftToChoose: number;
  // Note: call updateCardManaBadges() any time you modify cardUsageCounts so it will
  // be reflected in the UI
  cardUsageCounts: CardUsage;
  // diedDuringLevel is used to make players that died miss the chance to get a perk at the beginning
  // of a new level
  diedDuringLevel: boolean;
  // note: menu depends on the name of this variable, if you refactor it
  // refactor it in Golem-Menu repo too
  lobbyReady: boolean;
}
export function inPortal(player: IPlayer): boolean {
  return isNaN(player.unit.x) || isNaN(player.unit.y) || player.unit.x === null || player.unit.y === null;
}
export function create(clientId: string, underworld: Underworld): IPlayer {
  const userSource = defaultPlayerUnit;
  const player: IPlayer = {
    name: '',
    endedTurn: false,
    clientId,
    // init players as not connected.  clientConnected status
    // should only be handled in one place and tied directly
    // to pie.clients
    clientConnected: false,
    color: 0xffffff,
    colorMagic: playerCastAnimationColor,
    unit: Unit.create(
      userSource.id,
      // x,y of NaN denotes that the player unit is
      // inPortal.  See the function inPortal for more
      NaN,
      NaN,
      Faction.ALLY,
      userSource.info.image,
      UnitType.PLAYER_CONTROLLED,
      userSource.info.subtype,
      undefined,
      underworld
    ),
    isSpawned: false,
    cards: Array(config.NUMBER_OF_TOOLBAR_SLOTS).fill(''),
    inventory: [],
    cardUsageCounts: {},
    upgrades: [],
    upgradesLeftToChoose: config.STARTING_CARD_COUNT,
    perksLeftToChoose: 0,
    diedDuringLevel: false,
    lobbyReady: false,
  };
  // Player units get full mana every turn
  player.unit.manaPerTurn = player.unit.manaMax;
  // Player units shouldn't be pushed around
  // during collisions while other units move
  player.unit.immovable = true;
  player.unit.attackRange = config.PLAYER_BASE_ATTACK_RANGE;
  player.unit.staminaMax = config.PLAYER_BASE_STAMINA;
  player.unit.stamina = config.PLAYER_BASE_STAMINA;

  // Add initial upgrades
  const hurtCardUpgrade = Upgrade.upgradeCardsSource.find(u => u.title == slash.id);
  if (hurtCardUpgrade) {
    underworld.chooseUpgrade(player, hurtCardUpgrade);
  } else {
    console.error('Could not start player with "hurt": upgrade not found');
  }

  player.unit.health = PLAYER_BASE_HEALTH;
  player.unit.healthMax = PLAYER_BASE_HEALTH;

  underworld.players.push(player);
  updateGlobalRefToCurrentClientPlayer(player, underworld);
  underworld.queueGameLoop();
  return player;
}
const ROBE_COLOR_FILTER_ID = 'robeColorFilter';
// TODO: This creates a NEW MultiColorReplaceFilter,
// there should be a better way of syncing filters.  This is a footgun if called
// more than once on a player object.  As of this writing it is only called on new player objects
// Proceed with caution.
// color: a color in hex such as 0xff0000
export function setPlayerRobeColor(player: IPlayer, color: number | string, colorMagic?: number | string) {
  // Protect against hex number as string coming in from storage
  if (typeof color === 'string') {
    color = parseInt(color);
  }
  // Protect against hex number as string coming in from storage
  if (typeof colorMagic === 'string') {
    colorMagic = parseInt(colorMagic);
  }
  player.color = color;
  player.colorMagic = colorMagic || color;
  // Add player-specific shaders
  // regardless of if the image sprite changes to a new animation or not.
  if (player.unit.image && player.unit.image.sprite.filters) {


    const colorSecondary = lightenColor(color, 0.3);
    if (color && colorSecondary) {
      const robeColorFilter = new MultiColorReplaceFilter(
        [
          [playerCoatPrimary, color],
          [playerCoatSecondary, colorSecondary],
          // Note: Most of the real color replace for the player's magic is done in 
          // pixiUtils within addSpriteAnimated so that it only replaces the colors of 
          // the magic.  When the replace was done here on the whole player sprite, the
          // transparency of the magic caused color replace problems. However, there is
          // some solid pink in the idle and walk animations which gets replaced right here
          // with a smaller epsilon.  So the player magic color is replaced in multiple
          // locations.
          [playerCastAnimationColor, player.colorMagic],
        ],
        0.1
      );
      // @ts-ignore: jid is a custom identifier to differentiate this filter
      robeColorFilter.jid = ROBE_COLOR_FILTER_ID;
      // Remove previous robeColorFilters
      // @ts-ignore: jid is a custom identifier to differentiate this filter
      player.unit.image.sprite.filters = player.unit.image.sprite.filters.filter(f => f.jid != ROBE_COLOR_FILTER_ID);
      // Add new robe color filter
      player.unit.image.sprite.filters.push(robeColorFilter);
    } else {
      // Remove robeColorFilters
      // @ts-ignore: jid is a custom identifier to differentiate this filter
      player.unit.image.sprite.filters = player.unit.image.sprite.filters.filter(f => f.jid != ROBE_COLOR_FILTER_ID);
    }
  } else {
    if (!globalThis.headless) {
      console.error('Attempted to set color but could not');
    }
  }
}
export function resetPlayerForNextLevel(player: IPlayer, underworld: Underworld) {
  // Set the player so they can choose their next spawn
  player.isSpawned = false;
  // Update player position to be NOT NaN or null (which indicates that the player is in portal),
  // instead, the player is now spawning so their position should be a number.
  // This is important because it allows the player to see enemy attentionMarkers when
  // they are choosing their spwan; whereas if the position remained NaN or null inPortal would
  // return true and it wouldn't run predictions on them.
  player.unit.x = -1000;
  player.unit.y = -1000;

  if (elInstructions && globalThis.player == player) {
    elInstructions.innerHTML = 'Choose a place to spawn with <img src="mouse-LMB-bg.png" alt="Left Mouse Button"/>'
  }

  // Make unit visible only if they are current users player
  // so that they can see where to spawn them
  if (globalThis.player == player) {
    Image.show(player.unit.image);
  }
  if (!player.unit.alive) {
    Unit.resurrect(player.unit);
  }

  if (player.unit.image) {
    // Remove liquid mask which may be attached if the player died in liquid
    inLiquid.remove(player.unit);
  }

  // Remove all modifiers between levels
  // This prevents players from scamming shields at the end of a level
  // on infinite mana
  Object.keys(player.unit.modifiers).forEach(modifierKey => {
    const modifier = player.unit.modifiers[modifierKey];
    if (modifier) {
      if (!modifier.persistBetweenLevels) {
        Unit.removeModifier(player.unit, modifierKey, underworld);
      }
    }
  });

  // Reset mana and health - otherwise players are incentivized to bum around after killing all enemies
  // to get their mana back to full
  player.unit.mana = player.unit.manaMax;
  player.unit.health = player.unit.healthMax;
  player.unit.stamina = player.unit.staminaMax;

  Unit.returnToDefaultSprite(player.unit);

  // Manage game over state so that if this is a restart
  // and the game over window is currently up, it will dismiss it
  underworld.tryGameOver();
}
// Keep a global reference to the current client's player
export function updateGlobalRefToCurrentClientPlayer(player: IPlayer, underworld: Underworld) {
  if (globalThis.clientId === player.clientId) {
    globalThis.player = player;
  }
}
// Converts a player entity into a serialized form
// that can be saved as JSON and rehydrated later into
// a full player entity 
// This is the opposite of load
export function serialize(player: IPlayer): IPlayerSerialized {
  const { unit, ...rest } = player;
  return {
    ...rest,
    unit: { id: unit.id },
  }
}
// load rehydrates a player entity from IPlayerSerialized
export function load(player: IPlayerSerialized, underworld: Underworld) {
  const reassignedUnit = underworld.units.find(u => u.id == player.unit.id);
  if (!reassignedUnit) {
    console.error('Failed to load player because cannot find associated unit with ID', player.unit.id);
    console.log('Requesting game state from host')
    underworld.pie.sendData({
      type: MESSAGE_TYPES.REQUEST_SYNC_GAME_STATE
    })
    return
  }
  const playerLoaded: IPlayer = {
    ...player,
    unit: reassignedUnit,
  };
  // Make sure player unit stays hidden if they are in a portal
  if (inPortal(playerLoaded)) {
    playerLoaded.unit.x = NaN;
    playerLoaded.unit.y = NaN;
    Image.hide(playerLoaded.unit.image);
  }
  updateGlobalRefToCurrentClientPlayer(playerLoaded, underworld);
  CardUI.recalcPositionForCards(playerLoaded, underworld);
  underworld.players.push(playerLoaded);
  if (underworld.overworld) {
    setClientConnected(playerLoaded, underworld.overworld.clients.includes(player.clientId), underworld);
  } else {
    console.error('cannot set client connected, no overworld');
  }
  underworld.queueGameLoop();
  setPlayerRobeColor(playerLoaded, playerLoaded.color);
  return playerLoaded;
}

// Sets boolean and substring denoting if the player has a @websocketpie/client client associated with it
export function setClientConnected(player: IPlayer, connected: boolean, underworld: Underworld) {
  player.clientConnected = connected;
  if (connected) {
    Image.removeSubSprite(player.unit.image, 'disconnected.png');
    underworld.queueGameLoop();
  } else {
    Image.addSubSprite(player.unit.image, 'disconnected.png');
    // If they disconnect, end their turn
    underworld.endPlayerTurn(player.clientId);
  }
  syncLobby(underworld);
}
export function syncLobby(underworld: Underworld) {
  const playerColorToCss = (p: IPlayer) => `#${(p.color || 0xffffff).toString(16)}`;
  globalThis.lobbyPlayerList = underworld.players
    .sort((a, _b) => {
      // Sort self to the top
      if (a === globalThis.player) {
        return -1;
      } else {
        return 0;
      }
    })
    .map(p => {
      let status = '';
      if (!p.clientConnected) {
        status = i18n('Disconnected');
      } else if (!p.isSpawned) {
        status = i18n('Picking Start Point');
      } else if (p.endedTurn && underworld.turn_phase == turn_phase.PlayerTurns) {
        status = i18n('Ready for next turn');
      }
      return { name: p.name || p.clientId, clientConnected: p.clientConnected, status, color: playerColorToCss(p), ready: p.lobbyReady ? i18n('Ready') : i18n('Not Ready') };
    });
  // Update lobby element
  if (elInGameLobby) {
    if (underworld.players.length == 1) {
      // Do not show lobby if there is only one player connected
      elInGameLobby.innerHTML = '';
      return;
    }
    // filter: Don't show disconnected players in in-game lobby.
    elInGameLobby.innerHTML = globalThis.lobbyPlayerList.filter(p => p.clientConnected).map(p => {
      return `<div class="ui-border"><div class="player"><span class="player-name"><span style="color:${p.color}">⬤&nbsp;</span>${p.name}</span><span>${p.status}</span></div></div>`
    }).join('');
  }
}
export function enterPortal(player: IPlayer, underworld: Underworld) {
  console.log(`Player ${player.clientId}/${player.name} entered portal.`)
  Image.hide(player.unit.image);
  // Make sure to resolve the moving promise once they enter the portal or else 
  // the client queue will get stuck
  player.unit.resolveDoneMoving();
  // Move "portaled" unit out of the way to prevent collisions and chaining while portaled
  Unit.setLocation(player.unit, { x: NaN, y: NaN });
  // Clear the selection so that it doesn't persist after portalling (which would show
  // your user's move circle in the upper left hand of the map but without the user there)
  clearTooltipSelection();
  // Entering the portal ends the player's turn
  underworld.endPlayerTurn(player.clientId);
}
// Note: this is also used for AI targeting to ensure that AI don't target disabled plaeyrs
export function ableToAct(player: IPlayer) {
  const ableToTakeTurn = !inPortal(player) && player.unit.alive && player.clientConnected;
  if (!ableToTakeTurn) {
    console.log(`Player ${player.clientId} unable to take turn.`, '!inPortal:', !inPortal(player), 'alive:', player.unit.alive, 'connected: ', player.clientConnected)
  }
  return ableToTakeTurn;
}

export function addCardToHand(card: Cards.ICard | undefined, player: IPlayer | undefined, underworld: Underworld) {
  if (!card) {
    console.error('Attempting to add undefined card to hand');
    return
  }
  if (!player) {
    console.warn("Attempted to add cards to a non-existant player's hand")
    return
  }
  // Players may not have more than 1 of a particular card, because now, cards are
  // not removed when cast
  if (!player.inventory.includes(card.id)) {
    // Only explain blessings if the tutorial is already done,
    // we don't want it to interrupt the natural flow of the tutorial
    if (isTutorialComplete() && card.category == CardCategory.Blessings) {
      explain(EXPLAIN_BLESSINGS);
    }
    player.inventory.push(card.id);
    const emptySlotIndex = player.cards.indexOf('');
    if (emptySlotIndex !== -1) {
      player.cards[emptySlotIndex] = card.id;
    }
    CardUI.recalcPositionForCards(player, underworld);
  }
}
// This function fully deletes the cards from the player's hand
export function removeCardsFromHand(player: IPlayer, cards: string[], underworld: Underworld) {
  player.cards = player.cards.filter(c => !cards.includes(c));
  // Remove any selected cards with a name in the cards array of this function
  for (let card of cards) {
    document.querySelectorAll(`#selected-cards .card[data-card-id="${card}"]`).forEach(el => {
      // clicking a selected card, deselects it
      (el as HTMLElement).click();
    });
  }
  CardUI.recalcPositionForCards(player, underworld);
}
