import { getLoopableIndex } from "./jmath/Polygon2";
import * as storage from "./storage";

export const sfx: { [key: string]: string } = {
    whoosh: './sound/sfx/whoosh.m4a',
    hurt: './sound/sfx/hurt.mp3',
    cast: './sound/sfx/cast.mp3'
};
export const sfxPageTurn = [
    // './sound/sfx/page-turn-1.flac',
    './sound/sfx/page-turn-2.flac',
];
const music = [
    './sound/music/ChainingSpells.m4a',
    './sound/music/FirstSteps.mp3',
    './sound/music/DeepWandering.mp3',
]

// Preload all sounds
Object.values(sfx).forEach(path => {
    new Audio(path);
});

let songIndex = Math.round(Math.random() * music.length - 1);
let musicInstance: HTMLAudioElement;
export function playNextSong() {
    console.log('playNextSong', musicInstance);
    // If there is currently a song playing, stop it
    if (musicInstance) {
        musicInstance.pause();
        musicInstance.remove();
    }
    // Loops through songs
    const index = getLoopableIndex(songIndex++, music)
    musicInstance = new Audio(music[index]);
    musicInstance.loop = true;

    // Temp; TODO: Base music volume is too loud, (remove "* 0.5" when fixed)
    // task: Master all audio and sfx
    // task: Make independent volume sliders for audio and music
    musicInstance.volume = (globalThis.volume || 1) * (globalThis.volumeMusic || 1) * 0.5;
    musicInstance.play();
}

export function playSFXKey(key?: string) {
    if (!key) {
        return
    }
    playSFX(sfx[key]);
}
export function playSFX(path?: string) {
    if (!path) {
        return;
    }
    console.log('sfx:', path);
    // In order to allow sounds to overlap, they must be 
    // fully instantiated each time they are played
    const audioInstance = new Audio(path);
    audioInstance.volume = (globalThis.volume || 1) * (globalThis.volumeGame || 1);
    audioInstance.play();

}

const STORAGE_OPTIONS = 'OPTIONS';
export function setupAudio() {
    console.log('Setup: Audio');
    globalThis.changeVolume = (volume: number) => {
        globalThis.volume = volume;
        storage.assign(STORAGE_OPTIONS, { volume: globalThis.volume });
        if (musicInstance) {
            musicInstance.volume = globalThis.volume * (globalThis.volumeMusic || 1);
        }
    };
    globalThis.changeVolumeMusic = (volume: number) => {
        globalThis.volumeMusic = volume;
        storage.assign(STORAGE_OPTIONS, { volumeMusic: globalThis.volumeMusic });
        if (musicInstance) {
            musicInstance.volume = (globalThis.volume || 1) * globalThis.volumeMusic;
        }
    };
    globalThis.changeVolumeGame = (volume: number) => {
        globalThis.volumeGame = volume;
        storage.assign(STORAGE_OPTIONS, { volumeGame: globalThis.volumeGame });
    };
    // Retrieve audio settings from storage
    const storedOptions = storage.get(STORAGE_OPTIONS);
    if (storedOptions !== null) {
        const options = JSON.parse(storedOptions);
        if (options.volume) {
            globalThis.changeVolume(options.volume);
        }
        if (options.volumeMusic) {
            globalThis.changeVolumeMusic(options.volumeMusic);
        }
        if (options.volumeGame) {
            globalThis.changeVolumeGame(options.volumeGame);
        }
    }
}