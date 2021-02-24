import { Spell, effect, getManaCost, getImage } from './Spell';
import type { IPlayer } from './Player';
import * as config from './config';
import * as Unit from './Unit';
import Image from './Image';
import * as UI from './ui/UserInterface';
import floatingText from './FloatingText';

export enum game_state {
  Lobby,
  WaitingForPlayerReconnect,
  Playing,
  GameOver,
}
const debugInfo = {};
const debugEl = document.getElementById('debug');
window.setDebug = function setDebug(json) {
  if (debugEl) {
    debugEl.innerHTML = JSON.stringify(Object.assign(debugInfo, json), null, 2);
  }
};
export default class Game {
  state: game_state;
  height: number = config.BOARD_HEIGHT;
  width: number = config.BOARD_WIDTH;
  players: IPlayer[] = [];
  units: Unit.IUnit[] = [];
  spells: Spell[] = [];
  // Keeps track of which players have ended their turn
  turn_finished: { [clientId: string]: boolean } = {};
  constructor() {
    this.setGameState(game_state.Lobby);
    window.game = this;
  }
  setGameState(g: game_state) {
    this.state = g;
    const state = game_state[this.state];
    const elBoard = document.getElementById('board');
    switch (state) {
      case 'Playing':
        if (elBoard) {
          elBoard.style.visibility = 'visible';
        }
        break;
      default:
        if (elBoard) {
          elBoard.style.visibility = 'hidden';
        }
    }
    window.setDebug({ state });
  }
  getUnitsWithinDistanceOfPoint(
    x: number,
    y: number,
    distance: number,
  ): Unit.IUnit[] {
    return this.units.filter((u) => {
      return (
        u.x <= x + distance &&
        u.x >= x - distance &&
        u.y <= y + distance &&
        u.y >= y - distance
      );
    });
  }
  getTouchingUnitsRecursive(
    x: number,
    y: number,
    distance: number,
    ignore: Unit.IUnit[] = [],
  ): Unit.IUnit[] {
    let touching = this.units.filter((u) => {
      return (
        u.x <= x + distance &&
        u.x >= x - distance &&
        u.y <= y + distance &&
        u.y >= y - distance &&
        !ignore.includes(u)
      );
    });
    ignore = ignore.concat(touching);
    for (let u of touching) {
      touching = touching.concat(
        this.getTouchingUnitsRecursive(u.x, u.y, distance, ignore),
      );
    }
    return touching;
  }
  getUnitsAt(x?: number, y?: number): Unit.IUnit[] {
    return this.units.filter((u) => u.x === x && u.y === y);
  }
  getPlayerAt(heart_x: number, heart_y: number): IPlayer | undefined {
    for (let p of this.players) {
      // Only one has to match
      // Example heart postions are
      // p.heart_x = -1; p.heart_y = undefined;
      // p.heart_y = 8; p.heart_x = undefined;
      if (p.heart_x === heart_x || p.heart_y === heart_y) {
        return p;
      }
    }
  }
  summon(unit: Unit.IUnit) {
    this.units.push(unit);
  }
  queueSpell(spell: Spell) {
    // Check mana:
    const cost = getManaCost(spell);
    if (cost > spell.caster.mana) {
      floatingText({
        cellX: spell.x,
        cellY: spell.y,
        text: 'Insufficient Mana',
        color: 'blue',
      });
      return;
    } else {
      spell.caster.mana -= cost;
      if (spell.caster.clientId === window.clientId) {
        UI.setCurrentMana(spell.caster.mana);
      }
      // Only show spell images for the client who casted it
      if (window.clientId == (spell.caster && spell.caster.clientId)) {
        spell.image = new Image(spell.x, spell.y, 0, 0, getImage(spell));
      }
      this.spells.push(spell);
    }
  }
  cast(spell: Spell) {
    const { x, y } = spell;
    const targets = this.getUnitsAt(x, y);
    if (targets.length) {
      // If there are multiple targets, group their animations together
      window.animationManager.startGroup();
      for (let unit of targets) {
        effect(spell, { unit, game: this });
      }
      window.animationManager.endGroup();
    } else {
      effect(spell, { game: this });
    }
  }
  nextTurn(): Promise<void> {
    // Clean up DOM of dead units
    // Note: This occurs at the beginning of a turn so that "dead" units can animate to death
    // after they take mortally wounding damage without their html elements being removed before
    // the animation takes place
    for (let u of this.units) {
      if (!u.alive) {
        // Remove image from DOM
        u.image.cleanup();
      }
    }
    // Remove dead units
    this.units = this.units.filter((u) => u.alive);

    // Cast spells
    for (let sm of this.spells) {
      this.cast(sm);
    }
    // Remove all casted spells
    this.spells
      .filter((s) => s.isCast)
      .forEach((s) => {
        // Remove spell images once they are cast
        s.image?.cleanup();
      });
    this.spells = this.spells.filter((s) => !s.isCast);

    // Move units
    for (let u of this.units) {
      Unit.move(u);
      u.justSpawned = false;
    }

    // Unfreeze frozen units
    for (let u of this.units) {
      if (u.frozen) {
        u.frozen = false;
      }
    }

    // Restore player mana
    for (let p of this.players) {
      p.mana = p.mana_max;
      UI.setCurrentMana(p.mana, p.mana_max);
      // Lastly, Check for gameover
      if (p.heart_health <= 0) {
        this.setGameState(game_state.GameOver);
        this.state = game_state.GameOver;
        alert('Game Over');
      }
    }

    // Animate everything
    return window.animationManager.startAnimate();
  }
}
