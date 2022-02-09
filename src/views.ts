import {
  setupPixi,
  containerCharacterSelect,
  addPixiContainersForView,
  recenterStage,
} from './PixiUtils';
import * as Cards from './cards';
import * as Units from './units';
import { connect_to_wsPie_server, joinRoom } from './wsPieSetup';
import { setupMonitoring } from './monitoring';
import { UnitSubType } from './commonTypes';
import { MESSAGE_TYPES } from './MessageTypes';
import * as Image from './Image';
import { initPlanningView } from './ui/PlanningView';
import * as readyState from './readyState';

// A view is not shared between players in the same game, a player could choose any view at any time
export enum View {
  Menu,
  Setup,
  CharacterSelect,
  // Game view shows all the routes, the overworld, upgrade screen, underworld, etc
  Game,
}
export function setView(v: View) {
  console.log('setView(', View[v], ')');
  window.view = v;
  addPixiContainersForView(v);
  recenterStage();
  switch (v) {
    case View.Menu:
      // TODO: implement menu
      break;
    case View.Setup:
      // Start monitoring with development overlay
      setupMonitoring();

      // Initialize Assets
      console.log("Setup: Loading Pixi assets...")
      let setupPixiPromise = setupPixi().then(() => {
        readyState.set('pixiAssets', true);
        console.log("Setup: Done loading Pixi assets.")
      }).catch(e => {
        console.error('Setup: Failed to setup pixi', e);
      });
      // Initialize Network
      console.log("Pie: Connecting to server...")
      let connectToPieServerPromise = connect_to_wsPie_server().then(() => {
        readyState.set('wsPieConnection', true);
        console.log("Pie: Successfully connected to PieServer.")
      }).catch(() => {
        console.error('Unable to connect to server.  Please check the wsURI.');
        alert('Unable to connect to server.  Please check the wsURI.');
      });
      Promise.all([setupPixiPromise, connectToPieServerPromise]).then(() => {
        console.log("Setup: Loading complete.. initialize game")
        // Now that we are both connected to the pieServer and assets are loaded,
        // we can host or join a game
        // --
        // Initialize content
        Cards.registerCards();
        Units.registerUnits();
        initPlanningView();
        readyState.set("content", true);

        // TODO: TEMP temporarily default to just entering a generic game for speed of development
        joinRoom({})
          .then(() => {
            readyState.set('wsPieRoomJoined', true);
            console.log('Pie: You are now in the room');
            // Useful for development to get into the game quickly
            let quickloadName = localStorage.getItem('quickload')
            if (quickloadName) {
              console.log('ADMIN: quickload:', quickloadName);
              window.load(quickloadName);
            }
          })
          .catch((err: string) => console.error('Failed to join room', err));
      });
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
                unitId: unitSource.id
              })
              // Now that user has selected a character, they can enter the game
              setView(View.Game);
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
