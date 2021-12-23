import {
  setupPixi,
  containerCharacterSelect,
  addPixiContainersForView,
  recenterStage,
} from './PixiUtils';
import * as Cards from './cards';
import * as Units from './units';
import { initializeUnderworld } from './wsPieHandler';
import { connect_to_wsPie_server, hostRoom, joinRoom } from './wsPieSetup';
import { setupMonitoring } from './monitoring';
import { UnitSubType } from './commonTypes';
import { MESSAGE_TYPES } from './MessageTypes';
import * as Image from './Image';
import { initPlanningView } from './ui/PlanningView';

// A view is not shared between players in the same game, a player could choose any view at any time
export enum View {
  Menu,
  CharacterSelect,
  // Game view shows all the routes, the overworld, upgrade screen, underworld, etc
  Game,
}
export function setView(v: View) {
  console.log('Set game view', View[v]);
  window.view = v;
  addPixiContainersForView(v);
  recenterStage();
  switch (v) {
    case View.Menu:
      // Start monitoring with development overlay
      setupMonitoring();

      // Initialize Assets
      console.log("Loading Pixi assets...")
      let setupPixiPromise = setupPixi().then(() => {
        console.log("Done loading Pixi assets.")
      });
      // Initialize Network
      console.log("Connecting to server...")
      let connectToPieServerPromise = connect_to_wsPie_server().then(() => {
        console.log("Done connecting to server.")
      });
      Promise.all([setupPixiPromise, connectToPieServerPromise]).then(() => {
        // Now that we are both connected to the pieServer and assets are loaded,
        // we can host or join a game
        // --
        // Initialize content
        Cards.registerCards();
        Units.registerUnits();
        initPlanningView();

        // Initialize Game Object
        // See makeGame function for where setup truly happens
        // This instantiation just spins up the instance of game
        initializeUnderworld();
        // ---
        // TEMP temporarily default to just entering a generic game for speed of development
        hostRoom({})
          .catch(() => joinRoom({}))
          .then(() => console.log('You are now in the room'))
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
            index,
            0,
            unitSource.info.image,
            containerCharacterSelect,
          );
          image.sprite.interactive = true;
          image.sprite.on('click', () => {
            // Timeout prevents click from propagating into overworld listener
            // for some reason e.stopPropagation doesn't work :/
            setTimeout(() => {
              // Cleanup container
              containerCharacterSelect.removeChildren();
              window.pie.sendData({
                type: MESSAGE_TYPES.SELECT_CHARACTER,
                unitId: unitSource.id,
              });
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
