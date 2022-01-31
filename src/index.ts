import type { Route } from './routes';
import AnimationTimeline from './AnimationTimeline';
import type * as Player from './Player';
import type Underworld from './Underworld';
import type { IOverworld } from './overworld';
import { setView, View } from './views';

window.animationTimeline = new AnimationTimeline();
setView(View.Menu);

declare global {
  interface Window {
    latencyPanel: Stats.Panel;
    animationTimeline: AnimationTimeline;
    underworld: Underworld;
    overworld: IOverworld;
    // A reference to the player instance of the client playing on this instance
    player: Player.IPlayer | undefined;
    pie: any;
    save: (title: string) => void;
    load: (title: string) => void;
    // Save pie messages for later replay
    saveReplay: (title: string) => void;
    // Used to replay onData messages for development
    replay: (title: string) => void;
    // Current clients id
    clientId: string;
    // allows for left clicking to ping to other players
    altDown: boolean;
    animatingSpells: boolean;
    setRoute: (r: Route) => void;
    route: Route;
    view: View;
    // For development use
    giveMeCard: (cardId: string, quantity: number) => void;
  }
}
