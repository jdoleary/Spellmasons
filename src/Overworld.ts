import PieClient from "@websocketpie/client";
import { setupDevGlobalFunctions } from "./devUtils";
import { registerAdminContextMenuOptions } from "./graphics/ui/eventListeners";
import { setupNetworkHandlerGlobalFunctions } from "./network/networkHandler";
import { IHostApp } from "./network/networkUtil";
import Underworld from "./Underworld";
import * as Cards from './cards';
import * as Units from './entity/units';
import * as CardUI from './graphics/ui/CardUI';
import { addOverworldEventListeners } from "./views";

export interface Overworld {
    underworld: Underworld;
    pie: PieClient | IHostApp;
}
// Overworld exists so that functions that need a reference to an underworld
// can hold on to a persistant reference which CONTAINS the lastest underworld reference.
// This allows Underworlds to be created and destroyed without invalidating functions
// (like event listeners) that need to keep a reference to the current underworld
export default function makeOverworld(pie: PieClient | IHostApp, seed: string): Overworld {
    const overworld = {
        pie,
        underworld: new Underworld(pie, seed),
    };
    changeUnderworld(overworld, overworld.underworld);

    // Initialize content
    Cards.registerCards(overworld);
    Units.registerUnits();

    addOverworldEventListeners(overworld);
    registerAdminContextMenuOptions(overworld);
    // Setup global functions that need access to underworld:
    setupNetworkHandlerGlobalFunctions(overworld);
    setupDevGlobalFunctions(overworld);

    // Setup UI event listeners
    CardUI.setupCardUIEventListeners(overworld);

    // When the game is ready to process wsPie messages, begin
    // processing them
    // The game is ready when the following have been loaded
    // - wsPieConnection
    // - wsPieRoomJoined 
    // - pixiAssets 
    // - content (register cards and untis)
    // - underworld

    return overworld;
}
export function changeUnderworld(overworld: Overworld, newUnderworld: Underworld) {
    overworld.underworld = newUnderworld;
    // Set back ref
    overworld.underworld.overworld = overworld;
}
// window.test_GC_underworld = () => {
//     for (let i = 0; i < 1000; i++) {
//         changeUnderworld(test, new Underworld(test.pie, Math.random().toString()));
//     }
// }