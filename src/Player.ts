import { PLAYER_BASE_HEALTH } from './config';
import * as Unit from './Unit';
import * as Image from './Image';
import type * as Upgrade from './Upgrade';
import * as CardUI from './CardUI';
import * as config from './config';
import * as math from './math';
import { Coords, Faction, UnitType } from './commonTypes';
import { allUnits } from './units';

export interface IPlayer {
  // wsPie id
  clientId: string;
  clientConnected: boolean;
  unit: Unit.IUnit;
  inPortal: boolean;
  cards: string[];
  upgrades: Upgrade.IUpgrade[];
  // Cast range
  range: number;
  turnsPerCard: number;
}
export function isTargetInRange(player: IPlayer, target: Coords): boolean {
  return math.distance(target, player.unit) <= player.range;
}
export function create(clientId: string): IPlayer {
  // limit spawn to the leftmost column
  const coords = window.game.getRandomEmptyCell({ xMax: 0 });
  const userSource = allUnits.user;
  if (!userSource) {
    throw new Error(
      'User unit source file not registered, cannot create player',
    );
  }
  const player: IPlayer = {
    clientId,
    clientConnected: true,
    unit: Unit.create(
      userSource.id,
      coords.x,
      coords.y,
      Faction.PLAYER,
      userSource.info.image,
      UnitType.PLAYER_CONTROLLED,
      userSource.info.subtype,
    ),
    inPortal: false,
    cards: [],
    upgrades: [],
    range: config.PLAYER_CAST_RANGE,
    turnsPerCard: config.PLAYER_BASE_TURNS_PER_CARD,
  };
  updateGlobalRefToCurrentClientPlayer(player);
  // Add cards to hand
  for (let i = 0; i < config.START_CARDS_COUNT; i++) {
    const card = CardUI.generateCard();
    CardUI.addCardToHand(card, player);
  }
  addHighlighIfPlayerBelongsToCurrentClient(player);
  player.unit.health = PLAYER_BASE_HEALTH;
  player.unit.healthMax = PLAYER_BASE_HEALTH;
  return player;
}
export function checkForGetCardOnTurn(player: IPlayer) {
  if (window.game.turn_number % player.turnsPerCard === 0) {
    const card = CardUI.generateCard();
    CardUI.addCardToHand(card, player);
    console.log('You got a card!');
  }
}
export function resetPlayerForNextLevel(player: IPlayer) {
  // Player is no longer in portal
  player.inPortal = false;

  // Reset action limitations
  player.unit.thisTurnMoved = false;

  // Make unit visible
  Image.show(player.unit.image);
  if (!player.unit.alive) {
    Unit.resurrect(player.unit);
  }

  // Return to a spawn location
  // limit spawn to the leftmost column
  const coords = window.game.getRandomEmptyCell({ xMax: 0 });
  Unit.setLocation(player.unit, coords);
}
// Keep a global reference to the current client's player
function updateGlobalRefToCurrentClientPlayer(player: IPlayer) {
  if (window.clientId === player.clientId) {
    window.player = player;
  }
}
function addHighlighIfPlayerBelongsToCurrentClient(player: IPlayer) {
  if (player.clientId === window.clientId) {
    Image.addSubSprite(player.unit.image, 'ownCharacterMarker');
  } else {
    Image.removeSubSprite(player.unit.image, 'ownCharacterMarker');
  }
}
export function load(player: IPlayer) {
  const playerLoaded = {
    ...player,
    unit: Unit.load(player.unit),
  };
  addHighlighIfPlayerBelongsToCurrentClient(playerLoaded);
  updateGlobalRefToCurrentClientPlayer(playerLoaded);
  CardUI.recalcPositionForCards(playerLoaded);
  return playerLoaded;
}
export function enterPortal(player: IPlayer) {
  player.inPortal = true;
  Image.hide(player.unit.image);
  // limit spawn to the leftmost column
  const coords = window.game.getRandomEmptyCell({ xMax: 0 });
  if (coords) {
    // Move "portaled" unit out of the way to prevent collisions and chaining while portaled
    coords.x = -1;
    Unit.setLocation(player.unit, coords);
  } else {
    console.error('Could not find random empty cell');
  }
}
// Note: this is also used for AI targeting to ensure that AI don't target disabled plaeyrs
export function ableToTakeTurn(player: IPlayer) {
  return !player.inPortal && player.unit.alive && player.clientConnected;
}
