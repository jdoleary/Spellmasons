import { PLAYER_BASE_HEALTH } from './config';
import * as Unit from './Unit';
import type * as Upgrade from './Upgrade';
import * as Card from './Card';
import * as config from './config';

export interface IPlayer {
  // wsPie id
  clientId: string;
  unit: Unit.IUnit;
  inPortal: boolean;
  // Action flags determine what the player is allowed to do in a turn
  thisTurnSpellCast: boolean;
  // The players "hand" which contains cards
  hand: Card.CardTally;
  upgrades: Upgrade.IUpgrade[];
}
export function create(clientId: string): IPlayer {
  // limit spawn to the leftmost column
  const coords = window.game.getRandomEmptyCell({ xMax: 0 });
  const player = {
    clientId,
    unit: Unit.create(
      coords.x,
      coords.y,
      'images/units/man-blue.png',
      Unit.UnitType.PLAYER_CONTROLLED,
    ),
    thisTurnSpellCast: false,
    inPortal: false,
    actionsUsed: 0,
    hand: {},
    upgrades: [],
  };
  updateGlobalRefToCurrentClientPlayer(player);
  // Add cards to hand
  for (let i = 0; i < config.GIVE_NUM_CARDS_PER_LEVEL; i++) {
    const card = Card.generateCard();
    Card.addCardToHand(card, player);
  }
  addHighlighIfPlayerBelongsToCurrentClient(player);
  player.unit.health = PLAYER_BASE_HEALTH;
  player.unit.healthMax = PLAYER_BASE_HEALTH;
  return player;
}
export function resetPlayerForNextLevel(player: IPlayer) {
  // Player is no longer in portal
  player.inPortal = false;

  // Reset action limitations
  player.thisTurnSpellCast = false;
  player.unit.thisTurnMoved = false;

  // Make unit visible
  player.unit.image.show();
  Unit.resurrect(player.unit);

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
    player.unit.image.addSubSprite(
      'images/units/unit-underline.png',
      'ownCharacterMarker',
    );
  }
}
export function load(player: IPlayer) {
  const playerLoaded = {
    ...player,
    unit: Unit.load(player.unit),
  };
  addHighlighIfPlayerBelongsToCurrentClient(playerLoaded);
  updateGlobalRefToCurrentClientPlayer(playerLoaded);
  Card.recalcPositionForCards(playerLoaded);
  return playerLoaded;
}
export function enterPortal(player: IPlayer) {
  player.inPortal = true;
  player.unit.image.hide();
  // limit spawn to the leftmost column
  const coords = window.game.getRandomEmptyCell({ xMax: 0 });
  // Move "portaled" unit out of the way to prevent collisions and chaining while portaled
  coords.x = -1;
  Unit.setLocation(player.unit, coords);
  window.game.checkForEndOfLevel();
  // If player that entered the portal is the current client's player, end their turn
  if (player.clientId === window.clientId) {
    window.game.endMyTurn();
  }
}
// Note: this is also used for AI targeting to ensure that AI don't target disabled plaeyrs
export function ableToTakeTurn(player: IPlayer) {
  return !player.inPortal && player.unit.alive;
}
