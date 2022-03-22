import { connect_to_wsPie_server, isConnected, joinRoom } from './wsPieSetup';

export default function addMenuEventListeners(setupPixiPromise: Promise<void>) {
    if (
        document.readyState === "complete" ||
        document.readyState === "interactive"
    ) {
        // call on next available tick
        setTimeout(addFormListeners, 1);
    } else {
        document.addEventListener("DOMContentLoaded", addFormListeners);
    }
    function addFormListeners() {
        const elServerChooser = document.getElementById("server-chooser") as HTMLFormElement;
        if (elServerChooser) {
            elServerChooser.addEventListener("submit", (event) => {
                event.preventDefault();
                const formData = new FormData(elServerChooser);
                const { wsUrl } = Object.fromEntries(formData);
                if (wsUrl) {
                    connect_to_wsPie_server(wsUrl as string).then(() => {
                        elGameChooser.classList.remove('hidden');
                    });
                }
            });
        } else {
            console.error('elServerChooser is undefined');

        }
        const elGameChooser = document.getElementById("game-chooser") as HTMLFormElement;
        if (elGameChooser) {
            elGameChooser.addEventListener("submit", (event) => {
                event.preventDefault();
                const formData = new FormData(elGameChooser);
                const { gameName } = Object.fromEntries(formData);

                if (isConnected()) {
                    // Must not join a room until pixi is setup
                    setupPixiPromise.then(() => {
                        console.log("Setup: Loading complete.. initialize game")
                        // Now that we are both connected to the pieServer and assets are loaded,
                        // we can host or join a game
                        // TODO: differentiate making room and joining room
                        joinRoom({ name: gameName })
                    });
                } else {
                    console.error('Cannot join room until pieClient is connected to a pieServer');
                }
            });
        } else {
            console.error('elServerChooser is undefined');

        }
        const elSinglePlayer = document.getElementById("singleplayer") as HTMLElement;
        elSinglePlayer.addEventListener('click', () => {
            connect_to_wsPie_server().then(() => {
                joinRoom({});
            });
        });
        const elMultiplayer = document.getElementById("multiplayer") as HTMLElement;
        elMultiplayer.addEventListener('click', () => {
            elServerChooser.classList.remove('hidden');
        });
    }

}
