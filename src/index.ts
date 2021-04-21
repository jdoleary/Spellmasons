import type PieClient from 'pie-client';
import type * as Player from './Player';
import type Game from './Game';
import AnimationTimeline from './AnimationTimeline';

// Mount svelte app
// @ts-ignore
import App from './ui/App.svelte';
new App({
  target: document.getElementById('svelte-mount'),
});

console.log(
  `${Math.round(
    // @ts-ignore
    (new Date('2021-04-21') - new Date()) / 1000 / 60 / 60 / 24,
  )} days until Gameplay core is due!`,
);

window.animationTimeline = new AnimationTimeline();

declare global {
  interface Window {
    animationTimeline: AnimationTimeline;
    game: Game;
    // A reference to the player instance of the client playing on this instance
    player: Player.IPlayer;
    save: (title: string) => void;
    load: (title: string) => void;
    // Save pie messages for later replay
    saveReplay: (title: string) => void;
    // Used to replay onData messages for development
    replay: (title: string) => void;
    // Current clients id
    clientId: string;
    // Shows the "planningView" where golems can attack,
    // allows for left clicking to ping to other players
    planningViewActive: boolean;
    animatingSpells: boolean;
    pie: PieClient;
  }
}
