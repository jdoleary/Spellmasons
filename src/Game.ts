import type Unit from './Unit';
import { Spell, effect, getManaCost } from './Spell';
import type Player from './Player';
import * as config from './config';

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
  players: Player[] = [];
  units: Unit[] = [];
  spells: Spell[] = [];
  constructor() {
    this.setGameState(game_state.Lobby);
    window.game = this;
  }
  setGameState(g: game_state) {
    this.state = g;
    window.setDebug({ state: game_state[this.state] });
  }
  getUnitsWithinDistanceOfPoint(
    x: number,
    y: number,
    distance: number,
  ): Unit[] {
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
    ignore: Unit[] = [],
  ): Unit[] {
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
  getUnitsAt(x?: number, y?: number): Unit[] {
    return this.units.filter((u) => u.x === x && u.y === y);
  }
  getPlayerAt(heart_x: number, heart_y: number): Player | undefined {
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
  summon(unit: Unit) {
    this.units.push(unit);
  }
  queueSpell(spell: Spell) {
    // Check mana:
    const cost = getManaCost(spell);
    if (cost > spell.caster.mana) {
      window.addToLog(
        `You have insuffient mana to cast that spell`,
        spell.caster.client_id,
      );
      return;
    } else {
      spell.caster.mana -= cost;
      window.setDebug({ mana: spell.caster.mana });
      this.spells.push(spell);
    }
  }
  cast(spell: Spell) {
    const { target_x, target_y } = spell;
    const targets = this.getUnitsAt(target_x, target_y);
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
    // Clear log
    window.log = [];

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
    // Remove all spells, now that they are cast
    // TODO traps shouldn't be removed unless they are cast
    this.spells = [];

    // Move units
    for (let u of this.units) {
      u.move();
      u.justSpawned = false;
    }

    // Unfreeze frozen units
    for (let u of this.units) {
      if (u.frozen) {
        window.addToLog(`Unit at (${u.x}, ${u.y}) unfreezes.`);
        u.frozen = false;
      }
    }

    // Restore player mana
    for (let p of this.players) {
      p.mana = p.mana_max;
      window.setDebug({ mana: p.mana });
      // Lastly, Check for gameover
      if (p.heart_health <= 0) {
        this.setGameState(game_state.GameOver);
        this.state = game_state.GameOver;
        window.addToLog('GAME OVER');
      }
    }

    // Animate everything
    return window.animationManager.startAnimate();
  }
}
