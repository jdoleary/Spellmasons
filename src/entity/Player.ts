import { PLAYER_BASE_HEALTH } from '../config';
import * as storage from '../storage';
import * as Unit from './Unit';
import * as Image from '../graphics/Image';
import * as colors from '../graphics/ui/colors';
import * as Upgrade from '../Upgrade';
import * as CardUI from '../graphics/ui/CardUI';
import * as Cards from '../cards';
import * as config from '../config';
import { CardCategory, Faction, UnitType } from '../types/commonTypes';
import { clearTooltipSelection } from '../graphics/PlanningView';
import defaultPlayerUnit, { spellmasonUnitId } from './units/playerUnit';
import { MESSAGE_TYPES } from '../types/MessageTypes';
import { MultiColorReplaceFilter } from '@pixi/filter-multi-color-replace';
import { playerCastAnimationColor, playerCoatPrimary, playerCoatSecondary, playerNoColor } from '../graphics/ui/colors';
import Underworld, { turn_phase } from '../Underworld';
import * as lastWill from '../cards/lastwill';
import { explain, EXPLAIN_BLESSINGS, isTutorialComplete } from '../graphics/Explain';
import { lightenColor } from '../graphics/ui/colorUtil';
import { setPlayerNameUI } from '../PlayerUtils';
import { cameraAutoFollow } from '../graphics/PixiUtils';
import { allUnits } from './units';
import { incrementPresentedRunesIndex } from '../jmath/RuneUtil';
import { investmentId } from '../modifierInvestment';
import { centeredFloatingText, queueCenteredFloatingText } from '../graphics/FloatingText';

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
  // Since two players could have the same clientId, such as in hotseat
  // We should also store a unique player identifier, and use that
  // instead of clientId for most game logic
  playerId: string;
  clientConnected: boolean;
  unit: Unit.IUnit;
  awaitingSpawn: boolean,
  isSpawned: boolean;
  // The spells that the player has on their toolbar
  cardsInToolbar: string[];
  // The spells that the player has in their inventory
  inventory: string[];
  // Cards that can no longer be used
  disabledCards: string[];
  // A list of spells that don't take up an upgrade count because they are obtained by other
  // means than by pickup up scrolls
  freeSpells: string[];
  // The titles of the spell upgrades that a player has chosen
  upgrades: string[];
  upgradesLeftToChoose: number;
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
  // Stores state that modifies spells
  spellState: { [spellId: string]: any };
  stats: Stats;
  cursesChosen: number;
  statPointsUnspent: number;
  lockedRunes: { index: number, key: string, runePresentedIndexWhenLocked?: number }[];
  runePresentedIndex: number;
}
export function inPortal(player: IPlayer): boolean {
  // Note: Even though inPortal can be determined by player.isSpawned,
  // it is also important to account for invalid player position, as inPortal is
  // often used to determine if player is "in valid game space"
  return !player.isSpawned || isNaN(player.unit.x) || isNaN(player.unit.y) || player.unit.x === null || player.unit.y === null;
}
export function create(clientId: string, playerId: string, underworld: Underworld): IPlayer {
  const userSource = defaultPlayerUnit;
  const player: IPlayer = {
    name: '',
    endedTurn: false,
    clientId,
    playerId,
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
      allUnits[spellmasonUnitId]?.unitProps,
      underworld
    ),
    awaitingSpawn: false,
    isSpawned: false,
    // *3 for all card containers including floating card containers
    cardsInToolbar: Array(config.NUMBER_OF_TOOLBAR_SLOTS * 3).fill(''),
    inventory: [],
    freeSpells: [],
    disabledCards: [],
    cardUsageCounts: {},
    upgrades: [],
    upgradesLeftToChoose: config.STARTING_CARD_COUNT,
    lobbyReady: false,
    reroll: 0,
    spellState: {},
    cursesChosen: 0,
    stats: {
      bestSpell: { unitsKilled: 0, spell: [] },
      longestSpell: [],
      gameStartTime: Date.now(),
      totalKills: 0
    },
    // backfill stat upgrades for players who join late
    statPointsUnspent: Math.max(0, underworld.levelIndex) * config.STAT_POINTS_PER_LEVEL,
    lockedRunes: [],
    runePresentedIndex: 0,
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
  player.endedTurn = false;

  resetPlayerForSpawn(player, underworld);

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

  // Exception: Run logic for `Investment` rune:
  const modifier = player.unit.modifiers[investmentId];
  if (modifier) {
    if (player) {
      const dividend = Math.round(player.statPointsUnspent * (modifier.quantity / 100));
      player.statPointsUnspent += dividend;
      if (globalThis.player === player) {
        queueCenteredFloatingText(`${i18n(investmentId)}: ${dividend} SP`);
      }
    }
  }


  Unit.resetUnitStats(player.unit, underworld);
  Unit.syncPlayerHealthManaUI(underworld);
}
// Keep a global reference to the current client's player
export function updateGlobalRefToPlayerIfCurrentClient(player: IPlayer) {
  if (globalThis.clientId == player.clientId) {
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
export function load(player: IPlayerSerialized, index: number, underworld: Underworld, isClientPlayerSourceOfTruth: boolean) {
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
  // @ts-ignore: Backwards compatibility.  Player.upgrades array has been changed to a list
  // of upgrade titles because the whole upgrade need not be stored, only the title is used.
  // This line converts old save file data to the new list of just titles.
  player.upgrades = player.upgrades.map(u => typeof u === 'object' ? u.title : u);
  const playerLoaded: IPlayer = {
    // @ts-ignore: Allow overwrite by spread for backwards compatibility
    statPointsUnspent: 0,
    ...player,
    unit: reassignedUnit,
  };

  if (isClientPlayerSourceOfTruth) {
    // Current client's player is the source of truth for their player object
    // and the below properties should remain the value that they are on this
    // clients globalPlayer object instead of being overwritten by the server's
    // player object.
    // This is because the client can make local changes that occur immediately which
    // might be wrongfully overwritten by a server SYNC_PLAYERS such as getting
    // a summon spell or rerolling.

    if (globalThis.player && globalThis.player.playerId == playerLoaded.playerId) {
      playerLoaded.cardsInToolbar = globalThis.player.cardsInToolbar;
      playerLoaded.inventory = globalThis.player.inventory;
      playerLoaded.freeSpells = globalThis.player.freeSpells;
      playerLoaded.upgrades = globalThis.player.upgrades;
      playerLoaded.upgradesLeftToChoose = globalThis.player.upgradesLeftToChoose;
      playerLoaded.reroll = globalThis.player.reroll;
      playerLoaded.statPointsUnspent = globalThis.player.statPointsUnspent;
    }
  }
  // Backwards compatibility after property name change
  // @ts-ignore cards was renamed to cardsInToolbar, this is for backwards compatibility
  if (player.cards) {
    // @ts-ignore cards was renamed to cardsInToolbar, this is for backwards compatibility
    playerLoaded.cardsInToolbar = player.cards;
  }
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
    // Make sure that isSpawned state is properly synced.  If they are inPortal,
    // then they must also have isSpawned == false or else they wont be able to 
    // respawn from a NaN, NaN position
    playerLoaded.isSpawned = false;
    Image.hide(playerLoaded.unit.image);
  }
  // Overwrite player
  underworld.players[index] = playerLoaded;
  CardUI.recalcPositionForCards(playerLoaded, underworld);
  updateGlobalRefToPlayerIfCurrentClient(playerLoaded);
  if (underworld.overworld) {
    setClientConnected(playerLoaded, underworld.overworld.clients.includes(player.clientId), underworld);
  } else {
    console.error('cannot set client connected, no overworld');
  }
  underworld.queueGameLoop();
  setPlayerRobeColor(playerLoaded, playerLoaded.color);
  setPlayerNameUI(playerLoaded);
  CardUI.tryShowStatPointsSpendable();
  return playerLoaded;
}

// Sets boolean and substring denoting if the player has a @websocketpie/client client associated with it
export function setClientConnected(player: IPlayer, connected: boolean, underworld: Underworld) {
  // Override: If in hotseat multiplayer than all clients are considered connected
  player.clientConnected = globalThis.numberOfHotseatPlayers > 1 ? true : connected;
  if (connected) {
    Image.removeSubSprite(player.unit.image, 'disconnected.png');
    underworld.queueGameLoop();
  } else {
    Image.addSubSprite(player.unit.image, 'disconnected.png');
  }
  syncLobby(underworld);
}
export function syncLobby(underworld: Underworld) {
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
      return { name: p.name || p.playerId, clientId: p.clientId, clientConnected: p.clientConnected, status, color: colors.convertToHashColor(p.color || 0xffffff), ready: p.lobbyReady ? i18n('Ready') : i18n('Not Ready') };
    });

  const isLobbyOpen = document.body.classList.contains('peer-hub-connected');
  document.querySelectorAll('.openLobbyBtn').forEach(el => {
    el.innerHTML = isLobbyOpen ? 'Disallow Join Requests' : 'Allow Join Requests';
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
      return `<div class="ui-border"><div class="player"><span class="player-name"><span style="color:${p.color}">⬤&nbsp;</span>${p.name}</span><span>${p.status}</span>
      ${p.clientId !== globalThis.clientId ? `<button class="kick-btn" data-fn="kick" data-name="${p.name}" data-clientid="${p.clientId}">Kick</button>` : ''}
      </div></div>`
    }).join('');
  }
}
export function enterPortal(player: IPlayer, underworld: Underworld) {
  console.log(`Player ${player.clientId}/${player.name} entered portal.`);
  resetPlayerForSpawn(player, underworld);
  underworld.progressGameState();
}

export function resetPlayerForSpawn(player: IPlayer, underworld: Underworld) {

  Image.hide(player.unit.image);
  // Make sure to resolve the moving promise once they enter the portal or else 
  // the client queue will get stuck
  player.unit.resolveDoneMoving(true);
  // Move "portaled" unit out of the way to prevent collisions and chaining while portaled
  Unit.setLocation(player.unit, { x: NaN, y: NaN }, underworld, false);
  player.isSpawned = false;
  if (player == globalThis.player) {
    globalThis.awaitingSpawn = false;
    // Allow respawning if the level is not complete
    if (!underworld.isLevelComplete()) {
      // Make unit visible only if they are current users player
      // so that they can see where to spawn them
      Image.show(player.unit.image);
    }
  }
  cameraAutoFollow(false);
  // Clear the selection so that it doesn't persist after portalling (which would show
  // your user's move circle in the upper left hand of the map but without the user there)
  clearTooltipSelection();

  // Clear the player units path when resetting
  // This prevents a bug where on a multiplayer game restart after a loss
  // the player unit's stamina would drain while they were picking a spawn point
  // because they still had a path set
  player.unit.path = undefined;
}

export function ableToAct(player: IPlayer) {
  // So long as a player is clientConnected, they can act if:
  // - They haven't spawned yet
  // - or if they are alive and not in the portal
  const ableToTakeTurn = player.clientConnected && (!player.isSpawned || (!inPortal(player) && player.unit.alive));
  if (!ableToTakeTurn) {
    console.log(`Player ${player.clientId}:${player.name} unable to take turn.`, '!inPortal:', !inPortal(player), 'alive:', player.unit.alive, 'connected: ', player.clientConnected)
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
  // Discover spell
  if (player == globalThis.player) {
    if (globalThis.spellsDiscovered && !globalThis.spellsDiscovered.includes(card.id)) {
      console.log('Discovered spell', card.id);
      globalThis.spellsDiscovered.push(card.id);
      storage.set(storage.SPELLS_DISCOVERED_STORAGE_KEY, JSON.stringify(globalThis.spellsDiscovered));
    }
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
      if (card.id !== lastWill.lastWillId) {
        explain(EXPLAIN_BLESSINGS);
      }
    }
    let didReplace = false;
    // If card replaces old cards
    if (card.replaces) {
      // Replace all replaced cards with new card
      for (let removeCardId of card.replaces) {
        player.cardsInToolbar = player.cardsInToolbar.map(cid => {
          if (!cid) {
            return cid;
          }
          if (cid == removeCardId) {
            didReplace = true;
            return card.id
          } else {
            return cid;
          }
        })
      }
    }
    player.inventory.push(card.id);
    if (!didReplace) {
      const emptySlotIndex = player.cardsInToolbar.indexOf('');
      // Add the spell to the toolbar
      if (emptySlotIndex !== -1 && emptySlotIndex < 9) {
        player.cardsInToolbar[emptySlotIndex] = card.id;
      }
    }
    CardUI.recalcPositionForCards(player, underworld);
  }
}
export async function setSpellmasonsToChannellingAnimationClose(player: IPlayer) {
  if (['playerBookIn', 'playerBookIdle'].includes(player.unit.image?.sprite.imagePath || '')) {
    await new Promise<void>((resolve) => {
      if (player.unit.image) {
        Image.changeSprite(
          player.unit.image,
          'playerBookReturn',
          player.unit.image.sprite.parent,
          resolve,
          {
            loop: false,
            // Play the book close animation a little faster than usual so
            // the player can get on with casting
            animationSpeed: 0.2
          }
        );
        Image.addOneOffAnimation(player.unit, 'playerBookReturnMagic', { doRemoveWhenPrimaryAnimationChanges: true }, {
          loop: false,
          // Play the book close animation a little faster than usual so
          // the player can get on with casting
          animationSpeed: 0.2
        });
      } else {
        resolve();
      }
    });

    Unit.returnToDefaultSprite(player.unit);
  }

}
export function setSpellmasonsToChannellingAnimation(player: IPlayer) {
  if (!player.unit.alive) return;

  const bookInAnimationPath = 'playerBookIn';
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
      Image.addOneOffAnimation(player.unit, 'playerBookInMagic', { doRemoveWhenPrimaryAnimationChanges: true }, {
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
        'playerBookIdle',
        player.unit.image.sprite.parent,
        undefined,
        {
          loop: true
        }
      );
      Image.addOneOffAnimation(player.unit, 'playerBookIdleMagic', { doRemoveWhenPrimaryAnimationChanges: true }, { loop: true });
    }
  });
}
// This function fully deletes the cards from the player's hand
export function removeCardsFromHand(player: IPlayer, cards: string[], underworld: Underworld) {
  player.cardsInToolbar = player.cardsInToolbar.filter(c => !cards.includes(c));
  // Remove any selected cards with a name in the cards array of this function
  for (let card of cards) {
    document.querySelectorAll(`#selected-cards .card[data-card-id="${card}"]`).forEach(el => {
      // clicking a selected card, deselects it
      (el as HTMLElement).click();
    });
  }
  CardUI.recalcPositionForCards(player, underworld);
}
export function getFactionsOf(players: { clientConnected: boolean, unit: { faction: Faction } }[]): Faction[] {
  // Returns all factions that currently contain at least one player
  const factions = players.filter(p => p.clientConnected).map(p => p.unit.faction);
  // This removes all duplicate entries from the list
  return [...new Set(factions)];
}
export function incrementPresentedRunesForPlayer(player: Pick<IPlayer, 'lockedRunes' | 'runePresentedIndex'>, underworld: Underworld) {
  // Increment runePresentedIndex for each player so they get new runes presented on the next level:
  const shuffledRunes = underworld.getShuffledRunesForPlayer(globalThis.player);
  player.runePresentedIndex = incrementPresentedRunesIndex(player.runePresentedIndex, config.RUNES_PER_LEVEL, shuffledRunes, player.lockedRunes);
  // Remove old unlocked level indexes
  // Note: This must occur AFTER incrementPresentedRunesIndex so that 
  // it doesn't skip over runes that were omitted due to previously locked runes
  player.lockedRunes = player.lockedRunes.filter(lr => lr.runePresentedIndexWhenLocked === undefined);

}