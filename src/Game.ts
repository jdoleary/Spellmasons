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
export default class Game {
  state: game_state;
  height: number = config.BOARD_HEIGHT;
  width: number = config.BOARD_WIDTH;
  players: Player[] = [];
  units: Unit[] = [];
  spells: Spell[] = [];
  constructor() {
    this.setGameState(game_state.Lobby);
  }
  setDebug(json) {
    debugEl.innerHTML = JSON.stringify(Object.assign(debugInfo, json), null, 2);
  }
  setGameState(g: game_state) {
    this.state = g;
    this.setDebug({ state: game_state[this.state] });
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
    unit.game = this;
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
      window.addToLog(
        `You are at ${spell.caster.mana}`,
        spell.caster.client_id,
      );
      this.spells.push(spell);
    }
  }
  cast(spell: Spell) {
    console.log('Game.cast spell', spell);
    const { target_x, target_y } = spell;
    const targets = this.getUnitsAt(target_x, target_y);
    if (targets.length) {
      for (let unit of targets) {
        effect(spell, { unit, game: this });
      }
    } else {
      effect(spell, { game: this });
    }
  }
  nextTurn() {
    // Clear log
    window.log = [];
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
    }

    // Clean up DOM of dead units
    for (let u of this.units) {
      if (!u.alive) {
        // Remove image from DOM
        u.image.cleanup();
      }
    }
    // Remove dead units
    this.units = this.units.filter((u) => u.alive);

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
      // Lastly, Check for gameover
      if (p.heart_health <= 0) {
        this.setGameState(game_state.GameOver);
        this.state = game_state.GameOver;
        window.addToLog('GAME OVER');
      }
    }

    // Animate everything
    requestAnimationFrame(window.animationManager.animate);
  }
}
