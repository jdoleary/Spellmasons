import { getLoopableIndex } from "./Polygon2";
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
    musicInstance.addEventListener("ended", function () {
        playNextSong();
    });
    // Temp; TODO: Base music volume is too loud, (remove "* 0.5" when fixed)
    // task: Master all audio and sfx
    // task: Make independent volume sliders for audio and music
    musicInstance.volume = window.volume * window.volumeMusic * 0.5;
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
    audioInstance.volume = window.volume * window.volumeGame;
    audioInstance.play();

}

const STORAGE_OPTIONS = 'OPTIONS';
export function setupAudio() {
    console.log('Setup: Audio');
    window.playMusic = playNextSong;
    window.changeVolume = (volume: number) => {
        window.volume = volume;
        storage.assign(STORAGE_OPTIONS, { volume: window.volume });
        if (musicInstance) {
            musicInstance.volume = window.volume * window.volumeMusic;
        }
    };
    window.changeVolumeMusic = (volume: number) => {
        window.volumeMusic = volume;
        storage.assign(STORAGE_OPTIONS, { volumeMusic: window.volumeMusic });
        if (musicInstance) {
            musicInstance.volume = window.volume * window.volumeMusic;
        }
    };
    window.changeVolumeGame = (volume: number) => {
        window.volumeGame = volume;
        storage.assign(STORAGE_OPTIONS, { volumeGame: window.volumeGame });
    };
    // Retrieve audio settings from storage
    const storedOptions = storage.get(STORAGE_OPTIONS);
    if (storedOptions !== null) {
        const options = JSON.parse(storedOptions);
        if (options.volume) {
            window.changeVolume(options.volume);
        }
        if (options.volumeMusic) {
            window.changeVolumeMusic(options.volumeMusic);
        }
        if (options.volumeGame) {
            window.changeVolumeGame(options.volumeGame);
        }
    }
}