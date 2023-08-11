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
import { playerCastAnimationColor, playerCoatPrimary, playerCoatSecondary, playerNoColor } from '../graphics/ui/colors';
import Underworld, { turn_phase } from '../Underworld';
import * as target_cone from '../cards/target_cone';
import * as lastWill from '../cards/lastwill';
import * as captureSoul from '../cards/capture_soul';
import { explain, EXPLAIN_BLESSINGS, isTutorialComplete } from '../graphics/Explain';
import { lightenColor } from '../graphics/ui/colorUtil';
import { AttributePerk } from '../Perk';
import { setPlayerNameUI } from '../PlayerUtils';
import { arrowCardId } from '../cards/arrow';

const elInGameLobby = document.getElementById('in-game-lobby') as (HTMLElement | undefined);
const elInstructions = document.getElementById('instructions') as (HTMLElement | undefined);
// The serialized version of the interface changes the interface to allow only the data
// that can be serialized in JSON.  It may exclude data that is not neccessary to
// rehydrate the JSON into an entity
export type IPlayerSerialized = Omit<IPlayer, "unit"> & { unit: { id: number } };
export interface CardUsage {
  [cardId: string]: number
}
interface Stats {
  bestSpell: {
    unitsKilled: number,
    spell: string[]
  };
  longestSpell: string[];
  gameStartTime: number;
  totalKills: number;
}
export enum MageType {
  Spellmason,
  Timemason,
  Bloodmason,
  Necromancer,
  Archer
}
export interface IPlayer {
  // Multiplayer "gamer handle"
  name: string;
  mageType?: MageType;
  // color of robe
  color: number;
  // color of the player's magic
  colorMagic: number;
  endedTurn: boolean;
  // wsPie id
  clientId: string;
  clientConnected: boolean;
  unit: Unit.IUnit;
  awaitingSpawn: boolean,
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
  // note: menu depends on the name of this variable, if you refactor it
  // refactor it in Golem-Menu repo too
  lobbyReady: boolean;
  // A counter that keeps track of how many times the player has rerolled
  // their upgrade choice so that they get to pick from fewer each time they
  // reroll.
  reroll: number;
  attributePerks: AttributePerk[];
  // Stores state that modifies spells
  spellState: { [spellId: string]: any };
  stats: Stats;
  cursesChosen: number;
}
export function inPortal(player: IPlayer): boolean {
  return isNaN(player.unit.x) || isNaN(player.unit.y) || player.unit.x === null || player.unit.y === null;
}
export function changeMageType(type: MageType, player: IPlayer, underworld: Underworld) {
  player.mageType = type;
  console.log('Player mageType changed to', MageType[type]);
  switch (type) {
    case MageType.Archer:
      {
        const upgrade = Upgrade.getUpgradeByTitle(arrowCardId);
        if (upgrade) {
          underworld.chooseUpgrade(player, upgrade);
        } else {
          console.error('Could not find arrow upgrade for', type);
        }
      }
      {
        const upgrade = Upgrade.getUpgradeByTitle(target_cone.id);
        if (upgrade) {
          underworld.chooseUpgrade(player, upgrade);
        } else {
          console.error('Could not find target cone upgrade for', type);
        }
      }
      break;
    case MageType.Necromancer:
      {
        const upgrade = Upgrade.getUpgradeByTitle(captureSoul.id);
        if (upgrade) {
          underworld.chooseUpgrade(player, upgrade);
        } else {
          console.error('Could not find upgrade for', type);
        }
      }
      break;
  }

}
export function create(clientId: string, underworld: Underworld): IPlayer {
  const userSource = defaultPlayerUnit;
  const player: IPlayer = {
    name: '',
    mageType: MageType.Spellmason,
    endedTurn: false,
    clientId,
    // init players as not connected.  clientConnected status
    // should only be handled in one place and tied directly
    // to pie.clients
    clientConnected: false,
    color: playerNoColor,
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
    awaitingSpawn: false,
    isSpawned: false,
    // *3 for all card containers including floating card containers
    cards: Array(config.NUMBER_OF_TOOLBAR_SLOTS * 3).fill(''),
    inventory: [],
    cardUsageCounts: {},
    upgrades: [],
    upgradesLeftToChoose: config.STARTING_CARD_COUNT,
    perksLeftToChoose: 0,
    lobbyReady: false,
    reroll: 0,
    attributePerks: [],
    spellState: {},
    cursesChosen: 0,
    stats: {
      bestSpell: { unitsKilled: 0, spell: [] },
      longestSpell: [],
      gameStartTime: Date.now(),
      totalKills: 0
    }
  };
  player.unit.originalLife = true;
  // Player units get full mana every turn
  player.unit.manaPerTurn = player.unit.manaMax;
  // Player units shouldn't be pushed around
  // during collisions while other units move
  player.unit.immovable = true;
  player.unit.attackRange = config.PLAYER_BASE_ATTACK_RANGE;
  player.unit.staminaMax = config.PLAYER_BASE_STAMINA;
  player.unit.stamina = config.PLAYER_BASE_STAMINA;

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
  if (color === undefined || isNaN(color)) {
    console.log('Prevented setting robe color to invalid value', color);
    return;
  }
  // Protect against hex number as string coming in from storage
  if (typeof colorMagic === 'string') {
    colorMagic = parseInt(colorMagic);
  }
  player.color = color;
  player.colorMagic = colorMagic || (color == playerNoColor ? playerCastAnimationColor : color);
  // Add player-specific shaders
  // regardless of if the image sprite changes to a new animation or not.
  if (player.unit.image && player.unit.image.sprite.filters) {


    const colorSecondary = lightenColor(color, 0.3);
    if (color && colorSecondary && color !== playerNoColor) {
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
  if (player === globalThis.player) {
    globalThis.awaitingSpawn = false;
  }
  player.endedTurn = false;
  // Update player position to be NOT NaN or null (which indicates that the player is in portal),
  // instead, the player is now spawning so their position should be a number.
  // This is important because it allows the player to see enemy attentionMarkers when
  // they are choosing their spwan; whereas if the position remained NaN or null inPortal would
  // return true and it wouldn't run predictions on them.
  player.unit.x = -1000;
  player.unit.y = -1000;

  // Clear the player units path when resetting
  // This prevents a bug where on a multiplayer game restart after a loss
  // the player unit's stamina would drain while they were picking a spawn point
  // because they still had a path set
  player.unit.path = undefined;

  if (elInstructions && globalThis.player == player) {
    elInstructions.innerHTML = `${i18n('choose spawn instructions')}`
    // Add left-click image for early levels to help players know how to spawn
    if (underworld.levelIndex < 2) {
      elInstructions.style.top = "260px";
      elInstructions.innerHTML += ` <img src="mouse-LMB-bg.png" alt="Left Mouse Button"/>`
    } else {
      // Much less obtrusive instructions for later levels
      elInstructions.style.top = "20px";
    }
  }

  // Reset cooldowns on spells
  for (let spellState of Object.values(player.spellState)) {
    if (spellState.cooldown) {
      spellState.cooldown = 0;
    }
  }

  // Make unit visible only if they are current users player
  // so that they can see where to spawn them
  if (globalThis.player == player) {
    Image.show(player.unit.image);
  }

  Unit.resetUnitStats(player.unit, underworld);

  // Manage game over state so that if this is a restart
  // and the game over window is currently up, it will dismiss it
  underworld.tryGameOver();
}
// Keep a global reference to the current client's player
export function updateGlobalRefToCurrentClientPlayer(player: IPlayer, underworld: Underworld) {
  if (globalThis.clientId === player.clientId) {
    if (numberOfHotseatPlayers > 1) {
      // globalThis.player should always correspond with the first player in the players array since the hotseat
      // is managed by changing the order of the array
      globalThis.player = underworld.players[0];
    } else {
      globalThis.player = player;
    }
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
    if (!isHost(underworld.pie)) {
      console.error('Failed to load player because cannot find associated unit with ID', player.unit.id);
      console.log('Requesting game state from host')
      underworld.pie.sendData({
        type: MESSAGE_TYPES.REQUEST_SYNC_GAME_STATE
      })
    }
    return;
  }
  const playerLoaded: IPlayer = {
    ...player,
    unit: reassignedUnit,
  };
  // Account for pervious serialized versions of the game not having spellState
  // and make sure it's loaded and not undefined
  if (!playerLoaded.spellState) {
    playerLoaded.spellState = {};
  }
  // Account for pervious serialized versions of the game not having cursesChosen
  // and make sure it's loaded and not undefined
  if (playerLoaded.cursesChosen === undefined) {
    playerLoaded.cursesChosen = 0;
  }
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
  setPlayerNameUI(playerLoaded);
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
    .map(p => {
      let status = '';
      if (!p.clientConnected) {
        status = i18n('Disconnected');
      } else if (!p.isSpawned) {
        status = i18n('Picking Start Point');
      } else if (!p.unit.alive) {
        status = i18n('Dead');
      } else if (p.endedTurn && underworld.turn_phase == turn_phase.PlayerTurns) {
        status = i18n('Ready for next turn');
      }
      return { name: p.name || p.clientId, clientId: p.clientId, clientConnected: p.clientConnected, status, color: playerColorToCss(p), ready: p.lobbyReady ? i18n('Ready') : i18n('Not Ready') };
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
  // Note: This should occur AFTER dead, non-portaled players may have entered the portal
  // because checkForEndOfLevel considers if all players are portaled.
  const wentToNextLevel = underworld.checkForEndOfLevel();
  if (!wentToNextLevel) {
    // Entering the portal ends the player's turn
    underworld.endPlayerTurn(player.clientId);
  }
}
// Note: this is also used for AI targeting to ensure that AI don't target disabled plaeyrs
export function ableToAct(player: IPlayer) {
  // So long as a player is clientConnected, they can act if:
  // - They haven't spawned yet
  // - or if they are alive and not in the portal
  const ableToTakeTurn = player.clientConnected && (!player.isSpawned || (!inPortal(player) && player.unit.alive));
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
      // Explain blessings once you get a blessings card
      // UNLESS that card is last will because last will is a blessing meant to be
      // cast on enemies
      if (card.id !== lastWill.id) {
        explain(EXPLAIN_BLESSINGS);
      }
    }
    player.inventory.push(card.id);
    const emptySlotIndex = player.cards.indexOf('');
    // Add the spell to the toolbar
    if (emptySlotIndex !== -1 && emptySlotIndex < 9) {
      player.cards[emptySlotIndex] = card.id;
    }
    CardUI.recalcPositionForCards(player, underworld);
  }
}
export function setSpellmasonsToChannellingAnimation(player: IPlayer) {
  const bookInAnimationPath = 'units/playerBookIn';
  new Promise<void>((resolve) => {
    if (player.unit.image) {
      Image.changeSprite(
        player.unit.image,
        bookInAnimationPath,
        player.unit.image.sprite.parent,
        resolve,
        {
          loop: false,
          // Play the book open animation a little faster than usual so
          // the player can get on with idling
          animationSpeed: 0.2
        }
      );
      Image.addOneOffAnimation(player.unit, 'units/playerBookInMagic', { doRemoveWhenPrimaryAnimationChanges: true }, {
        loop: false,
        // Play the book open animation a little faster than usual so
        // the player can get on with idling
        animationSpeed: 0.2
      });
    } else {
      resolve();
    }
  }).then(() => {
    // Only change to playerBookIdle if the animation finished and was still the "book in" animation
    if (player.unit.image && player.unit.image.sprite.imagePath == bookInAnimationPath) {
      Image.changeSprite(
        player.unit.image,
        'units/playerBookIdle',
        player.unit.image.sprite.parent,
        undefined,
        {
          loop: true
        }
      );
      Image.addOneOffAnimation(player.unit, 'units/playerBookIdleMagic', { doRemoveWhenPrimaryAnimationChanges: true }, { loop: true });
    }

  });

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
