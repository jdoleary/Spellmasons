import { elPIXIHolder } from './graphics/FloatingText';
import {
  addPixiContainersForView,
  resizePixi,
  app,
} from './graphics/PixiUtils';
import { runPredictions } from './graphics/PlanningView';
import {
  clickHandler,
  contextmenuHandler,
  endTurnBtnListener,
  keydownListener,
  keyupListener,
  mouseDownHandler,
  mouseUpHandler,
  useMousePosition,
  onWindowBlur,
  mouseOverHandler,
} from './graphics/ui/eventListeners';
import { sendChatHandler } from './graphics/ui/Chat';
import { Overworld } from './Overworld';
import { View } from './View';
import { getSelectedCardIds, renderBattleLog, renderRunesMenu, tryShowStatPointsSpendable } from './graphics/ui/CardUI';
import Underworld from './Underworld';
import { distance, similarTriangles } from './jmath/math';
import { jitter } from './jmath/Vec';
import { easeOutCubic } from './jmath/Easing';

const elUpgradePicker = document.getElementById('upgrade-picker') as HTMLElement;
let lastNonMenuView: View | undefined;
export function clearLastNonMenuView() {
  lastNonMenuView = undefined;
}
// returns false if error occurred
function closeMenu(): boolean {
  // Change to the last non menu view
  if (lastNonMenuView) {
    setView(lastNonMenuView);
    // When the menu closes, set the menu back
    // to the main menu route
    if (globalThis.setMenu) {
      globalThis.setMenu('PLAY');
    }
    return true;
  } else {
    console.log('Cannot close menu yet, no previous view to change to.');
    return false;
  }

}
export function toggleMenu() {
  const elMenu = document.getElementById('menu') as HTMLElement;
  if (elMenu) {
    const menuClosed = elMenu.classList.contains('hidden');
    if (menuClosed) {
      // Open it
      setView(View.Menu);
    } else {
      closeMenu();
    }
  } else {
    console.warn('elMenu is falsey, this should not be so')
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

    // Close all prompts
    document.querySelectorAll('.prompt .no').forEach(el => (el as HTMLElement).click());
  }
  // Hide the upgrade picker when the view changes
  elUpgradePicker.classList.remove('active');
  switch (v) {
    case View.Menu:
      // Any time the game sets the View to Menu, if it isn't already, it should always go to the PLAY route
      globalThis.setMenu?.('PLAY');
      animateMenu();
      elMenu.classList.remove('hidden');
      if (globalThis.updateInGameMenuStatus) {
        globalThis.updateInGameMenuStatus();
      }
      // Since svelte can't keep track of state outside of itself,
      // any time the view switches back to the Menu it should force rerender
      // so that it will have updated pie connection status for example
      if (globalThis.refreshMenu) {
        globalThis.refreshMenu();
      }
      break;
    case View.Game:
      // Clear menu last route so any "Esc" goes to pause menu
      // @ts-ignore
      globalThis.lastRoute = '';
      resizePixi();
      // Start non-theme soundtrack
      if (playMusicIfNotAlreadyPlaying) {
        playMusicIfNotAlreadyPlaying();
      }
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
function zoom(overworld: Overworld, e: WheelEvent) {
  if (globalThis.view !== View.Game) {
    return;
  }
  if (!app) {
    return;
  }
  if (e.target && (e.target as HTMLElement).closest('.scrollable')) {
    console.debug('Abort scrolling due to mouse on scrollable element', e.target);
    return;
  }
  if (e.target && (e.target as HTMLElement).closest('#inventory-container')) {
    console.debug('Abort scrolling due to mouse on inventory-container')
    return;
  }
  // TODO: This value could be customizable in the menu later:
  const scrollSensitivity = 200;
  const scrollFactor = Math.abs(e.deltaY / scrollSensitivity);
  const zoomIn = e.deltaY < 0;
  const zoomDelta = (zoomIn ? 1 + 1 * scrollFactor : 1 - 0.5 * scrollFactor);
  let newScale = app.stage.scale.x * zoomDelta;
  // Limit zoom out and in to sensible limits
  newScale = Math.min(Math.max(0.3, newScale), 16);

  globalThis.zoomTarget = newScale;
}

let runPredictionsIdleCallbackId: number;
let elInventoryContainer: HTMLButtonElement = document.getElementById(
  'inventory-container',
) as HTMLButtonElement;

export function addOverworldEventListeners(overworld: Overworld) {
  if (globalThis.headless) { return; }
  const elEndTurnButton: HTMLButtonElement = document.getElementById(
    'end-turn-btn',
  ) as HTMLButtonElement;
  elInventoryContainer = document.getElementById(
    'inventory-container',
  ) as HTMLButtonElement;
  const elBookmarkDamage: HTMLButtonElement = document.getElementById('bookmark-damage',) as HTMLButtonElement;
  const elBookmarkMovement: HTMLButtonElement = document.getElementById('bookmark-movement',) as HTMLButtonElement;
  const elBookmarkTarget: HTMLButtonElement = document.getElementById('bookmark-targeting',) as HTMLButtonElement;
  const elBookmarkMana: HTMLButtonElement = document.getElementById('bookmark-mana',) as HTMLButtonElement;
  const elBookmarkCurse: HTMLButtonElement = document.getElementById('bookmark-curses',) as HTMLButtonElement;
  const elBookmarkDefense: HTMLButtonElement = document.getElementById('bookmark-blessings',) as HTMLButtonElement;
  const elBookmarkSoul: HTMLButtonElement = document.getElementById('bookmark-soul',) as HTMLButtonElement;
  const elBookmarkAll: HTMLButtonElement = document.getElementById('bookmark-all',) as HTMLButtonElement;
  const elBookmarkRunes: HTMLButtonElement = document.getElementById('bookmark-runes',) as HTMLButtonElement;
  const elBookmarkBattleLog: HTMLButtonElement = document.getElementById('bookmark-battle-log',) as HTMLButtonElement;
  const elQuitButton: HTMLButtonElement = document.getElementById(
    'quit',
  ) as HTMLButtonElement;
  const elRestartButton: HTMLButtonElement = document.getElementById(
    'play-again',
  ) as HTMLButtonElement;
  const elDisconnectButton: HTMLButtonElement = document.getElementById(
    'disconnect-btn',
  ) as HTMLButtonElement;
  const elChatinput: HTMLInputElement = document.getElementById(
    'chatinput',
  ) as HTMLInputElement;

  const listeners: {
    target: HTMLElement | typeof globalThis;
    event: string;
    listener: any;
  }[] = [
      {
        target: globalThis,
        event: 'keydown',
        listener: keydownListener.bind(undefined, overworld)
      },
      {
        target: globalThis,
        event: 'keyup',
        listener: keyupListener.bind(undefined, overworld)
      },
      {
        target: document.body,
        event: 'contextmenu',
        listener: contextmenuHandler.bind(undefined, overworld)
      },
      {
        target: elPIXIHolder,
        event: 'click',
        listener: clickHandler.bind(undefined, overworld)
      },
      {
        target: document.body,
        event: 'mousedown',
        listener: mouseDownHandler.bind(undefined, overworld)
      },
      {
        target: globalThis,
        event: 'mouseup',
        listener: mouseUpHandler.bind(undefined, overworld)
      },
      {
        target: document.body,
        event: 'mouseover',
        listener: mouseOverHandler.bind(undefined, overworld)
      },
      {
        target: globalThis,
        event: 'blur',
        listener: onWindowBlur.bind(undefined, overworld)
      },
      {
        target: document.body,
        event: 'wheel',
        listener: zoom.bind(undefined, overworld)
      },
      {
        target: document.body,
        event: 'mousemove',
        // mousemove receives the underworld instead of the overworld so that it can be
        // invoked from within the underworld without the underworld having to have a circular
        // reference to the overworld.  It needs to be invoked from within the underworld so
        // that it can update visuals that usually only update when the mousemoves.
        listener: (e: MouseEvent) => {
          if (overworld.underworld) {
            useMousePosition(overworld.underworld, e);

            // Only run predictions if the game canvas is being hovered,
            // this will improve performance for heavy computation spells
            // when browsing the spellbook or hovering over your toolbar
            const cardIds = getSelectedCardIds();
            // cardIds: Only run predictions if there is a spell while mouse moving
            const activeSpell = cardIds.length;
            const playerSpawning = globalThis.player && !globalThis.player.isSpawned
            if (e.target && (e.target as HTMLElement).tagName === 'CANVAS' && (activeSpell || playerSpawning) && !globalThis.MMBDown) {
              runPredictions(overworld.underworld);
              if (globalThis._queueLastPredictionMousePos) {
                globalThis.lastPredictionMousePos = globalThis._queueLastPredictionMousePos;
              } else {
                console.warn('Could not assign _queueLastPredictionMousePos');
              }
            }
          }
        }
      },
      {
        target: elEndTurnButton,
        event: 'click',
        listener: endTurnBtnListener.bind(undefined, overworld)
      },
      ...[
        { target: elBookmarkDamage, targetId: 'bookmark-damage' },
        { target: elBookmarkMovement, targetId: 'bookmark-movement' },
        { target: elBookmarkTarget, targetId: 'bookmark-targeting' },
        { target: elBookmarkMana, targetId: 'bookmark-mana' },
        { target: elBookmarkCurse, targetId: 'bookmark-curses' },
        { target: elBookmarkDefense, targetId: 'bookmark-blessings' },
        { target: elBookmarkSoul, targetId: 'bookmark-soul' },
        { target: elBookmarkAll, targetId: 'bookmark-all' },
        { target: elBookmarkRunes, targetId: 'bookmark-runes' },
        { target: elBookmarkBattleLog, targetId: 'bookmark-battle-log' },
      ].map(({ target, targetId }) => {
        return {
          target,
          event: 'click',
          listener: () => {
            // Disallow clicking on disabled bookmarks
            if (target.classList.contains('disabled')) {
              playSFXKey('deny');
            } else {
              chooseBookmark(targetId, undefined, overworld.underworld);
              if (!target.classList.contains('active')) {
                elInventoryContainer.classList.toggle('bookmark-all');
                document.getElementById('bookmark-all')?.classList.toggle('active', true);
                playSFXKey('inventory_close');
              } else {
                playSFXKey('inventory_open');
              }
            }
          }
        };

      }),
      {
        target: elRestartButton,
        event: 'click',
        listener: () => {
          if (overworld.underworld) {
            overworld.underworld.restart();
          }
        }
      },
      {
        target: elQuitButton,
        event: 'click',
        listener: () => {
          if (globalThis.exitCurrentGame) {
            globalThis.exitCurrentGame();
          } else {
            console.error('Unexpected: globalThis.exitCurrentGame is undefined.');
          }
        }
      },
      {
        target: elDisconnectButton,
        event: 'click',
        listener: () => {
          if (globalThis.exitCurrentGame) {
            // This will also disconnect from wsPie causing it to stop trying to reconnect.
            globalThis.exitCurrentGame();
          } else {
            console.error('Unexpected: globalThis.exitCurrentGame is undefined.');
          }
        }
      },
      {
        target: elChatinput,
        event: 'keypress',
        listener: sendChatHandler.bind(undefined, overworld),
      },
    ];
  // Make 'closeMenu' available to the svelte menu
  globalThis.closeMenu = () => closeMenu();
  for (let { target, event, listener } of listeners) {
    target.addEventListener(event, listener);
  }

  return function removeOverworldEventListeners() {
    if (globalThis.headless) { return; }
    for (let { target, event, listener } of listeners) {
      target.removeEventListener(event, listener);
    }

  }
}

// if forceActive is undefined, the bookmark will be toggled,
// if it is true, it will always keep the bookmark chosen and open
export function chooseBookmark(bookmark: string, forceActive?: true | undefined, underworld?: Underworld) {
  ['bookmark-damage',
    'bookmark-movement',
    'bookmark-targeting',
    'bookmark-mana',
    'bookmark-curses',
    'bookmark-blessings',
    'bookmark-soul',
    'bookmark-all',
    'bookmark-runes',
    'bookmark-battle-log'].filter(x => x !== bookmark).forEach(className => {
      elInventoryContainer.classList.toggle(className, false);
    });
  Array.from(document.querySelectorAll('.bookmark'))
    .filter((el) => el.id !== bookmark)
    .forEach((el) => el.classList.toggle('active', false));
  elInventoryContainer.classList.toggle(bookmark, forceActive);
  document.getElementById(bookmark)?.classList.toggle('active', forceActive);
  if (bookmark == 'bookmark-runes') {
    if (underworld) {
      renderRunesMenu(underworld);
      // Toggle off glow once stat points are seen
      tryShowStatPointsSpendable();
    } else {
      console.error('Attempted to render runes menu but underworld is undefined');
    }
  } else if (bookmark == 'bookmark-battle-log') {
    if (underworld) {
      renderBattleLog(underworld);
    } else {
      console.error('Attempted to render battle log but underworld is undefined');
    }
  }

}
let elBgGolem = document.querySelector('.bg.golem') as HTMLElement;
let elBgBlue = document.querySelector('.bg.blue') as HTMLElement;
let elBgGreen = document.querySelector('.bg.green') as HTMLElement;
let elBgPriest = document.querySelector('.bg.priest') as HTMLElement;
let elBgRed = document.querySelector('.bg.red') as HTMLElement;
let elBgVamp = document.querySelector('.bg.vampire') as HTMLElement;
function animateMenu() {
  if (!elBgGolem || !elBgBlue || !elBgGreen || !elBgPriest || !elBgRed || !elBgVamp) {
    elBgGolem = document.querySelector('.bg.golem') as HTMLElement;
    elBgBlue = document.querySelector('.bg.blue') as HTMLElement;
    elBgGreen = document.querySelector('.bg.green') as HTMLElement;
    elBgPriest = document.querySelector('.bg.priest') as HTMLElement;
    elBgRed = document.querySelector('.bg.red') as HTMLElement;
    elBgVamp = document.querySelector('.bg.vampire') as HTMLElement;
  }

  [
    { el: elBgGolem, speed: 0.05, maxDriftDist: 40, excludeNegativeJitter: true },
    { el: elBgBlue, speed: 0.05, maxDriftDist: 30 },
    { el: elBgGreen, speed: 0.05, maxDriftDist: 25 },
    { el: elBgPriest, speed: 0.05, maxDriftDist: 25 },
    { el: elBgRed, speed: 0.05, maxDriftDist: 25 },
    { el: elBgVamp, speed: 0.02, maxDriftDist: 10 },

  ].forEach(({ el, speed, maxDriftDist, excludeNegativeJitter }) => {

    if (el) {
      const tx = parseInt(el.dataset.tx || '0');
      const ty = parseInt(el.dataset.ty || '0');
      const x = parseFloat(el.dataset.x || '0');
      const y = parseFloat(el.dataset.y || '0');
      const distToTarget = distance({ x, y }, { x: tx, y: ty });
      // Pick new point to float to
      if (distToTarget <= 1) {
        const newLocation = jitter({ x: 0, y: 0 }, maxDriftDist);
        // The golem image is clipped at the bottom and so shall not drift to negative
        // coordinates or else the clipping will show
        if (excludeNegativeJitter) {
          newLocation.x = Math.abs(newLocation.x);
          newLocation.y = Math.abs(newLocation.y);
        }
        const newTx = Math.floor(newLocation.x);
        const newTy = Math.floor(newLocation.y);
        el.dataset.tx = newTx.toString();
        el.dataset.ty = newTy.toString();
        el.dataset.startDist = distance({ x, y }, { x: newTx, y: newTy }).toString();
      }
      const distFromStart = distToTarget / (parseFloat(el.dataset.startDist || '1') || 1);
      const result = similarTriangles(tx - x, ty - y, distToTarget, easeOutCubic(distFromStart) * speed)
      const newX = x + result.x;
      const newY = y + result.y;
      if (!isNaN(newX) && !isNaN(newY)) {
        el.dataset.x = (x + result.x).toString();
        el.dataset.y = (y + result.y).toString();
        el.style.transform = `translate(${x + result.x}px, ${y + result.y}px)`;
        // Reposition green to make space for the logo
        if (el == elBgGreen) {
          el.style.transform += ` translate(-50px, 383.0226px) scale(1.8)`;
        }
      }

    }
  })


  if (globalThis.view === View.Menu) {
    requestAnimationFrame(animateMenu);
  }
}