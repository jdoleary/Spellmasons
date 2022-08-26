import {
  addPixiContainersForView,
  resizePixi,
  app,
} from './graphics/PixiUtils';
import {
  clickHandler,
  contextmenuHandler,
  endTurnBtnListener,
  keydownListener,
  keyupListener,
  mouseDownHandler,
  mouseUpHandler,
  mouseMove,
  onWindowBlur,
} from './graphics/ui/eventListeners';
import Underworld from './Underworld';

// A view is not shared between players in the same game, a player could choose any view at any time
export enum View {
  Menu,
  Setup,
  Game,
  Disconnected
}
const elUpgradePicker = document.getElementById('upgrade-picker') as HTMLElement;
let lastNonMenuView: View | undefined;
function closeMenu() {
  // Change to the last non menu view
  if (lastNonMenuView) {
    setView(lastNonMenuView);
    // When the menu closes, set the menu back
    // to the main menu route
    if (globalThis.setMenu) {
      globalThis.setMenu('PLAY');
    }
  } else {
    console.log('Cannot close menu yet, no previous view to change to.');
  }

}
export function toggleMenu() {
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
  if (globalThis.headless) { return; }
  console.log('setView(', View[v], ')');
  if (globalThis.view == v) {
    // Prevent setting a view more than once if the view hasn't changed
    // Since some of these views, (such as upgrade) have
    // initialization logic
    console.log('Short circuit: View has already been set to ', View[v], 'so setView has exited without doing anything.');
    return;
  }
  for (let view of Object.keys(View)) {
    document.body?.classList.remove(`view-${view}`);
  }
  document.body?.classList.add(`view-${View[v]}`);
  globalThis.view = v;
  addPixiContainersForView(v);
  const elMenu = document.getElementById('menu') as HTMLElement;
  if (v !== View.Menu) {
    elMenu.classList.add('hidden');
    lastNonMenuView = v;
  }
  // Hide the upgrade picker when the view changes
  elUpgradePicker.classList.remove('active');
  switch (v) {
    case View.Menu:
      elMenu.classList.remove('hidden');
      if (globalThis.updateInGameMenuStatus) {
        globalThis.updateInGameMenuStatus();
      }
      break;
    case View.Game:
      resizePixi();
      break;
    case View.Disconnected:
      // Intentionally left blank - this view is handled in css
      break;
    default:
      console.error(`Cannot set view to "${View[v]}" view is not handled in switch statement.`);
      break;
  }
}

// zoom camera
function zoom(underworld: Underworld, e: WheelEvent) {
  if (globalThis.view !== View.Game) {
    return;
  }
  if (!app) {
    return;
  }
  // TODO: This value could be customizable in the menu later:
  const scrollSensitivity = 200;
  const scrollFactor = Math.abs(e.deltaY / scrollSensitivity);
  const zoomIn = e.deltaY < 0;
  const zoomDelta = (zoomIn ? 1 + 1 * scrollFactor : 1 - 0.5 * scrollFactor);
  let newScale = app.stage.scale.x * zoomDelta;
  // Limit zoom out and in to sensible limits
  newScale = Math.min(Math.max(0.3, newScale), 4);

  globalThis.zoomTarget = newScale;
}


const endTurnBtnId = 'end-turn-btn';
const menuBtnId = 'menuBtn';
export function addUnderworldEventListeners(underworld: Underworld) {
  if (globalThis.headless) { return; }
  const elEndTurnBtn: HTMLButtonElement = document.getElementById(
    endTurnBtnId,
  ) as HTMLButtonElement;
  const elMenuBtn: HTMLButtonElement = document.getElementById(
    menuBtnId,
  ) as HTMLButtonElement;

  const listeners: {
    target: HTMLElement | typeof globalThis;
    event: string;
    listener: any;
  }[] = [
      {
        target: globalThis,
        event: 'keydown',
        listener: keydownListener.bind(undefined, underworld)
      },
      {
        target: globalThis,
        event: 'keyup',
        listener: keyupListener.bind(undefined, underworld)
      },
      {
        target: document.body,
        event: 'contextmenu',
        listener: contextmenuHandler.bind(undefined, underworld)
      },
      {
        target: document.body,
        event: 'click',
        listener: clickHandler.bind(undefined, underworld)
      },
      {
        target: globalThis,
        event: 'mousedown',
        listener: mouseDownHandler.bind(undefined, underworld)
      },
      {
        target: globalThis,
        event: 'mouseup',
        listener: mouseUpHandler.bind(undefined, underworld)
      },
      {
        target: globalThis,
        event: 'blur',
        listener: onWindowBlur.bind(undefined, underworld)
      },
      {
        target: document.body,
        event: 'wheel',
        listener: zoom.bind(undefined, underworld)
      },
      {
        target: document.body,
        event: 'mousemove',
        listener: mouseMove.bind(undefined, underworld)
      },
      {
        target: elEndTurnBtn,
        event: 'click',
        listener: endTurnBtnListener.bind(undefined, underworld)
      },
      {
        target: elMenuBtn,
        event: 'click',
        listener: toggleMenu.bind(undefined, underworld)
      },
    ];
  // Make 'closeMenu' available to the svelte menu
  globalThis.closeMenu = () => closeMenu();
  for (let { target, event, listener } of listeners) {
    target.addEventListener(event, listener);
  }

  return function removeUnderworldEventListeners() {
    if (globalThis.headless) { return; }
    for (let { target, event, listener } of listeners) {
      target.removeEventListener(event, listener);
    }

  }
}
