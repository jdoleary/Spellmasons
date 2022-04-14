import type * as PIXI from 'pixi.js';
import AnimationTimeline from './AnimationTimeline';
import type * as Player from './Player';
import type Underworld from './Underworld';
import { setView, View } from './views';
import * as readyState from './readyState';
import { setupPixi } from './PixiUtils';
import * as Cards from './cards';
import * as Units from './units';
import { initPlanningView } from './ui/PlanningView';
import type PieClient from '@websocketpie/client';
import { setupAudio } from './Audio';
import cookieConsentPopup from './cookieConsent';
import { setupMonitoring } from './monitoring';
import { startTutorial } from './wsPieHandler';
cookieConsentPopup(false);

// This import is critical so that the svelte menu has access to
// the pie globals
import './wsPieSetup';
import type { Vec2 } from './Vec';

const YES = 'yes'
const SKIP_TUTORIAL = 'skipTutorial';
setupAll();

function setupAll() {
  // Start monitoring with development overlay
  setupMonitoring();

  setupAudio();

  // Start up menu script now that the window globals are assigned
  var script = document.createElement('script');
  script.src = 'svelte-bundle.js';
  script.async = false;
  document.body.appendChild(script);

  // Initialize Assets
  console.log("Setup: Loading Pixi assets...")
  window.setupPixiPromise = setupPixi().then(() => {
    readyState.set('pixiAssets', true);
    console.log("Setup: Done loading Pixi assets.")
    // Initialize content
    Cards.registerCards();
    Units.registerUnits();
    initPlanningView();
    readyState.set("content", true);
    if (window.allowCookies && localStorage.getItem(SKIP_TUTORIAL) === YES) {
      window.setMenu('PLAY');
      setView(View.Menu);
    } else {
      window.setMenu('TUTORIAL');
      startTutorial();
    }
  }).catch(e => {
    console.error('Setup: Failed to setup pixi', e);
  });

  const elMenu = document.getElementById('menu');
  if (elMenu) {
    // Reveal the menu now that the global variables needed by svelte are set.
    elMenu.classList.add('ready');

  } else {
    // This should never happen
    console.error('Cannot find "menu" element in DOM');
  }

  window.animationTimeline = new AnimationTimeline();

  // Set UI version info
  const elVersionInfo = document.getElementById('version-info')
  if (elVersionInfo && import.meta.env.SNOWPACK_PUBLIC_PACKAGE_VERSION) {
    elVersionInfo.innerText = `Alpha v${import.meta.env.SNOWPACK_PUBLIC_PACKAGE_VERSION}`;
  }
}

declare global {
  interface Window {
    latencyPanel: Stats.Panel;
    animationTimeline: AnimationTimeline;
    underworld: Underworld;
    // A reference to the player instance of the client playing on this instance
    player: Player.IPlayer | undefined;
    // Globals needed for Golems-menu
    pie: PieClient;
    connect_to_wsPie_server: (wsUri?: string) => Promise<void>;
    joinRoom: (_room_info: any) => Promise<unknown>;
    setupPixiPromise: Promise<void>;
    // Svelte menu handles
    exitCurrentGame: () => void;
    closeMenu: () => void;
    // Sets which route of the menu is available; note, the view must also
    // be set to Menu in order to SEE the menu
    setMenu: (route: string) => void;
    // Used to tell the menu if a game is ongoing or not
    updateInGameMenuStatus: () => void;
    // The menu will call this if the user chooses to skip the tutorial
    skipTutorial: () => void;

    save: (title: string) => void;
    load: (title: string) => void;
    getAllSaveFiles: () => string[];
    // Save pie messages for later replay
    saveReplay: (title: string) => void;
    // Used to replay onData messages for development
    replay: (title: string) => void;
    // The client id of the host of the game, may or may not be
    // identical to clientId
    hostClientId: string;
    // Current client's id
    clientId: string;
    // allows for left clicking to ping to other players
    altDown: boolean;
    animatingSpells: boolean;
    view: View;
    // For development use
    giveMeCard: (cardId: string, quantity: number) => void;
    // Set to true in developer console to see debug information
    showDebug: boolean;
    // Graphics for drawing debug information, use window.showDebug = true
    // to show at runtime
    debugGraphics: PIXI.Graphics;
    // Graphics for drawing the player visible path
    walkPathGraphics: PIXI.Graphics;
    // Graphics for drawing unit health and mana bars
    unitOverlayGraphics: PIXI.Graphics;
    // Graphics for drawing the spell effects during the dry run phase
    dryRunGraphics: PIXI.Graphics;
    allowCookies: boolean;
    playMusic: () => void;
    changeVolume: (volume: number) => void;
    changeVolumeMusic: (volume: number) => void;
    changeVolumeGame: (volume: number) => void;
    volume: number;
    volumeMusic: number;
    volumeGame: number;
    startSingleplayer: () => Promise<void>;
    startMultiplayer: (wsPieUrl: string) => Promise<void>;
    // Used to ensure that the current client's turn doesn't end while they are still walking
    // If they invoke endMyTurn() while they are walking, it will wait until they are done
    // walking to end their turn.  If they are not walking, it will end immediately.
    // This property will always be a promise, since it is set immediately below as a resolved
    // promise.  This is so that the promise is always resolved UNLESS the player is currently
    // walking.
    playerWalkingPromise: Promise<void>;
    // makes a pop up prompting the user to accept cookies
    cookieConsentPopup: (forcePopup: boolean) => void;
    // A zoom value that the camera zoom will lerp to
    zoomTarget: number;
  }
}
window.zoomTarget = 1;
window.volume = 1.0;
window.volumeMusic = 1.0;
window.volumeGame = 1.0;
window.playerWalkingPromise = Promise.resolve();
window.skipTutorial = () => {
  if (window.allowCookies) {
    console.log(`Setting ${SKIP_TUTORIAL} in localStorage...`);
    localStorage.setItem(SKIP_TUTORIAL, YES);
  } else {
    console.log('Cannot save choice to skip tutorial since cookies are not consented to');
  }
}