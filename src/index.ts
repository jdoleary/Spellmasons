import type * as PIXI from 'pixi.js';
import type { Route } from './routes';
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
cookieConsentPopup();

// This import is critical so that the svelte menu has access to
// the pie globals
import './wsPieSetup';
import type { Vec2 } from './Vec';

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
  setView(View.Menu);

  // Set UI version info
  const elVersionInfo = document.getElementById('version-info')
  if (elVersionInfo && import.meta.env.SNOWPACK_PUBLIC_PACKAGE_VERSION) {
    elVersionInfo.innerText = `v${import.meta.env.SNOWPACK_PUBLIC_PACKAGE_VERSION}`;
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
    exitCurrentGame: () => void;

    save: (title: string) => void;
    load: (title: string) => void;
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
    setRoute: (r: Route) => void;
    route: Route;
    view: View;
    // For development use
    giveMeCard: (cardId: string, quantity: number) => void;
    // Set to true in developer console to see debug information
    showDebug: boolean;
    // Graphics for drawing debug information, use window.showDebug = true
    // to show at runtime
    debugGraphics: PIXI.Graphics;
    // Graphics for drawing unit health and mana bars
    unitOverlayGraphics: PIXI.Graphics;
    allowCookies: boolean;
    playMusic: () => void;
    changeVolume: (volume: number) => void;
    volume: number;
    closeMenu: () => void;
    // Used to show the current player where they will move to if they click
    currentPlayerPath: Vec2[];

  }
}

window.volume = 1.0;
window.currentPlayerPath = [];