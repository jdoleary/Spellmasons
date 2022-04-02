import {
  containerCharacterSelect,
  addPixiContainersForView,
  recenterStage,
} from './PixiUtils';
import * as Units from './units';
import { UnitSubType } from './commonTypes';
import { MESSAGE_TYPES } from './MessageTypes';
import * as Image from './Image';

// A view is not shared between players in the same game, a player could choose any view at any time
export enum View {
  Menu,
  Setup,
  CharacterSelect,
  // Game view shows all the routes, the overworld, upgrade screen, underworld, etc
  Game,
}
let lastNonMenuView: View | undefined;
function closeMenu() {
  // Change to the last non menu view
  if (lastNonMenuView) {
    setView(lastNonMenuView);
  } else {
    console.log('Cannot close menu yet, no previous view to change to.');
  }

}
// Make 'closeMenu' available to the svelte menu
window.closeMenu = closeMenu;
export function toggleMenu() {
  console.log('toggle menu');
  const elMenu = document.getElementById('menu') as HTMLElement;
  const menuClosed = elMenu.classList.contains('hidden');
  if (menuClosed) {
    // Open it
    setView(View.Menu);
  } else {
    closeMenu();
  }

}
// The "View" is what the client is looking at
// No gamelogic should be executed inside setView
// including setup.
export function setView(v: View) {
  console.log('setView(', View[v], ')');
  window.view = v;
  addPixiContainersForView(v);
  recenterStage();
  const elMenu = document.getElementById('menu') as HTMLElement;
  if (v !== View.Menu) {
    elMenu.classList.add('hidden');
    lastNonMenuView = v;
  }
  switch (v) {
    case View.Menu:
      elMenu.classList.remove('hidden');
      break;
    case View.CharacterSelect:
      // Host or join a game brings client to Character select
      Object.values(Units.allUnits)
        .filter(
          (unitSource) =>
            unitSource.info.subtype === UnitSubType.PLAYER_CONTROLLED,
        )
        .forEach((unitSource, index) => {
          const image = Image.create(
            0,
            0,
            unitSource.info.image,
            containerCharacterSelect,
          );
          Image.setPosition(image, index * image.sprite.width, 0)
          image.sprite.interactive = true;
          image.sprite.on('click', () => {
            // Timeout prevents click from propagating into overworld listener
            // for some reason e.stopPropagation doesn't work :/
            setTimeout(() => {
              clientChooseUnit(unitSource.id);
            }, 0);
          });
        });
      break;
    case View.Game:
      break;
    default:
      console.error('Cannot set view to', v, 'no such view exists');
      break;
  }
}

function clientChooseUnit(unitId: string) {
  // Cleanup container
  containerCharacterSelect.removeChildren();

  // Queue asking for the gamestate
  // from the other players.
  // The reason sending game state is queued and not sent immediately
  // is that if there's a game in progress you don't want to send the
  // state in the middle of an action (which could cause desyncs for
  // code that depends on promises such as resolveDoneMoving)
  console.log("Setup: JOIN_GAME: Ask for latest gamestate from other players")
  window.pie.sendData({
    type: MESSAGE_TYPES.JOIN_GAME,
    unitId
  });
  // Now that user has selected a character, they can enter the game
  setView(View.Game);

}